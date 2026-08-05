"use client";

import {
  ArrowDownToLine,
  Banknote,
  CircleDollarSign,
  Fuel,
  Loader2,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type RevenueEntry = {
  id: string;
  entry_type: string;
  direction: "credit" | "debit";
  currency: string;
  amount: number | string;
  description: string | null;
  reference: string | null;
  created_at: string;
};

type FinanceSummary = {
  currency: string;
  todayRevenue: number;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  availableRevenue: number;
  gasWallet: {
    localBalance: number;
    rbtcBalance: number;
  };
  pendingWithdrawals: number;
  recentRevenue: RevenueEntry[];
};

function formatMoney(
  value: number,
  currency = "GHS"
) {
  return `${currency} ${Number(
    value || 0
  ).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminFinancePage() {
  const [summary, setSummary] =
    useState<FinanceSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadFinanceSummary =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(
            "Your admin session has expired."
          );
        }

        const response = await fetch(
          "/api/admin/finance/summary",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "Unable to load finance data."
          );
        }

        setSummary(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load finance data."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadFinanceSummary();
  }, [loadFinanceSummary]);

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
            Finance
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Finance Overview
          </h1>

          <p className="mt-2 text-gray-500">
            Monitor platform revenue,
            network costs, and withdrawals.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadFinanceSummary()
          }
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading && !summary ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-700" />
            <p className="mt-3 text-sm text-gray-500">
              Loading finance data...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <FinanceCard
              title="Today's Revenue"
              value={formatMoney(
                summary?.todayRevenue ?? 0
              )}
              icon={Banknote}
            />

            <FinanceCard
              title="Monthly Revenue"
              value={formatMoney(
                summary?.monthlyRevenue ?? 0
              )}
              icon={CircleDollarSign}
            />

            <FinanceCard
              title="Lifetime Revenue"
              value={formatMoney(
                summary?.lifetimeRevenue ?? 0
              )}
              icon={WalletCards}
            />

            <FinanceCard
              title="Gas Wallet"
              value={formatMoney(
                summary?.gasWallet
                  .localBalance ?? 0
              )}
              subtitle={`${
                summary?.gasWallet.rbtcBalance ??
                0
              } RBTC`}
              icon={Fuel}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    Recent Revenue
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Latest platform revenue
                    ledger entries.
                  </p>
                </div>

                <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                  {summary?.recentRevenue
                    .length ?? 0}{" "}
                  entries
                </span>
              </div>

              <div className="mt-6">
                {!summary?.recentRevenue
                  .length ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
                    <CircleDollarSign className="mx-auto h-9 w-9 text-gray-400" />
                    <p className="mt-3 font-semibold text-gray-800">
                      No revenue recorded yet
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Platform fees will
                      appear here after
                      successful payments.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {summary.recentRevenue.map(
                      (entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-4 py-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {entry.description ||
                                "Platform revenue"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(
                                entry.created_at
                              ).toLocaleString()}
                            </p>
                          </div>

                          <p
                            className={`shrink-0 font-bold ${
                              entry.direction ===
                              "credit"
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {entry.direction ===
                            "credit"
                              ? "+"
                              : "-"}
                            {formatMoney(
                              Number(entry.amount),
                              entry.currency
                            )}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <ArrowDownToLine className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-gray-950">
                Revenue Withdrawals
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Withdraw only available
                ChainSave platform revenue.
                User savings remain separate.
              </p>

              <div className="mt-6 rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Available revenue
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-950">
                  {formatMoney(
                    summary?.availableRevenue ??
                      0
                  )}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Pending withdrawals
                </span>

                <span className="font-bold text-gray-900">
                  {summary?.pendingWithdrawals ??
                    0}
                </span>
              </div>

              <button
                type="button"
                disabled={
                  !summary ||
                  summary.availableRevenue <= 0
                }
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <ArrowDownToLine className="mr-2 h-5 w-5" />
                Withdraw Revenue
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

type FinanceCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
};

function FinanceCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: FinanceCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold text-gray-950">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}