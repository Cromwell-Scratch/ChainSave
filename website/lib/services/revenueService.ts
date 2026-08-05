export type ContributionTotals = {
  contributionAmount: number;
  platformFee: number;
  gasReserve: number;
  totalCharge: number;
  currency: string;
};

const PLATFORM_FEE = 1;
const GAS_RESERVE = 0.08;
const PLATFORM_CURRENCY = "GHS";

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateContributionTotals(
  contributionAmount: number
): ContributionTotals {
  if (
    !Number.isFinite(contributionAmount) ||
    contributionAmount <= 0
  ) {
    throw new Error(
      "Contribution amount must be greater than zero."
    );
  }

  const roundedContribution =
    roundMoney(contributionAmount);

  const platformFee =
    roundMoney(PLATFORM_FEE);

  const gasReserve =
    roundMoney(GAS_RESERVE);

  const totalCharge = roundMoney(
    roundedContribution +
      platformFee +
      gasReserve
  );

  return {
    contributionAmount:
      roundedContribution,
    platformFee,
    gasReserve,
    totalCharge,
    currency: PLATFORM_CURRENCY,
  };
}