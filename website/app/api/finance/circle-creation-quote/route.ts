import "server-only";

import {
  calculateCircleCreationPlatformFee,
  roundMoney,
} from "@/lib/finance/financeEngine";
import {
  getFinanceSettings,
} from "@/lib/finance/financeSettings";
import { relayerWallet } from "@/lib/server/relayer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import {
  Contract,
  id,
  parseEther,
} from "ethers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

const FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_SAVINGS_FACTORY_ADDRESS;

const SAVINGS_FACTORY_ABI = [
  {
    type: "function",
    name: "createCircleFor",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "circleId",
        type: "bytes32",
      },
      {
        name: "contributionAmount",
        type: "uint256",
      },
      {
        name: "maxMembers",
        type: "uint256",
      },
      {
        name: "circleOwner",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "circleAddress",
        type: "address",
      },
    ],
  },
] as const;

type QuoteRequest = {
  contributionAmount?: number;
  currency?: string;
  maxMembers?: number;
};

function decimalForParseEther(
  value: number
) {
  return value
    .toFixed(18)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

export async function POST(
  request: NextRequest
) {
  try {
    if (!FACTORY_ADDRESS) {
      return NextResponse.json(
        {
          error:
            "SavingsFactory address is missing.",
        },
        { status: 500 }
      );
    }

    const body =
      (await request.json()) as QuoteRequest;

    const contributionAmount = Number(
      body.contributionAmount
    );

    const currency = String(
      body.currency ?? "GHS"
    )
      .trim()
      .toUpperCase();

    const maxMembers = Number(
      body.maxMembers
    );

    if (
      !Number.isFinite(
        contributionAmount
      ) ||
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
      !Number.isInteger(maxMembers) ||
      maxMembers < 2 ||
      maxMembers > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Maximum members must be between 2 and 100.",
        },
        { status: 400 }
      );
    }

    /*
     * Circle creation is sponsored by ChainSave.
     * The platform relayer is the initial on-chain
     * owner, while the authenticated user remains
     * the business owner in public.circles.owner_id.
     */
    const ownerAddress =
      relayerWallet.address;

    const settings =
      await getFinanceSettings(
        currency
      );

    const {
      data: exchangeRates,
      error: exchangeRateError,
    } = await supabaseAdmin
      .from("exchange_rates")
      .select(
        "base_currency, quote_currency, rate"
      )
      .in("base_currency", [
        currency,
        "RBTC",
      ])
      .in("quote_currency", [
        currency,
        "RBTC",
      ]);

    if (exchangeRateError) {
      throw exchangeRateError;
    }

    const directRate =
      exchangeRates?.find(
        (rate) =>
          rate.base_currency === currency &&
          rate.quote_currency === "RBTC"
      );

    const inverseRate =
      exchangeRates?.find(
        (rate) =>
          rate.base_currency === "RBTC" &&
          rate.quote_currency === currency
      );

    let currencyToRbtc: number | null =
      null;

    let rbtcToCurrency: number | null =
      null;

    if (directRate) {
      const rate = Number(
        directRate.rate
      );

      if (
        Number.isFinite(rate) &&
        rate > 0
      ) {
        currencyToRbtc = rate;
        rbtcToCurrency = 1 / rate;
      }
    }

    if (
      currencyToRbtc === null &&
      inverseRate
    ) {
      const rate = Number(
        inverseRate.rate
      );

      if (
        Number.isFinite(rate) &&
        rate > 0
      ) {
        rbtcToCurrency = rate;
        currencyToRbtc = 1 / rate;
      }
    }

    if (
      currencyToRbtc === null ||
      rbtcToCurrency === null
    ) {
      return NextResponse.json(
        {
          error:
            `No ${currency}/RBTC exchange rate is available.`,
        },
        { status: 400 }
      );
    }

    const contributionRbtc =
      contributionAmount *
      currencyToRbtc;

    const contributionWei =
      parseEther(
        decimalForParseEther(
          contributionRbtc
        )
      );

    const factory = new Contract(
      FACTORY_ADDRESS,
      SAVINGS_FACTORY_ABI,
      relayerWallet
    );

    const temporaryCircleId = id(
      `chainsave-quote:${crypto.randomUUID()}`
    );

    const estimatedGas =
      await factory.createCircleFor.estimateGas(
        temporaryCircleId,
        contributionWei,
        maxMembers,
        ownerAddress
      );

    const feeData =
      await relayerWallet.provider?.getFeeData();

    const gasPrice =
      feeData?.gasPrice ??
      feeData?.maxFeePerGas;

    if (!gasPrice) {
      throw new Error(
        "Unable to determine the current Rootstock gas price."
      );
    }

    const estimatedGasWei =
      estimatedGas * gasPrice;

    const estimatedGasRbtc =
      Number(estimatedGasWei) / 1e18;

    const rawNetworkFee =
      estimatedGasRbtc *
      rbtcToCurrency;

    const gasBufferPercentage =
      settings.gasBufferPercentage;

    const actualNetworkFee =
      roundMoney(
        rawNetworkFee *
          (1 +
            gasBufferPercentage / 100)
      );

    const maximumUserNetworkFee =
      settings.maximumUserNetworkFee;

    const userNetworkFee =
      roundMoney(
        Math.min(
          actualNetworkFee,
          maximumUserNetworkFee
        )
      );

    const gasSubsidy =
      roundMoney(
        Math.max(
          actualNetworkFee -
            userNetworkFee,
          0
        )
      );

    const {
      platformFee,
    } =
      calculateCircleCreationPlatformFee(
        contributionAmount,
        settings
      );

    const totalCreationCharge =
      roundMoney(
        platformFee +
          userNetworkFee
      );

    return NextResponse.json({
      currency,
      platformFee,
      estimatedNetworkFee:
        userNetworkFee,
      actualNetworkFee,
      gasSubsidy,
      maximumUserNetworkFee,
      totalCreationCharge,
      estimatedGasUnits:
        estimatedGas.toString(),
      estimatedGasRbtc,
      settings: {
        platformFeeType:
          settings.platformFeeType,
        platformFeeValue:
          settings.platformFeeValue,
        minimumPlatformFee:
          settings.minimumPlatformFee,
        gasBufferPercentage,
      },
    });
  } catch (error) {
    console.error(
      "Circle creation quote error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate the circle creation fee.",
      },
      { status: 500 }
    );
  }
}