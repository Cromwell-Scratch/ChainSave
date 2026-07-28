import { createClient } from "@supabase/supabase-js";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

type ContributionRequestBody = {
  circleId?: string;
};

type ContributionResult = {
  success: boolean;
  circle_id: string;
  member_id: string;
  round_number: number;
  contribution_id: string;
  wallet_transaction_id: string;
  amount: number;
  currency: string;
  wallet_balance: number;
  accepted_members: number;
  completed_contributions: number;
  expected_round_total: number;
  completed_round_total: number;
  round_complete: boolean;
};

type RoundProcessorResult = {
  success?: boolean;
  processed?: boolean;
  reason?: string;
  circle_completed?: boolean;
  circle_id?: string;
  round_number?: number;
  completed_round?: number;
  next_round?: number;
  payout_member_id?: string;
  payout_user_id?: string;
  payout_amount?: number;
  wallet_transaction_id?: string;
  next_payout_member_id?: string;
  next_payout_user_id?: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Required Supabase environment variables are missing.",
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
          success: false,
          error: "Authentication is required.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorizationHeader.slice(
        "Bearer ".length
      );

    const body =
      (await request.json()) as ContributionRequestBody;

    const circleId = body.circleId?.trim();

    if (!circleId) {
      return NextResponse.json(
        {
          success: false,
          error: "A circle ID is required.",
        },
        { status: 400 }
      );
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(circleId)) {
      return NextResponse.json(
        {
          success: false,
          error: "The circle ID is invalid.",
        },
        { status: 400 }
      );
    }

    const userClient = createClient(
      supabaseUrl,
      supabasePublishableKey,
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
    } = await userClient.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    const {
      data,
      error,
    } = await userClient.rpc(
      "make_circle_contribution",
      {
        p_circle_id: circleId,
      }
    );

    if (error) {
      console.error(
        "Contribution RPC error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message ||
            "Unable to complete the contribution.",
        },
        { status: 400 }
      );
    }

    const result =
      data as ContributionResult | null;

    if (!result?.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The contribution could not be completed.",
        },
        { status: 400 }
      );
    }

    let payoutResult:
      | RoundProcessorResult
      | null = null;

    let payoutError:
      | string
      | null = null;

    if (Boolean(result.round_complete)) {
      try {
        const {
          data: processorData,
          error: processorError,
        } = await userClient.rpc(
          "process_circle_round",
          {
            p_circle_id: circleId,
          }
        );

        if (processorError) {
          console.error(
            "Round processor RPC error:",
            processorError
          );

          payoutError =
            processorError.message ||
            "The contribution was completed, but the payout could not be processed.";
        } else {
          payoutResult =
            processorData as
              | RoundProcessorResult
              | null;
        }
      } catch (processorException) {
        console.error(
          "Round processor exception:",
          processorException
        );

        payoutError =
          processorException instanceof Error
            ? processorException.message
            : "The contribution was completed, but the payout could not be processed.";
      }
    }

    return NextResponse.json(
      {
        success: true,

        contributionId:
          result.contribution_id,

        walletTransactionId:
          result.wallet_transaction_id,

        circleId:
          result.circle_id,

        memberId:
          result.member_id,

        roundNumber:
          Number(result.round_number),

        amount:
          Number(result.amount),

        currency:
          result.currency,

        walletBalance:
          Number(result.wallet_balance),

        acceptedMembers:
          Number(result.accepted_members),

        completedContributions:
          Number(
            result.completed_contributions
          ),

        expectedRoundTotal:
          Number(result.expected_round_total),

        completedRoundTotal:
          Number(result.completed_round_total),

        roundComplete:
          Boolean(result.round_complete),

        payoutProcessed:
          Boolean(
            payoutResult?.processed
          ),

        payoutResult,

        payoutError,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Contribution API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete the contribution.",
      },
      { status: 500 }
    );
  }
}