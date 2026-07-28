import { createClient } from "@supabase/supabase-js";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

type InitializeRequestBody = {
  amount?: number;
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

    if (
      !paystackSecretKey ||
      !supabaseUrl ||
      !supabasePublishableKey
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Required server environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const authorizationHeader =
      request.headers.get("authorization");

    if (
      !authorizationHeader?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          status: false,
          message: "Authentication is required.",
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

    if (
      userError ||
      !user ||
      !user.email
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Your session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as InitializeRequestBody;

    const amount = Number(body.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          status: false,
          message:
            "A valid deposit amount is required.",
        },
        { status: 400 }
      );
    }

    const amountInPesewas = Math.round(
      amount * 100
    );

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: String(amountInPesewas),
          currency: "GHS",
          metadata: {
            chainsave_user_id: user.id,
            deposit_amount: amount,
            purpose: "wallet_deposit",
          },
        }),
        cache: "no-store",
      }
    );

    const result =
      await paystackResponse.json();

    return NextResponse.json(
      result,
      {
        status: paystackResponse.status,
      }
    );
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error
    );

    return NextResponse.json(
      {
        status: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to initialize payment.",
      },
      { status: 500 }
    );
  }
}