import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type CircleCreationCharge = {
  userId: string;
  circleId: string;
  currency: string;
  platformFee: number;
  userNetworkFee: number;
  actualNetworkFee: number;
  gasSubsidy: number;
  paymentReference: string;
};

export type ReservedCircleCreationCharge = {
  success: true;
  paymentBreakdownId: string;
  walletTransactionId: string;
  walletId: string;
  currency: string;
  totalCharged: number;
  balanceBefore: number;
  balanceAfter: number;
};

export type FinalizedCircleCreationCharge = {
  success: true;
  alreadyFinalized: boolean;
  paymentBreakdownId: string;
  platformFee?: number;
  userNetworkFee?: number;
  actualNetworkFee?: number;
  gasSubsidy?: number;
};

export type RefundedCircleCreationCharge = {
  success: true;
  alreadyRefunded: boolean;
  paymentBreakdownId: string;
  refundAmount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
};

function assertNonNegativeMoney(
  value: number,
  fieldName: string
) {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be a valid non-negative amount.`
    );
  }
}

export async function reserveCircleCreationCharge(
  input: CircleCreationCharge
): Promise<ReservedCircleCreationCharge> {
  assertNonNegativeMoney(
    input.platformFee,
    "Platform fee"
  );
  assertNonNegativeMoney(
    input.userNetworkFee,
    "User network fee"
  );
  assertNonNegativeMoney(
    input.actualNetworkFee,
    "Actual network fee"
  );
  assertNonNegativeMoney(
    input.gasSubsidy,
    "Gas subsidy"
  );

  const { data, error } =
    await supabaseAdmin.rpc(
      "reserve_circle_creation_charge",
      {
        p_user_id: input.userId,
        p_circle_id: input.circleId,
        p_currency:
          input.currency.toUpperCase(),
        p_platform_fee:
          input.platformFee,
        p_user_network_fee:
          input.userNetworkFee,
        p_actual_network_fee:
          input.actualNetworkFee,
        p_gas_subsidy:
          input.gasSubsidy,
        p_payment_reference:
          input.paymentReference,
      }
    );

  if (error) {
    throw new Error(
      error.message ||
        "Unable to reserve the circle creation charge."
    );
  }

  return data as ReservedCircleCreationCharge;
}

export async function finalizeCircleCreationCharge({
  paymentBreakdownId,
  blockchainTransactionHash,
  actualGasRbtc,
}: {
  paymentBreakdownId: string;
  blockchainTransactionHash: string;
  actualGasRbtc: number;
}): Promise<FinalizedCircleCreationCharge> {
  assertNonNegativeMoney(
    actualGasRbtc,
    "Actual gas RBTC"
  );

  const { data, error } =
    await supabaseAdmin.rpc(
      "finalize_circle_creation_charge",
      {
        p_payment_breakdown_id:
          paymentBreakdownId,
        p_blockchain_tx_hash:
          blockchainTransactionHash,
        p_actual_gas_rbtc:
          actualGasRbtc,
      }
    );

  if (error) {
    throw new Error(
      error.message ||
        "Unable to finalize the circle creation charge."
    );
  }

  return data as FinalizedCircleCreationCharge;
}

export async function refundCircleCreationCharge({
  paymentBreakdownId,
  reason,
}: {
  paymentBreakdownId: string;
  reason: string;
}): Promise<RefundedCircleCreationCharge> {
  const { data, error } =
    await supabaseAdmin.rpc(
      "refund_circle_creation_charge",
      {
        p_payment_breakdown_id:
          paymentBreakdownId,
        p_reason: reason,
      }
    );

  if (error) {
    throw new Error(
      error.message ||
        "Unable to refund the circle creation charge."
    );
  }

  return data as RefundedCircleCreationCharge;
}