import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type QuoteRequest = {
  contributionAmount?: number;
  currency?: string;
  estimatedNetworkFee?: number;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteRequest;

    const contributionAmount = Number(
      body.contributionAmount
    );

    const currency = String(
      body.currency ?? "GHS"
    ).toUpperCase();

    const estimatedNetworkFee = Number(
      body.estimatedNetworkFee ?? 0
    );

    if (
      !Number.isFinite(contributionAmount) ||
      contributionAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid contribution amount.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(estimatedNetworkFee) ||
      estimatedNetworkFee < 0
    ) {
      return NextResponse.json(
        {
          error:
            "The estimated network fee is invalid.",
        },
        { status: 400 }
      );
    }

    const {
      data: settings,
      error: settingsError,
    } = await supabaseAdmin
      .from("finance_settings")
      .select(
        `
          platform_fee_type,
          platform_fee_value,
          minimum_platform_fee,
          gas_fee_buffer_percentage
        `
      )
      .eq("currency", currency)
      .eq("is_active", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      throw settingsError;
    }

    if (!settings) {
      return NextResponse.json(
        {
          error:
            `No active finance settings exist for ${currency}.`,
        },
        { status: 404 }
      );
    }

    const platformFeeValue = Number(
      settings.platform_fee_value
    );

    const minimumPlatformFee = Number(
      settings.minimum_platform_fee
    );

    const gasBufferPercentage = Number(
      settings.gas_fee_buffer_percentage
    );

    let platformFee = 0;

    if (
      settings.platform_fee_type ===
      "percentage"
    ) {
      platformFee =
        contributionAmount *
        (platformFeeValue / 100);
    } else {
      platformFee = platformFeeValue;
    }

    platformFee = Math.max(
      platformFee,
      minimumPlatformFee
    );

    const networkFeeWithBuffer =
      estimatedNetworkFee *
      (1 + gasBufferPercentage / 100);

    const roundedContribution =
      roundMoney(contributionAmount);

    const roundedPlatformFee =
      roundMoney(platformFee);

    const roundedNetworkFee =
      roundMoney(networkFeeWithBuffer);

    const totalCharged = roundMoney(
      roundedContribution +
        roundedPlatformFee +
        roundedNetworkFee
    );

    return NextResponse.json({
      currency,
      contributionAmount:
        roundedContribution,
      platformFee: roundedPlatformFee,
      estimatedNetworkFee:
        roundedNetworkFee,
      totalCharged,
      settings: {
        platformFeeType:
          settings.platform_fee_type,
        platformFeeValue,
        minimumPlatformFee,
        gasBufferPercentage,
      },
    });
  } catch (error) {
    console.error(
      "Unable to calculate finance quote:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate payment fees.",
      },
      { status: 500 }
    );
  }
}