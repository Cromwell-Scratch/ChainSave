import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PaystackVerification = {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    customer?: {
      email?: string;
    };
    metadata?: {
      purpose?: string;
      user_id?: string;
      wallet_id?: string;
      currency?: string;
      amount_major?: number | string;
    };
  };
};

export async function GET(request: NextRequest) {
  try {
    const reference =
      request.nextUrl.searchParams.get("reference")?.trim();

    if (!reference) {
      return NextResponse.json(
        { error: "Transaction reference is required." },
        { status: 400 }
      );
    }

    const paystackSecretKey =
      process.env.PAYSTACK_SECRET_KEY;

    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !paystackSecretKey ||
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      console.error(
        "Missing Paystack or Supabase server environment variables."
      );

      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        cache: "no-store",
      }
    );

    const verification =
      (await paystackResponse.json()) as PaystackVerification;

    if (
      !paystackResponse.ok ||
      !verification.status ||
      !verification.data
    ) {
      console.error(
        "Paystack verification failed:",
        verification
      );

      return NextResponse.json(
        {
          error:
            verification.message ??
            "Unable to verify payment.",
        },
        { status: 400 }
      );
    }

    const transaction = verification.data;

    if (transaction.status !== "success") {
      return NextResponse.json(
        { error: "Payment was not successful." },
        { status: 400 }
      );
    }

    if (transaction.reference !== reference) {
      return NextResponse.json(
        { error: "Transaction reference mismatch." },
        { status: 400 }
      );
    }

    if (
      transaction.metadata?.purpose !==
      "wallet_deposit"
    ) {
      return NextResponse.json(
        { error: "Invalid transaction purpose." },
        { status: 400 }
      );
    }

    const walletId =
      transaction.metadata?.wallet_id;

    const metadataCurrency =
      transaction.metadata?.currency?.toUpperCase();

    const transactionCurrency =
      transaction.currency?.toUpperCase();

    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet information is missing." },
        { status: 400 }
      );
    }

    if (
      !metadataCurrency ||
      metadataCurrency !== transactionCurrency
    ) {
      return NextResponse.json(
        { error: "Transaction currency mismatch." },
        { status: 400 }
      );
    }

    const amountMajor =
      Number(transaction.amount) / 100;

    const expectedAmount =
      Number(transaction.metadata?.amount_major);

    if (
      !Number.isFinite(amountMajor) ||
      amountMajor <= 0 ||
      !Number.isFinite(expectedAmount) ||
      Math.abs(amountMajor - expectedAmount) > 0.000001
    ) {
      return NextResponse.json(
        { error: "Transaction amount mismatch." },
        { status: 400 }
      );
    }

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

    const { error: settlementError } =
      await adminSupabase.rpc(
        "settle_paystack_deposit",
        {
          p_wallet_id: walletId,
          p_currency: transactionCurrency,
          p_amount: amountMajor,
          p_reference: reference,
          p_provider_transaction_id:
            String(transaction.id),
        }
      );

    if (settlementError) {
      console.error(
        "Deposit settlement failed:",
        settlementError
      );

      return NextResponse.json(
        { error: "Unable to credit wallet." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reference,
      amount: amountMajor,
      currency: transactionCurrency,
    });
  } catch (error) {
    console.error(
      "Unexpected verification error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to verify payment." },
      { status: 500 }
    );
  }
}