import { calculateContributionTotals } from "./revenueService";
import { recordPlatformRevenue } from "./platformRevenueService";
import { recordGasWalletEntry } from "./gasWalletService";

type SettlementInput = {
  contributionAmount: number;
  contributionReference: string;
};

export async function settleContribution(
  input: SettlementInput
) {
  const totals =
    calculateContributionTotals(
      input.contributionAmount
    );

  await recordPlatformRevenue({
    entryType: "platform_fee",
    direction: "credit",
    amount: totals.platformFee,
    description: "Platform fee collected",
    reference:
      input.contributionReference,
  });

  await recordGasWalletEntry({
    direction: "credit",
    localAmount: totals.gasReserve,
    rbtcAmount: 0,
    description:
      "Gas reserve collected",
    reference:
      input.contributionReference,
  });

  return totals;
}