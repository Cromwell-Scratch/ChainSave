import { createClient } from "@supabase/supabase-js";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

type VerifyRequestBody = {
  reference?: string;
};

type PaystackVerificationData = {
  id: number | string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  customer?: {
    email?: string | null;
  };
};

type PaystackVerificationResponse = {
  status: boolean;
  message: string;
  data?: PaystackVerificationData;
};

type CreditDepositResult = {
  success: boolean;
  already_credited: boolean;
  transaction_id: string;
  wallet_balance: number;
};

export async function POST(
  request: NextRequest
) {
  try {
    const paystackSecretKey =
      process.env.PAYSTACK_SECRET_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!paystackSecretKey) {
      return NextResponse.json(
        {
          error:
            "PAYSTACK_SECRET_KEY is missing from the server environment.",
        },
        { status: 500 }
      );
    }

    if (
      !supabaseUrl ||
      !supabasePublishableKey ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "Required Supabase server environment variables are missing.",
        },
        { status: 500 }
      );
    }

    /*
     * Require the signed-in user's Supabase access token.
     */
    const authorizationHeader =
      request.headers.get("authorization");

    if (
      !authorizationHeader?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error: "Authentication is required.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorizationHeader.slice(
        "Bearer ".length
      );

    const authClient = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Your session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as VerifyRequestBody;

    const reference = body.reference?.trim();

    if (!reference) {
      return NextResponse.json(
        {
          error:
            "A Paystack transaction reference is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Paystack references only use letters, numbers,
     * hyphens, periods and equals signs.
     */
    if (
      !/^[A-Za-z0-9.\-=]+$/.test(reference)
    ) {
      return NextResponse.json(
        {
          error:
            "The payment reference is invalid.",
        },
        { status: 400 }
      );
    }

    /*
     * Verify directly with Paystack using the secret key.
     */
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const verification =
      (await paystackResponse.json()) as
        PaystackVerificationResponse;

    if (
      !paystackResponse.ok ||
      !verification.status ||
      !verification.data
    ) {
      return NextResponse.json(
        {
          error:
            verification.message ||
            "Paystack could not verify this payment.",
        },
        { status: 400 }
      );
    }

    const payment = verification.data;

    /*
     * response.status only confirms the API call.
     * payment.status confirms the actual transaction.
     */
    if (payment.status !== "success") {
      return NextResponse.json(
        {
          error: `Payment status is ${payment.status}.`,
          paymentStatus: payment.status,
        },
        { status: 400 }
      );
    }

    if (payment.reference !== reference) {
      return NextResponse.json(
        {
          error:
            "The verified reference does not match the submitted reference.",
        },
        { status: 400 }
      );
    }

    if (
      payment.currency?.toUpperCase() !==
      "GHS"
    ) {
      return NextResponse.json(
        {
          error:
            "The verified payment currency is not GHS.",
        },
        { status: 400 }
      );
    }

    const verifiedEmail =
      payment.customer?.email
        ?.trim()
        .toLowerCase();

    const authenticatedEmail =
      user.email?.trim().toLowerCase();

    if (
      !verifiedEmail ||
      !authenticatedEmail ||
      verifiedEmail !== authenticatedEmail
    ) {
      return NextResponse.json(
        {
          error:
            "This payment does not belong to the signed-in account.",
        },
        { status: 403 }
      );
    }

    /*
     * Paystack returns amounts in the currency's
     * smallest denomination, so GHS 100 is 10000.
     */
    const amountInSubunits = Number(
      payment.amount
    );

    if (
      !Number.isInteger(amountInSubunits) ||
      amountInSubunits <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Paystack returned an invalid payment amount.",
        },
        { status: 400 }
      );
    }

    const amountInGhs =
      amountInSubunits / 100;

    const paidAt =
      payment.paid_at ?? new Date().toISOString();

    /*
     * Use the server-only service-role client to
     * call the protected atomic credit function.
     */
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: creditData,
      error: creditError,
    } = await adminClient.rpc(
      "credit_verified_paystack_deposit",
      {
        p_user_id: user.id,
        p_reference: payment.reference,
        p_amount: amountInGhs,
        p_currency:
          payment.currency.toUpperCase(),
        p_paystack_transaction_id: String(
          payment.id
        ),
        p_paid_at: paidAt,
      }
    );

    if (creditError) {
      console.error(
        "Wallet credit RPC error:",
        creditError
      );

      return NextResponse.json(
        {
          error:
            "The payment was verified, but the wallet could not be credited.",
        },
        { status: 500 }
      );
    }

    const result =
      creditData as CreditDepositResult;

    return NextResponse.json(
      {
        success: true,
        reference: payment.reference,
        amount: amountInGhs,
        currency:
          payment.currency.toUpperCase(),
        alreadyCredited:
          Boolean(result.already_credited),
        walletBalance: Number(
          result.wallet_balance
        ),
        transactionId:
          result.transaction_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Paystack verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify the Paystack payment.",
      },
      { status: 500 }
    );
  }
}