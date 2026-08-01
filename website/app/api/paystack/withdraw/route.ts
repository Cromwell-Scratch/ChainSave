import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type WithdrawalBody = {
  amount?: number;
  currency?: string;
  destinationType?: "mobile_money" | "ghipss";
  destinationName?: string;
  destinationAccount?: string;
  destinationBankCode?: string;
};

type PaystackRecipientResponse = {
  status: boolean;
  message: string;
  data?: {
    recipient_code: string;
  };
};

type PaystackTransferResponse = {
  status: boolean;
  message: string;
  data?: {
    transfer_code?: string;
    reference?: string;
    status?: string;
  };
};

function createWithdrawalReference() {
  return `CSWDL-${Date.now()}-${crypto
    .randomUUID()
    .replaceAll("-", "")}`;
}

export async function POST(request: NextRequest) {
  let providerReference: string | null = null;

  try {
    const authorizationHeader =
      request.headers.get("authorization");

    const accessToken = authorizationHeader?.replace(
      /^Bearer\s+/i,
      ""
    );

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const paystackSecretKey =
      process.env.PAYSTACK_SECRET_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey ||
      !paystackSecretKey
    ) {
      console.error(
        "Missing withdrawal environment variables."
      );

      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as WithdrawalBody;

    const amount = Number(body.amount);
    const currency = String(
      body.currency ?? ""
    ).toUpperCase();

    const destinationType = body.destinationType;
    const destinationName =
      body.destinationName?.trim() ?? "";
    const destinationAccount =
      body.destinationAccount?.trim() ?? "";
    const destinationBankCode =
      body.destinationBankCode?.trim() ?? "";

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { error: "Enter a valid withdrawal amount." },
        { status: 400 }
      );
    }

    if (currency !== "GHS") {
      return NextResponse.json(
        {
          error:
            "This Paystack account currently supports GHS withdrawals only.",
        },
        { status: 400 }
      );
    }

    if (
      destinationType !== "mobile_money" &&
      destinationType !== "ghipss"
    ) {
      return NextResponse.json(
        { error: "Select a valid withdrawal method." },
        { status: 400 }
      );
    }

    if (
      !destinationName ||
      !destinationAccount ||
      !destinationBankCode
    ) {
      return NextResponse.json(
        {
          error:
            "Complete all withdrawal destination details.",
        },
        { status: 400 }
      );
    }

    const userSupabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Your session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    const { data: wallet, error: walletError } =
      await userSupabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (walletError || !wallet) {
      console.error(
        "Withdrawal wallet lookup failed:",
        walletError
      );

      return NextResponse.json(
        { error: "Wallet not found." },
        { status: 404 }
      );
    }

    /*
     * Paystack expects GHS transfer amounts in pesewas.
     */
    const amountInSubunit = Math.round(amount * 100);

    if (amountInSubunit <= 0) {
      return NextResponse.json(
        { error: "Withdrawal amount is too small." },
        { status: 400 }
      );
    }

    /*
     * Step 1: Create the Paystack transfer recipient.
     */
    const recipientResponse = await fetch(
      "https://api.paystack.co/transferrecipient",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: destinationType,
          name: destinationName,
          account_number: destinationAccount,
          bank_code: destinationBankCode,
          currency: "GHS",
          description: "ChainSave wallet withdrawal",
        }),
        cache: "no-store",
      }
    );

    const recipientResult =
      (await recipientResponse.json()) as PaystackRecipientResponse;

    const recipientCode =
      recipientResult.data?.recipient_code;

    if (
      !recipientResponse.ok ||
      !recipientResult.status ||
      !recipientCode
    ) {
      console.error(
        "Paystack recipient creation failed:",
        recipientResult
      );

      return NextResponse.json(
        {
          error:
            recipientResult.message ??
            "Unable to create the withdrawal recipient.",
        },
        { status: 400 }
      );
    }

    providerReference = createWithdrawalReference();

    /*
     * Step 2: Reserve the user's funds atomically.
     */
    const {
      data: withdrawalId,
      error: reservationError,
    } = await userSupabase.rpc(
      "reserve_wallet_withdrawal",
      {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_currency: currency,
        p_destination_type: destinationType,
        p_destination_name: destinationName,
        p_destination_account: destinationAccount,
        p_destination_bank_code:
          destinationBankCode,
        p_provider_reference:
          providerReference,
      }
    );

    if (reservationError) {
      console.error(
        "Withdrawal reservation failed:",
        reservationError
      );

      return NextResponse.json(
        {
          error:
            reservationError.message ??
            "Unable to reserve withdrawal funds.",
        },
        { status: 400 }
      );
    }

    /*
     * Step 3: Initiate the Paystack transfer.
     */
    const transferResponse = await fetch(
      "https://api.paystack.co/transfer",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "balance",
          amount: amountInSubunit,
          recipient: recipientCode,
          reference: providerReference,
          reason: "ChainSave wallet withdrawal",
          currency: "GHS",
        }),
        cache: "no-store",
      }
    );

    const transferResult =
      (await transferResponse.json()) as PaystackTransferResponse;

    if (
      !transferResponse.ok ||
      !transferResult.status ||
      !transferResult.data
    ) {
      console.error(
        "Paystack transfer initialization failed:",
        transferResult
      );

      /*
       * Paystack did not accept the transfer, so release
       * the reserved funds immediately.
       */
      const adminSupabase = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      const { error: releaseError } =
        await adminSupabase.rpc(
          "release_wallet_withdrawal",
          {
            p_provider_reference:
              providerReference,
            p_status: "failed",
            p_failure_reason:
              transferResult.message ??
              "Paystack transfer initialization failed",
          }
        );

      if (releaseError) {
        console.error(
          "Withdrawal release failed:",
          releaseError
        );
      }

      return NextResponse.json(
        {
          error:
            transferResult.message ??
            "Unable to initiate the withdrawal.",
        },
        { status: 400 }
      );
    }

    /*
     * Record Paystack recipient/transfer codes and mark
     * the request as processing. Final completion comes
     * from the webhook.
     */
    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { error: updateError } =
      await adminSupabase
        .from("wallet_withdrawals")
        .update({
          status: "processing",
          provider_recipient_code: recipientCode,
          provider_transfer_code:
            transferResult.data.transfer_code ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

    if (updateError) {
      console.error(
        "Withdrawal status update failed:",
        updateError
      );
    }

    return NextResponse.json({
      success: true,
      withdrawalId,
      reference: providerReference,
      transferCode:
        transferResult.data.transfer_code ?? null,
      status:
        transferResult.data.status ?? "processing",
      message:
        "Withdrawal submitted. Your funds are reserved while Paystack processes the transfer.",
    });
  } catch (error) {
    console.error(
      "Unexpected withdrawal error:",
      error
    );

    /*
     * An unexpected error after reservation should release
     * the funds where possible.
     */
    if (providerReference) {
      try {
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL;

        const serviceRoleKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && serviceRoleKey) {
          const adminSupabase = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
            }
          );

          await adminSupabase.rpc(
            "release_wallet_withdrawal",
            {
              p_provider_reference:
                providerReference,
              p_status: "failed",
              p_failure_reason:
                "Unexpected withdrawal processing error",
            }
          );
        }
      } catch (releaseError) {
        console.error(
          "Unexpected withdrawal release error:",
          releaseError
        );
      }
    }

    return NextResponse.json(
      { error: "Unable to process withdrawal." },
      { status: 500 }
    );
  }
}