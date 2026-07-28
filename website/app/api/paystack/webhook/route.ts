import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaystackMetadata = {
  chainsave_user_id?: string;
  deposit_amount?: number | string;
  purpose?: string;
};

type PaystackChargeData = {
  id: number | string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  metadata?: PaystackMetadata | string | null;
};

type PaystackWebhookEvent = {
  event?: string;
  data?: PaystackChargeData;
};

function parseMetadata(
  metadata: PaystackChargeData["metadata"]
): PaystackMetadata {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === "object") {
    return metadata;
  }

  try {
    return JSON.parse(metadata) as PaystackMetadata;
  } catch {
    return {};
  }
}

function signaturesMatch(
  receivedSignature: string,
  expectedSignature: string
) {
  try {
    const receivedBuffer = Buffer.from(
      receivedSignature,
      "hex"
    );

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "hex"
    );

    if (
      receivedBuffer.length === 0 ||
      receivedBuffer.length !== expectedBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    );
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const paystackSecretKey =
      process.env.PAYSTACK_SECRET_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !paystackSecretKey ||
      !supabaseUrl ||
      !supabaseServiceRoleKey
    ) {
      console.error(
        "Paystack webhook environment variables are missing."
      );

      return NextResponse.json(
        { received: false },
        { status: 500 }
      );
    }

    /*
     * Read the raw request body before parsing JSON.
     * Paystack's signature is generated from the
     * original payload bytes.
     */
    const rawBody = await request.text();

    const receivedSignature =
      request.headers.get(
        "x-paystack-signature"
      );

    if (!receivedSignature) {
      return NextResponse.json(
        {
          received: false,
          error: "Webhook signature is missing.",
        },
        { status: 401 }
      );
    }

    const expectedSignature = createHmac(
      "sha512",
      paystackSecretKey
    )
      .update(rawBody)
      .digest("hex");

    if (
      !signaturesMatch(
        receivedSignature,
        expectedSignature
      )
    ) {
      console.error(
        "Invalid Paystack webhook signature."
      );

      return NextResponse.json(
        {
          received: false,
          error: "Invalid webhook signature.",
        },
        { status: 401 }
      );
    }

    const payload = JSON.parse(
      rawBody
    ) as PaystackWebhookEvent;

    /*
     * Ignore webhook events ChainSave does not use.
     * Returning 200 tells Paystack the event was received.
     */
    if (payload.event !== "charge.success") {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
        },
        { status: 200 }
      );
    }

    const payment = payload.data;

    if (!payment) {
      return NextResponse.json(
        {
          received: false,
          error: "Webhook payment data is missing.",
        },
        { status: 400 }
      );
    }

    if (payment.status !== "success") {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
        },
        { status: 200 }
      );
    }

    const reference =
      payment.reference?.trim();

    if (!reference) {
      return NextResponse.json(
        {
          received: false,
          error: "Payment reference is missing.",
        },
        { status: 400 }
      );
    }

    if (
      payment.currency?.toUpperCase() !==
      "GHS"
    ) {
      console.error(
        "Rejected non-GHS Paystack deposit:",
        payment.currency
      );

      return NextResponse.json(
        {
          received: false,
          error: "Unsupported payment currency.",
        },
        { status: 400 }
      );
    }

    const amountInPesewas = Number(
      payment.amount
    );

    if (
      !Number.isInteger(amountInPesewas) ||
      amountInPesewas <= 0
    ) {
      return NextResponse.json(
        {
          received: false,
          error: "Payment amount is invalid.",
        },
        { status: 400 }
      );
    }

    const metadata = parseMetadata(
      payment.metadata
    );

    if (
      metadata.purpose !== "wallet_deposit"
    ) {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
        },
        { status: 200 }
      );
    }

    const userId =
      metadata.chainsave_user_id?.trim();

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !userId ||
      !uuidPattern.test(userId)
    ) {
      console.error(
        "Paystack webhook has an invalid ChainSave user ID."
      );

      return NextResponse.json(
        {
          received: false,
          error: "Invalid ChainSave user ID.",
        },
        { status: 400 }
      );
    }

    /*
     * Confirm that the amount received matches the
     * amount ChainSave placed in the metadata.
     */
    const expectedDepositAmount = Number(
      metadata.deposit_amount
    );

    const expectedPesewas = Math.round(
      expectedDepositAmount * 100
    );

    if (
      !Number.isFinite(
        expectedDepositAmount
      ) ||
      expectedDepositAmount <= 0 ||
      expectedPesewas !== amountInPesewas
    ) {
      console.error(
        "Paystack deposit amount mismatch:",
        {
          reference,
          expectedPesewas,
          receivedPesewas:
            amountInPesewas,
        }
      );

      return NextResponse.json(
        {
          received: false,
          error:
            "Verified payment amount does not match the initialized deposit.",
        },
        { status: 400 }
      );
    }

    const amountInGhs =
      amountInPesewas / 100;

    const paidAt =
      payment.paid_at ??
      new Date().toISOString();

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

    /*
     * The RPC updates the balance, records the
     * transaction, creates a notification and
     * prevents duplicate references.
     */
    const {
      data: creditData,
      error: creditError,
    } = await adminClient.rpc(
      "credit_verified_paystack_deposit",
      {
        p_user_id: userId,
        p_reference: reference,
        p_amount: amountInGhs,
        p_currency: "GHS",
        p_paystack_transaction_id: String(
          payment.id
        ),
        p_paid_at: paidAt,
      }
    );

    if (creditError) {
      console.error(
        "Paystack webhook wallet credit error:",
        creditError
      );

      /*
       * Return an error so Paystack can retry
       * delivery rather than silently losing it.
       */
      return NextResponse.json(
        {
          received: false,
          error:
            "Wallet could not be credited.",
        },
        { status: 500 }
      );
    }

    console.log(
      "Paystack wallet deposit processed:",
      {
        reference,
        userId,
        amount: amountInGhs,
        result: creditData,
      }
    );

    return NextResponse.json(
      {
        received: true,
        processed: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Paystack webhook processing error:",
      error
    );

    return NextResponse.json(
      {
        received: false,
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}