import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PaystackTransferEvent = {
  event: string;
  data?: {
    id?: number;
    amount?: number;
    currency?: string;
    reference?: string;
    transfer_code?: string;
    recipient?: {
      recipient_code?: string;
    };
    reason?: string;
    status?: string;
    failures?: unknown;
  };
};

export async function POST(request: NextRequest) {
  try {
    const paystackSecretKey =
      process.env.PAYSTACK_SECRET_KEY;

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
        "Paystack webhook configuration is incomplete."
      );

      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    /*
     * The signature must be calculated from the exact raw
     * body received from Paystack.
     */
    const rawBody = await request.text();

    const receivedSignature =
      request.headers.get("x-paystack-signature");

    if (!receivedSignature) {
      return NextResponse.json(
        { error: "Missing Paystack signature." },
        { status: 401 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(rawBody)
      .digest("hex");

    const receivedBuffer = Buffer.from(
      receivedSignature,
      "utf8"
    );

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      )
    ) {
      console.error("Invalid Paystack webhook signature.");

      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(
      rawBody
    ) as PaystackTransferEvent;

    const reference =
      payload.data?.reference?.trim();

    /*
     * Acknowledge unrelated Paystack events without
     * attempting to process them.
     */
    if (
      payload.event !== "transfer.success" &&
      payload.event !== "transfer.failed" &&
      payload.event !== "transfer.reversed"
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    if (!reference) {
      console.error(
        "Transfer webhook is missing its reference.",
        payload
      );

      return NextResponse.json(
        { error: "Transfer reference is missing." },
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

    /*
     * Confirm that this reference belongs to a withdrawal
     * created by ChainSave.
     */
    const {
      data: withdrawal,
      error: withdrawalError,
    } = await adminSupabase
      .from("wallet_withdrawals")
      .select(
        `
          id,
          amount,
          currency,
          status,
          provider_reference
        `
      )
      .eq("provider_reference", reference)
      .maybeSingle();

    if (withdrawalError) {
      console.error(
        "Unable to load webhook withdrawal:",
        withdrawalError
      );

      return NextResponse.json(
        { error: "Unable to load withdrawal." },
        { status: 500 }
      );
    }

    if (!withdrawal) {
      /*
       * Respond successfully so Paystack does not repeatedly
       * retry an event that is unrelated to this system.
       */
      console.warn(
        "Withdrawal not found for Paystack reference:",
        reference
      );

      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const webhookCurrency =
      payload.data?.currency?.toUpperCase();

    const webhookAmount =
      Number(payload.data?.amount ?? 0) / 100;

    if (
      webhookCurrency &&
      webhookCurrency !== withdrawal.currency
    ) {
      console.error(
        "Withdrawal webhook currency mismatch.",
        {
          reference,
          expected: withdrawal.currency,
          received: webhookCurrency,
        }
      );

      return NextResponse.json(
        { error: "Withdrawal currency mismatch." },
        { status: 400 }
      );
    }

    if (
      Number.isFinite(webhookAmount) &&
      webhookAmount > 0 &&
      Math.abs(
        webhookAmount - Number(withdrawal.amount)
      ) > 0.000001
    ) {
      console.error(
        "Withdrawal webhook amount mismatch.",
        {
          reference,
          expected: withdrawal.amount,
          received: webhookAmount,
        }
      );

      return NextResponse.json(
        { error: "Withdrawal amount mismatch." },
        { status: 400 }
      );
    }

    if (payload.event === "transfer.success") {
      const { error: completionError } =
        await adminSupabase.rpc(
          "complete_wallet_withdrawal",
          {
            p_provider_reference: reference,
            p_provider_recipient_code:
              payload.data?.recipient?.recipient_code ??
              "",
            p_provider_transfer_code:
              payload.data?.transfer_code ??
              String(payload.data?.id ?? ""),
          }
        );

      if (completionError) {
        console.error(
          "Unable to complete withdrawal:",
          completionError
        );

        return NextResponse.json(
          { error: "Unable to complete withdrawal." },
          { status: 500 }
        );
      }
    }

    if (
      payload.event === "transfer.failed" ||
      payload.event === "transfer.reversed"
    ) {
      const releaseStatus =
        payload.event === "transfer.reversed"
          ? "reversed"
          : "failed";

      const failureReason =
        payload.data?.reason ??
        `Paystack reported ${releaseStatus}.`;

      const { error: releaseError } =
        await adminSupabase.rpc(
          "release_wallet_withdrawal",
          {
            p_provider_reference: reference,
            p_status: releaseStatus,
            p_failure_reason: failureReason,
          }
        );

      if (releaseError) {
        console.error(
          "Unable to release withdrawal:",
          releaseError
        );

        return NextResponse.json(
          { error: "Unable to release withdrawal." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      received: true,
      event: payload.event,
      reference,
    });
  } catch (error) {
    console.error(
      "Unexpected Paystack webhook error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to process webhook." },
      { status: 500 }
    );
  }
}