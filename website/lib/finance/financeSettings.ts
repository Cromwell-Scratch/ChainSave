import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { FinanceSettings } from "./financeEngine";

export async function getFinanceSettings(
  currency: string
): Promise<FinanceSettings> {
  const normalizedCurrency =
    currency.trim().toUpperCase();

  const { data, error } = await supabaseAdmin
    .from("finance_settings")
    .select(`
      currency,
      deposit_fee_mode,
      deposit_fee_percentage,
      deposit_fee_fixed,
      deposit_shared_platform_percentage,
      platform_fee_type,
      platform_fee_value,
      minimum_platform_fee,
      gas_fee_buffer_percentage,
      maximum_user_network_fee,
      contribution_fee_type,
      contribution_fee_value,
      minimum_contribution_fee,
      maximum_contribution_fee,
      withdrawal_fee_type,
      withdrawal_fee_value,
      minimum_withdrawal_fee,
      maximum_withdrawal_fee,
      payouts_are_free
    `)
    .eq("currency", normalizedCurrency)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      `No active finance settings found for ${normalizedCurrency}.`
    );
  }

  return {
    currency: data.currency,
    depositFeeMode: data.deposit_fee_mode,
    depositFeePercentage: Number(
      data.deposit_fee_percentage
    ),
    depositFeeFixed: Number(
      data.deposit_fee_fixed
    ),
    depositSharedPlatformPercentage: Number(
      data.deposit_shared_platform_percentage
    ),
    platformFeeType: data.platform_fee_type,
    platformFeeValue: Number(
      data.platform_fee_value
    ),
    minimumPlatformFee: Number(
      data.minimum_platform_fee
    ),
    gasBufferPercentage: Number(
      data.gas_fee_buffer_percentage
    ),
    maximumUserNetworkFee: Number(
      data.maximum_user_network_fee
    ),
    contributionFeeType:
      data.contribution_fee_type,
    contributionFeeValue: Number(
      data.contribution_fee_value
    ),
    minimumContributionFee: Number(
      data.minimum_contribution_fee
    ),
    maximumContributionFee: Number(
      data.maximum_contribution_fee
    ),
    withdrawalFeeType:
      data.withdrawal_fee_type,
    withdrawalFeeValue: Number(
      data.withdrawal_fee_value
    ),
    minimumWithdrawalFee: Number(
      data.minimum_withdrawal_fee
    ),
    maximumWithdrawalFee: Number(
      data.maximum_withdrawal_fee
    ),
    payoutsAreFree:
      data.payouts_are_free,
  };
}