import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPPORTED_FIAT_CURRENCIES = new Set([
  "GHS",
  "NGN",
  "KES",
]);

function createReference() {
  return `CSDEP-${Date.now()}-${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function POST(request: NextRequest) {
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

    const paystackSecretKey =
      process.env.PAYSTACK_SECRET_KEY;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      request.nextUrl.origin;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !paystackSecretKey
    ) {
      console.error(
        "Missing Paystack or Supabase environment variables."
      );

      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      amount?: number;
      currency?: string;
    };

    const amount = Number(body.amount);
    const currency = String(
      body.currency ?? ""
    ).toUpperCase();

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { error: "Enter a valid deposit amount." },
        { status: 400 }
      );
    }

    if (!SUPPORTED_FIAT_CURRENCIES.has(currency)) {
      return NextResponse.json(
        {
          error:
            "Paystack deposits currently support GHS, NGN and KES only.",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(
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
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Your session is invalid or expired." },
        { status: 401 }
      );
    }

    const { data: wallet, error: walletError } =
      await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (walletError || !wallet) {
      console.error(
        "Wallet lookup failed:",
        walletError
      );

      return NextResponse.json(
        { error: "Wallet not found." },
        { status: 404 }
      );
    }

    /*
     * GHS, NGN and KES amounts are submitted to
     * Paystack in their smallest denomination.
     */
    const amountInSubunit = Math.round(amount * 100);

    if (amountInSubunit <= 0) {
      return NextResponse.json(
        { error: "Deposit amount is too small." },
        { status: 400 }
      );
    }

    const reference = createReference();

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: String(amountInSubunit),
          currency,
          reference,
          callback_url: `${appUrl}/wallet/paystack/callback`,
          metadata: {
            purpose: "wallet_deposit",
            user_id: user.id,
            wallet_id: wallet.id,
            currency,
            amount_major: amount,
          },
        }),
        cache: "no-store",
      }
    );

    const paystackResult = await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      !paystackResult.status ||
      !paystackResult.data?.authorization_url
    ) {
      console.error(
        "Paystack initialization error:",
        paystackResult
      );

      return NextResponse.json(
        {
          error:
            paystackResult.message ??
            "Unable to initialize payment.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      authorizationUrl:
        paystackResult.data.authorization_url,
      accessCode:
        paystackResult.data.access_code,
      reference:
        paystackResult.data.reference,
    });
  } catch (error) {
    console.error(
      "Unexpected Paystack initialization error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to initialize deposit." },
      { status: 500 }
    );
  }
}