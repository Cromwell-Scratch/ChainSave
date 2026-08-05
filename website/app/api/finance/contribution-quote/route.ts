import "server-only";

import {
  calculateContributionFee,
} from "@/lib/finance/financeEngine";
import {
  getFinanceSettings,
} from "@/lib/finance/financeSettings";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

type ContributionQuoteRequest = {
  contributionAmount?: number;
  currency?: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as ContributionQuoteRequest;

    const contributionAmount = Number(
      body.contributionAmount
    );

    const currency = String(
      body.currency ?? "GHS"
    )
      .trim()
      .toUpperCase();

    if (
      !Number.isFinite(
        contributionAmount
      ) ||
      contributionAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid contribution amount.",
        },
        { status: 400 }
      );
    }

    const settings =
      await getFinanceSettings(
        currency
      );

    const quote =
      calculateContributionFee(
        contributionAmount,
        settings
      );

    return NextResponse.json({
      success: true,
      currency,
      contributionAmount:
        quote.contributionAmount,
      serviceFee:
        quote.serviceFee,
      totalDebit:
        quote.totalCharge,
      settings: {
        feeType:
          settings.contributionFeeType,
        feeValue:
          settings.contributionFeeValue,
        minimumFee:
          settings.minimumContributionFee,
        maximumFee:
          settings.maximumContributionFee,
      },
    });
  } catch (error) {
    console.error(
      "Contribution quote error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate the contribution fee.",
      },
      { status: 500 }
    );
  }
}