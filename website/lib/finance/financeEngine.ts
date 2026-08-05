export type FinanceSettings = {
  currency: string;
  depositFeeMode: "platform_absorbs" | "user_pays" | "shared";
  depositFeePercentage: number;
  depositFeeFixed: number;
  depositSharedPlatformPercentage: number;
  platformFeeType: "fixed" | "percentage";
  platformFeeValue: number;
  minimumPlatformFee: number;
  gasBufferPercentage: number;
  maximumUserNetworkFee: number;
  contributionFeeType: "fixed" | "percentage";
  contributionFeeValue: number;
  minimumContributionFee: number;
  maximumContributionFee: number;
  withdrawalFeeType: "fixed" | "percentage";
  withdrawalFeeValue: number;
  minimumWithdrawalFee: number;
  maximumWithdrawalFee: number;
  payoutsAreFree: boolean;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateCircleCreationPlatformFee(
  contributionAmount: number,
  settings: FinanceSettings
) {
  let fee =
    settings.platformFeeType === "percentage"
      ? contributionAmount * (settings.platformFeeValue / 100)
      : settings.platformFeeValue;

  fee = Math.max(fee, settings.minimumPlatformFee);

  return {
    platformFee: roundMoney(fee),
  };
}

export function calculateContributionFee(
  contributionAmount: number,
  settings: FinanceSettings
) {
  let fee =
    settings.contributionFeeType === "percentage"
      ? contributionAmount * (settings.contributionFeeValue / 100)
      : settings.contributionFeeValue;

  fee = Math.max(fee, settings.minimumContributionFee);
  fee = Math.min(fee, settings.maximumContributionFee);
  fee = roundMoney(fee);

  return {
    contributionAmount: roundMoney(contributionAmount),
    serviceFee: fee,
    totalCharge: roundMoney(contributionAmount + fee),
  };
}

export function calculateWithdrawalFee(
  withdrawalAmount: number,
  settings: FinanceSettings
) {
  let fee =
    settings.withdrawalFeeType === "percentage"
      ? withdrawalAmount * (settings.withdrawalFeeValue / 100)
      : settings.withdrawalFeeValue;

  fee = Math.max(fee, settings.minimumWithdrawalFee);
  fee = Math.min(fee, settings.maximumWithdrawalFee);
  fee = roundMoney(fee);

  return {
    withdrawalAmount: roundMoney(withdrawalAmount),
    withdrawalFee: fee,
    amountUserReceives: roundMoney(withdrawalAmount - fee),
  };
}