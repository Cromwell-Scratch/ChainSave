import type {
  SupabaseClient,
} from "@supabase/supabase-js";

type ContributionResult = {
  success: boolean;
  circle_id: string;
  member_id: string;
  round_number: number;
  contribution_id: string;
  wallet_transaction_id: string;
  payment_breakdown_id: string;
  revenue_ledger_id: string | null;
  amount: number;
  service_fee: number;
  total_debit: number;
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

export type ProcessContributionResult = {
  contributionId: string;
  walletTransactionId: string;
  paymentBreakdownId: string;
  revenueLedgerId: string | null;
  circleId: string;
  memberId: string;
  roundNumber: number;
  amount: number;
  serviceFee: number;
  totalDebit: number;
  currency: string;
  walletBalance: number;
  acceptedMembers: number;
  completedContributions: number;
  expectedRoundTotal: number;
  completedRoundTotal: number;
  roundComplete: boolean;
  payoutProcessed: boolean;
  payoutResult: RoundProcessorResult | null;
  payoutError: string | null;
};

export async function processContribution({
  userClient,
  circleId,
}: {
  userClient: SupabaseClient;
  circleId: string;
}): Promise<ProcessContributionResult> {
  const { data, error } = await userClient.rpc(
    "make_circle_contribution",
    { p_circle_id: circleId }
  );

  if (error) {
    console.error("Contribution RPC error:", error);
    throw new Error(
      error.message ||
        "Unable to complete the contribution."
    );
  }

  const result = data as ContributionResult | null;

  if (!result?.success) {
    throw new Error(
      "The contribution could not be completed."
    );
  }

  let payoutResult: RoundProcessorResult | null = null;
  let payoutError: string | null = null;

  if (Boolean(result.round_complete)) {
    try {
      const {
        data: processorData,
        error: processorError,
      } = await userClient.rpc(
        "process_circle_round",
        { p_circle_id: circleId }
      );

      if (processorError) {
        console.error(
          "Round processor RPC error:",
          processorError
        );
        payoutError =
          processorError.message ||
          "The contribution succeeded, but the payout could not be processed.";
      } else {
        payoutResult =
          processorData as RoundProcessorResult | null;
      }
    } catch (processorException) {
      console.error(
        "Round processor exception:",
        processorException
      );
      payoutError =
        processorException instanceof Error
          ? processorException.message
          : "The contribution succeeded, but the payout could not be processed.";
    }
  }

  return {
    contributionId: result.contribution_id,
    walletTransactionId:
      result.wallet_transaction_id,
    paymentBreakdownId:
      result.payment_breakdown_id,
    revenueLedgerId:
      result.revenue_ledger_id,
    circleId: result.circle_id,
    memberId: result.member_id,
    roundNumber: Number(result.round_number),
    amount: Number(result.amount),
    serviceFee: Number(result.service_fee),
    totalDebit: Number(result.total_debit),
    currency: result.currency,
    walletBalance: Number(result.wallet_balance),
    acceptedMembers: Number(result.accepted_members),
    completedContributions: Number(
      result.completed_contributions
    ),
    expectedRoundTotal: Number(
      result.expected_round_total
    ),
    completedRoundTotal: Number(
      result.completed_round_total
    ),
    roundComplete: Boolean(result.round_complete),
    payoutProcessed: Boolean(
      payoutResult?.processed
    ),
    payoutResult,
    payoutError,
  };
}
