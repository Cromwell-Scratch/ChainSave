import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function startOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function calculateNet(
  entries: Array<{
    direction: string;
    amount: number | string;
  }>
) {
  return entries.reduce((total, entry) => {
    const amount = Number(entry.amount) || 0;

    return entry.direction === "credit"
      ? total + amount
      : total - amount;
  }, 0);
}

export async function GET(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization");

    const accessToken =
      authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required." },
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
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      );
    }

    const [
      lifetimeRevenueResult,
      todayRevenueResult,
      monthlyRevenueResult,
      gasLedgerResult,
      pendingWithdrawalsResult,
      recentRevenueResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("platform_revenue_ledger")
        .select("direction, amount"),

      supabaseAdmin
        .from("platform_revenue_ledger")
        .select("direction, amount")
        .gte("created_at", startOfToday()),

      supabaseAdmin
        .from("platform_revenue_ledger")
        .select("direction, amount")
        .gte("created_at", startOfMonth()),

      supabaseAdmin
        .from("gas_wallet_ledger")
        .select(
          "direction, local_amount, rbtc_amount"
        ),

      supabaseAdmin
        .from("admin_revenue_withdrawals")
        .select("id", {
          count: "exact",
          head: true,
        })
        .in("status", [
          "pending",
          "processing",
        ]),

      supabaseAdmin
        .from("platform_revenue_ledger")
        .select(
          `
            id,
            entry_type,
            direction,
            currency,
            amount,
            description,
            reference,
            created_at
          `
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(10),
    ]);

    if (lifetimeRevenueResult.error) {
      throw lifetimeRevenueResult.error;
    }

    if (todayRevenueResult.error) {
      throw todayRevenueResult.error;
    }

    if (monthlyRevenueResult.error) {
      throw monthlyRevenueResult.error;
    }

    if (gasLedgerResult.error) {
      throw gasLedgerResult.error;
    }

    if (pendingWithdrawalsResult.error) {
      throw pendingWithdrawalsResult.error;
    }

    if (recentRevenueResult.error) {
      throw recentRevenueResult.error;
    }

    const lifetimeRevenue = calculateNet(
      lifetimeRevenueResult.data ?? []
    );

    const todayRevenue = calculateNet(
      todayRevenueResult.data ?? []
    );

    const monthlyRevenue = calculateNet(
      monthlyRevenueResult.data ?? []
    );

    const gasLocalBalance = (
      gasLedgerResult.data ?? []
    ).reduce((total, entry) => {
      const amount =
        Number(entry.local_amount) || 0;

      return entry.direction === "credit"
        ? total + amount
        : total - amount;
    }, 0);

    const gasRbtcBalance = (
      gasLedgerResult.data ?? []
    ).reduce((total, entry) => {
      const amount =
        Number(entry.rbtc_amount) || 0;

      return entry.direction === "credit"
        ? total + amount
        : total - amount;
    }, 0);

    return NextResponse.json({
      currency: "GHS",
      todayRevenue,
      monthlyRevenue,
      lifetimeRevenue,
      availableRevenue: lifetimeRevenue,
      gasWallet: {
        localBalance: gasLocalBalance,
        rbtcBalance: gasRbtcBalance,
      },
      pendingWithdrawals:
        pendingWithdrawalsResult.count ?? 0,
      recentRevenue:
        recentRevenueResult.data ?? [],
    });
  } catch (error) {
    console.error(
      "Unable to load finance summary:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load finance data.",
      },
      { status: 500 }
    );
  }
}