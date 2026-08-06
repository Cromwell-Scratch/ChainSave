import "server-only";

import {
  Contract,
  ZeroAddress,
  getAddress,
  id,
  parseEther,
} from "ethers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  finalizeCircleCreationCharge,
  refundCircleCreationCharge,
  reserveCircleCreationCharge,
} from "@/lib/server/finance/circleCreationSettlementService";
import { relayerWallet } from "@/lib/server/relayer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_SAVINGS_FACTORY_ADDRESS;

const ROOTSTOCK_TESTNET_CHAIN_ID = 31;

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
  {
    type: "function",
    name: "circleById",
    stateMutability: "view",
    inputs: [
      {
        name: "circleId",
        type: "bytes32",
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

type CreateCircleRequest = {
  name?: string;
  description?: string;
  contributionAmount?: number;
  currency?: string;
  contributionFrequency?: string;
  maxMembers?: number;
  startDate?: string | null;
  privacy?: string;
  invitedMembers?: string[];
};

type FinanceSettings = {
  platform_fee_type: "percentage" | "fixed";
  platform_fee_value: number | string;
  minimum_platform_fee: number | string;
  gas_fee_buffer_percentage: number | string;
};

type ExchangeRateRow = {
  base_currency: string;
  quote_currency: string;
  rate: number | string;
};

type CreationQuote = {
  platformFee: number;
  userNetworkFee: number;
  actualNetworkFee: number;
  gasSubsidy: number;
  totalCreationCharge: number;
  contributionAmountWei: bigint;
  rbtcContributionText: string;
};

function getAccessToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  return authorization.slice(
    "Bearer ".length
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function roundMoney(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

function decimalForParseEther(
  value: number
) {
  return value
    .toFixed(18)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

function getMaximumUserNetworkFee(
  currency: string
) {
  const environmentKey =
    `MAX_USER_NETWORK_FEE_${currency}`;

  const value = Number(
    process.env[environmentKey] ??
      (currency === "GHS"
        ? 2
        : Number.NaN)
  );

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `A valid ${environmentKey} setting is required.`
    );
  }

  return value;
}

async function calculateCreationQuote({
  contributionAmount,
  currency,
  maxMembers,
  circleOwnerAddress,
}: {
  contributionAmount: number;
  currency: string;
  maxMembers: number;
  circleOwnerAddress: string;
}): Promise<CreationQuote> {
  if (!FACTORY_ADDRESS) {
    throw new Error(
      "SavingsFactory address is missing."
    );
  }

  const {
    data: settingsData,
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

  if (!settingsData) {
    throw new Error(
      `No active finance settings exist for ${currency}.`
    );
  }

  const settings =
    settingsData as FinanceSettings;

  const {
    data: rateData,
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

  const exchangeRates =
    (rateData ?? []) as ExchangeRateRow[];

  const directRate =
    exchangeRates.find(
      (rate) =>
        rate.base_currency === currency &&
        rate.quote_currency === "RBTC"
    );

  const inverseRate =
    exchangeRates.find(
      (rate) =>
        rate.base_currency === "RBTC" &&
        rate.quote_currency === currency
    );

  let currencyToRbtc: number | null =
    null;

  let rbtcToCurrency: number | null =
    null;

  if (directRate) {
    const rate = Number(directRate.rate);

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
    throw new Error(
      `No ${currency}/RBTC exchange rate is available.`
    );
  }

  const rbtcContribution =
    contributionAmount *
    currencyToRbtc;

  if (
    !Number.isFinite(rbtcContribution) ||
    rbtcContribution <= 0
  ) {
    throw new Error(
      "Unable to calculate the Rootstock contribution value."
    );
  }

  const rbtcContributionText =
    decimalForParseEther(
      rbtcContribution
    );

  const contributionAmountWei =
    parseEther(
      rbtcContributionText
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
      contributionAmountWei,
      maxMembers,
      circleOwnerAddress
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
    Number(
      settings.gas_fee_buffer_percentage
    );

  const actualNetworkFee = roundMoney(
    rawNetworkFee *
      (1 +
        gasBufferPercentage / 100)
  );

  const maximumUserNetworkFee =
    getMaximumUserNetworkFee(currency);

  const userNetworkFee = roundMoney(
    Math.min(
      actualNetworkFee,
      maximumUserNetworkFee
    )
  );

  const gasSubsidy = roundMoney(
    Math.max(
      actualNetworkFee -
        userNetworkFee,
      0
    )
  );

  const platformFeeValue = Number(
    settings.platform_fee_value
  );

  const minimumPlatformFee = Number(
    settings.minimum_platform_fee
  );

  let platformFee: number;

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

  platformFee = roundMoney(
    Math.max(
      platformFee,
      minimumPlatformFee
    )
  );

  const totalCreationCharge =
    roundMoney(
      platformFee +
        userNetworkFee
    );

  return {
    platformFee,
    userNetworkFee,
    actualNetworkFee,
    gasSubsidy,
    totalCreationCharge,
    contributionAmountWei,
    rbtcContributionText,
  };
}

async function safelyDeletePendingCircle(
  circleId: string
) {
  const { error } = await supabaseAdmin
    .from("circles")
    .delete()
    .eq("id", circleId)
    .in("blockchain_status", [
      "creating",
      "payment_failed",
    ]);

  if (error) {
    console.error(
      "Unable to delete pending circle:",
      error
    );
  }
}

export async function POST(
  request: NextRequest
) {
  let databaseCircleId = "";
  let transactionHash = "";
  let contractAddress = "";
  let paymentBreakdownId = "";
  let blockchainConfirmed = false;

  try {
    if (!FACTORY_ADDRESS) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SavingsFactory address is missing.",
        },
        { status: 500 }
      );
    }

    const accessToken =
      getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication is required.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(
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

    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your account needs an email address.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as CreateCircleRequest;

    const name = String(
      body.name ?? ""
    ).trim();

    const description = String(
      body.description ?? ""
    ).trim();

    const currency = String(
      body.currency ?? "GHS"
    )
      .trim()
      .toUpperCase();

    const contributionFrequency = String(
      body.contributionFrequency ?? ""
    ).trim();

    const privacy = String(
      body.privacy ?? "private"
    )
      .trim()
      .toLowerCase();

    const contributionAmount = Number(
      body.contributionAmount
    );

    const maxMembers = Number(
      body.maxMembers
    );

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid circle name.",
        },
        { status: 400 }
      );
    }

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

    if (
      !Number.isInteger(maxMembers) ||
      maxMembers < 2 ||
      maxMembers > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Maximum members must be between 2 and 100.",
        },
        { status: 400 }
      );
    }

    if (
      !["private", "public"].includes(
        privacy
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Circle privacy is invalid.",
        },
        { status: 400 }
      );
    }

    /*
     * The user owns the circle in ChainSave through
     * circles.owner_id. The platform relayer is the
     * initial on-chain contract owner so ordinary
     * users do not need MetaMask, RBTC, or a private
     * blockchain key.
     */
    const circleOwnerAddress =
      relayerWallet.address;

    const network =
      await relayerWallet.provider?.getNetwork();

    if (
      !network ||
      Number(network.chainId) !==
        ROOTSTOCK_TESTNET_CHAIN_ID
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The platform relayer is not connected to Rootstock Testnet.",
        },
        { status: 500 }
      );
    }

    const quote =
      await calculateCreationQuote({
        contributionAmount,
        currency,
        maxMembers,
        circleOwnerAddress,
      });

    databaseCircleId =
      crypto.randomUUID();

    const blockchainCircleId = id(
      `chainsave-circle:${databaseCircleId}`
    );

    const paymentReference =
      `circle-create:${databaseCircleId}`;

    /*
     * Create a pending circle first because the
     * finance breakdown references circles.id.
     */
    const { error: pendingCircleError } =
      await supabaseAdmin
        .from("circles")
        .insert({
          id: databaseCircleId,
          owner_id: user.id,
          name,
          description:
            description || null,
          contribution_amount:
            contributionAmount,
          currency,
          contribution_frequency:
            contributionFrequency,
          max_members: maxMembers,
          start_date:
            body.startDate || null,
          privacy,
          blockchain_circle_id:
            blockchainCircleId,
          contract_address: null,
          creation_tx_hash: null,
          blockchain_network:
            "rootstock_testnet",
          onchain_contribution_amount:
            quote.rbtcContributionText,
          blockchain_status:
            "creating",
        });

    if (pendingCircleError) {
      throw pendingCircleError;
    }

    /*
     * Atomically debit the user's ChainSave wallet
     * and create the pending finance breakdown.
     */
    try {
      const reservation =
        await reserveCircleCreationCharge({
          userId: user.id,
          circleId: databaseCircleId,
          currency,
          platformFee:
            quote.platformFee,
          userNetworkFee:
            quote.userNetworkFee,
          actualNetworkFee:
            quote.actualNetworkFee,
          gasSubsidy:
            quote.gasSubsidy,
          paymentReference,
        });

      paymentBreakdownId =
        reservation.paymentBreakdownId;
    } catch (reservationError) {
      await supabaseAdmin
        .from("circles")
        .update({
          blockchain_status:
            "payment_failed",
        })
        .eq("id", databaseCircleId);

      await safelyDeletePendingCircle(
        databaseCircleId
      );

      throw reservationError;
    }

    const factory = new Contract(
      FACTORY_ADDRESS,
      SAVINGS_FACTORY_ABI,
      relayerWallet
    );

    const transaction =
      await factory.createCircleFor(
        blockchainCircleId,
        quote.contributionAmountWei,
        maxMembers,
        circleOwnerAddress
      );

    transactionHash = transaction.hash;

    const {
      error: submittedUpdateError,
    } = await supabaseAdmin
      .from("circles")
      .update({
        creation_tx_hash:
          transactionHash,
        blockchain_status:
          "submitted",
      })
      .eq("id", databaseCircleId);

    if (submittedUpdateError) {
      console.error(
        "Unable to mark circle as submitted:",
        submittedUpdateError
      );
    }

    const receipt =
      await transaction.wait();

    if (
      !receipt ||
      receipt.status !== 1
    ) {
      throw new Error(
        "The sponsored Rootstock transaction failed."
      );
    }

    blockchainConfirmed = true;

    const deployedAddress =
      await factory.circleById(
        blockchainCircleId
      );

    if (
      !deployedAddress ||
      deployedAddress === ZeroAddress
    ) {
      throw new Error(
        "Rootstock did not return the new circle contract address."
      );
    }

    contractAddress = getAddress(
      String(deployedAddress)
    );

    const gasUsed =
      receipt.gasUsed ?? BigInt(0);

    const gasPrice =
      receipt.gasPrice ?? BigInt(0);
    const actualGasRbtc =
      Number(gasUsed * gasPrice) /
      1e18;

    /*
     * Once Rootstock confirms, finalize the payment.
     * This records platform revenue and gas accounting.
     */
    await finalizeCircleCreationCharge({
      paymentBreakdownId,
      blockchainTransactionHash:
        transactionHash,
      actualGasRbtc,
    });

    const {
      error: confirmedCircleError,
    } = await supabaseAdmin
      .from("circles")
      .update({
        contract_address:
          contractAddress,
        creation_tx_hash:
          transactionHash,
        blockchain_status:
          "confirmed",
      })
      .eq("id", databaseCircleId);

    if (confirmedCircleError) {
      throw confirmedCircleError;
    }

    const {
      error: ownerMemberError,
    } = await supabaseAdmin
      .from("circle_members")
      .insert({
        circle_id: databaseCircleId,
        user_id: user.id,
        email: normalizeEmail(
          user.email
        ),
        role: "owner",
        status: "accepted",
        joined_at:
          new Date().toISOString(),
        invited_by: user.id,
      });

    if (ownerMemberError) {
      await supabaseAdmin
        .from("circles")
        .update({
          blockchain_status:
            "confirmed_member_sync_failed",
        })
        .eq("id", databaseCircleId);

      throw ownerMemberError;
    }

    const invitedMembers = Array.from(
      new Set(
        (body.invitedMembers ?? [])
          .map(normalizeEmail)
          .filter(Boolean)
          .filter(
            (email) =>
              email !==
              normalizeEmail(user.email!)
          )
      )
    ).slice(
      0,
      Math.max(maxMembers - 1, 0)
    );

    if (invitedMembers.length > 0) {
      const {
        error: invitationsError,
      } = await supabaseAdmin
        .from("circle_members")
        .insert(
          invitedMembers.map(
            (email) => ({
              circle_id:
                databaseCircleId,
              user_id: null,
              email,
              role: "member",
              status: "pending",
              joined_at: null,
              invited_by: user.id,
            })
          )
        );

      if (invitationsError) {
        await supabaseAdmin
          .from("circles")
          .update({
            blockchain_status:
              "confirmed_invitation_sync_failed",
          })
          .eq("id", databaseCircleId);

        throw invitationsError;
      }
    }

    return NextResponse.json(
      {
        success: true,
        circleId: databaseCircleId,
        blockchainCircleId,
        contractAddress,
        transactionHash,
        sponsored: true,
        ownershipMode:
          "platform_custodial",
        onchainOwner:
          circleOwnerAddress,
        contributionAmount,
        currency,
        rbtcContribution:
          quote.rbtcContributionText,
        charges: {
          platformFee:
            quote.platformFee,
          userNetworkFee:
            quote.userNetworkFee,
          actualNetworkFee:
            quote.actualNetworkFee,
          gasSubsidy:
            quote.gasSubsidy,
          totalCreationCharge:
            quote.totalCreationCharge,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Sponsored circle creation error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to create the savings circle.";

    /*
     * Refund only when Rootstock did not confirm.
     * If Rootstock confirmed, the circle exists and
     * the charge must remain finalized.
     */
    if (
      paymentBreakdownId &&
      !blockchainConfirmed
    ) {
      try {
        await refundCircleCreationCharge({
          paymentBreakdownId,
          reason: errorMessage,
        });

        if (databaseCircleId) {
          await supabaseAdmin
            .from("circles")
            .update({
              blockchain_status:
                "failed_refunded",
            })
            .eq("id", databaseCircleId);
        }
      } catch (refundError) {
        console.error(
          "Automatic circle creation refund failed:",
          refundError
        );

        if (databaseCircleId) {
          await supabaseAdmin
            .from("circles")
            .update({
              blockchain_status:
                "failed_refund_required",
            })
            .eq("id", databaseCircleId);
        }
      }
    } else if (
      blockchainConfirmed &&
      databaseCircleId
    ) {
      await supabaseAdmin
        .from("circles")
        .update({
          blockchain_status:
            contractAddress
              ? "confirmed_sync_failed"
              : "confirmed_address_lookup_failed",
        })
        .eq("id", databaseCircleId);
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        circleId:
          databaseCircleId || null,
        paymentBreakdownId:
          paymentBreakdownId || null,
        transactionHash:
          transactionHash || null,
        contractAddress:
          contractAddress || null,
        blockchainConfirmed,
      },
      {
        status:
          blockchainConfirmed ? 500 : 400,
      }
    );
  }
}