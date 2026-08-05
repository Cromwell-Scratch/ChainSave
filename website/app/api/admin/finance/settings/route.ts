import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type FeeType =
  | "percentage"
  | "fixed";

type DepositFeeMode =
  | "platform_absorbs"
  | "user_pays";

type UpdateFinanceSettingsBody = {
  id?: string;

  platform_fee_type?: FeeType;
  platform_fee_value?: number;
  minimum_platform_fee?: number;

  contribution_fee_type?: FeeType;
  contribution_fee_value?: number;
  minimum_contribution_fee?: number;
  maximum_contribution_fee?: number;

  withdrawal_fee_type?: FeeType;
  withdrawal_fee_value?: number;
  minimum_withdrawal_fee?: number;
  maximum_withdrawal_fee?: number;

  maximum_user_network_fee?: number;
  gas_fee_buffer_percentage?: number;

  deposit_fee_mode?: DepositFeeMode;
  payouts_are_free?: boolean;
};

function getAccessToken(
  request: NextRequest
) {
  const authorizationHeader =
    request.headers.get(
      "authorization"
    );

  if (
    !authorizationHeader?.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  return authorizationHeader.slice(
    "Bearer ".length
  );
}

async function requireAdmin(
  request: NextRequest
) {
  const accessToken =
    getAccessToken(request);

  if (!accessToken) {
    throw new Error(
      "ADMIN_AUTH_REQUIRED"
    );
  }

  const {
    data: { user },
    error: userError,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken
    );

  if (userError || !user) {
    throw new Error(
      "ADMIN_SESSION_INVALID"
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabaseAdmin
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin" ||
    profile.status !== "active"
  ) {
    throw new Error(
      "ADMIN_ACCESS_DENIED"
    );
  }

  return user;
}

function errorResponse(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected server error.";

  if (
    message ===
    "ADMIN_AUTH_REQUIRED"
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Authentication is required.",
      },
      { status: 401 }
    );
  }

  if (
    message ===
    "ADMIN_SESSION_INVALID"
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Your admin session is invalid or has expired.",
      },
      { status: 401 }
    );
  }

  if (
    message ===
    "ADMIN_ACCESS_DENIED"
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "You do not have permission to manage finance settings.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 500 }
  );
}

function validateFeeType(
  value: unknown
): value is FeeType {
  return (
    value === "percentage" ||
    value === "fixed"
  );
}

function validateDepositFeeMode(
  value: unknown
): value is DepositFeeMode {
  return (
    value === "platform_absorbs" ||
    value === "user_pays"
  );
}

function requireNonNegativeNumber(
  value: unknown,
  label: string
) {
  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue < 0
  ) {
    throw new Error(
      `${label} must be a valid non-negative number.`
    );
  }

  return numericValue;
}

export async function GET(
  request: NextRequest
) {
  try {
    await requireAdmin(request);

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("finance_settings")
      .select("*")
      .eq("currency", "GHS")
      .eq("is_active", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No active GHS finance settings were found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (error) {
    console.error(
      "Finance settings GET error:",
      error
    );

    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const adminUser =
      await requireAdmin(request);

    const body =
      (await request.json()) as
        UpdateFinanceSettingsBody;

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The finance settings ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !validateFeeType(
        body.platform_fee_type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The circle creation fee type is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      !validateFeeType(
        body.contribution_fee_type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The contribution fee type is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      !validateFeeType(
        body.withdrawal_fee_type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The withdrawal fee type is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      !validateDepositFeeMode(
        body.deposit_fee_mode
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The deposit fee mode is invalid.",
        },
        { status: 400 }
      );
    }

    const platformFeeValue =
      requireNonNegativeNumber(
        body.platform_fee_value,
        "Circle creation fee value"
      );

    const minimumPlatformFee =
      requireNonNegativeNumber(
        body.minimum_platform_fee,
        "Minimum circle creation fee"
      );

    const contributionFeeValue =
      requireNonNegativeNumber(
        body.contribution_fee_value,
        "Contribution fee value"
      );

    const minimumContributionFee =
      requireNonNegativeNumber(
        body.minimum_contribution_fee,
        "Minimum contribution fee"
      );

    const maximumContributionFee =
      requireNonNegativeNumber(
        body.maximum_contribution_fee,
        "Maximum contribution fee"
      );

    const withdrawalFeeValue =
      requireNonNegativeNumber(
        body.withdrawal_fee_value,
        "Withdrawal fee value"
      );

    const minimumWithdrawalFee =
      requireNonNegativeNumber(
        body.minimum_withdrawal_fee,
        "Minimum withdrawal fee"
      );

    const maximumWithdrawalFee =
      requireNonNegativeNumber(
        body.maximum_withdrawal_fee,
        "Maximum withdrawal fee"
      );

    const maximumUserNetworkFee =
      requireNonNegativeNumber(
        body.maximum_user_network_fee,
        "Maximum user network fee"
      );

    const gasFeeBufferPercentage =
      requireNonNegativeNumber(
        body.gas_fee_buffer_percentage,
        "Gas fee buffer"
      );

    if (
      minimumContributionFee >
      maximumContributionFee
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The minimum contribution fee cannot exceed the maximum contribution fee.",
        },
        { status: 400 }
      );
    }

    if (
      minimumWithdrawalFee >
      maximumWithdrawalFee
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The minimum withdrawal fee cannot exceed the maximum withdrawal fee.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.payouts_are_free !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The free-payout setting is invalid.",
        },
        { status: 400 }
      );
    }

    const {
      data: existingSettings,
      error: existingSettingsError,
    } = await supabaseAdmin
      .from("finance_settings")
      .select("id, currency")
      .eq("id", body.id)
      .single();

    if (
      existingSettingsError ||
      !existingSettings
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The finance settings record could not be found.",
        },
        { status: 404 }
      );
    }

    const {
      data: updatedSettings,
      error: updateError,
    } = await supabaseAdmin
      .from("finance_settings")
      .update({
        platform_fee_type:
          body.platform_fee_type,

        platform_fee_value:
          platformFeeValue,

        minimum_platform_fee:
          minimumPlatformFee,

        contribution_fee_type:
          body.contribution_fee_type,

        contribution_fee_value:
          contributionFeeValue,

        minimum_contribution_fee:
          minimumContributionFee,

        maximum_contribution_fee:
          maximumContributionFee,

        withdrawal_fee_type:
          body.withdrawal_fee_type,

        withdrawal_fee_value:
          withdrawalFeeValue,

        minimum_withdrawal_fee:
          minimumWithdrawalFee,

        maximum_withdrawal_fee:
          maximumWithdrawalFee,

        maximum_user_network_fee:
          maximumUserNetworkFee,

        gas_fee_buffer_percentage:
          gasFeeBufferPercentage,

        deposit_fee_mode:
          body.deposit_fee_mode,

        payouts_are_free:
          body.payouts_are_free,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", body.id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    // Add this only if your audit_logs table
    // already exists with matching columns.
    console.info(
      "Finance settings updated:",
      {
        adminUserId:
          adminUser.id,
        settingsId:
          body.id,
        currency:
          existingSettings.currency,
      }
    );

    return NextResponse.json({
      success: true,
      settings:
        updatedSettings,
    });
  } catch (error) {
    console.error(
      "Finance settings PATCH error:",
      error
    );

    return errorResponse(error);
  }
}