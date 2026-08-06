"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Coins,
  Gift,
  CreditCard,
} from "lucide-react";

export interface LedgerEntry {
  id: string;
  currency: string;
  entry_type:
    | "deposit"
    | "withdrawal"
    | "contribution"
    | "payout"
    | "refund"
    | "reward"
    | "fee"
    | "conversion_debit"
    | "conversion_credit"
    | "migration";

  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface LedgerActivityProps {
  entries: LedgerEntry[];
  loading?: boolean;
}

const entryConfig = {
  deposit: {
    icon: ArrowDownLeft,
    color: "bg-green-100 text-green-700",
    label: "Deposit",
  },

  withdrawal: {
    icon: ArrowUpRight,
    color: "bg-red-100 text-red-700",
    label: "Withdrawal",
  },

  contribution: {
    icon: Coins,
    color: "bg-blue-100 text-blue-700",
    label: "Contribution",
  },

  payout: {
    icon: Gift,
    color: "bg-purple-100 text-purple-700",
    label: "Payout",
  },

  refund: {
    icon: ArrowDownLeft,
    color: "bg-cyan-100 text-cyan-700",
    label: "Refund",
  },

  reward: {
    icon: Gift,
    color: "bg-yellow-100 text-yellow-700",
    label: "Reward",
  },

  fee: {
    icon: CreditCard,
    color: "bg-gray-100 text-gray-700",
    label: "Fee",
  },

  conversion_debit: {
    icon: ArrowLeftRight,
    color: "bg-orange-100 text-orange-700",
    label: "Conversion",
  },

  conversion_credit: {
    icon: ArrowLeftRight,
    color: "bg-orange-100 text-orange-700",
    label: "Conversion",
  },

  migration: {
    icon: Coins,
    color: "bg-indigo-100 text-indigo-700",
    label: "Migration",
  },
};

function formatAmount(currency: string, amount: number) {
  const decimals = currency === "RBTC" ? 8 : 2;

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export default function LedgerActivity({
  entries,
  loading = false,
}: LedgerActivityProps) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Latest wallet ledger entries
          </p>

        </div>

      </div>

      {loading ? (
        <div className="space-y-4">

          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl bg-gray-100"
            />
          ))}

        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">

          <Coins className="mx-auto h-10 w-10 text-gray-400" />

          <h3 className="mt-4 text-lg font-semibold">
            No Activity Yet
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Deposits, withdrawals, conversions and contributions
            will appear here.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {entries.map((entry) => {
            const config =
              entryConfig[entry.entry_type];

            const Icon = config.icon;

            return (
              <div
                key={entry.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">

                  <div
                    className={`rounded-xl p-3 ${config.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">

                    <h3 className="font-semibold text-gray-900">
                      {config.label}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {entry.description ??
                        "No description"}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(
                        entry.created_at
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>

                <div className="text-left sm:text-right">

                  <p className={`font-semibold ${
                    entry.amount >= 0
                      ? "text-green-700"
                      : "text-red-600"
                  }`}>
                    {entry.amount >= 0 ? "+" : ""}
                    {formatAmount(entry.currency, entry.amount)}
                  </p>

                  <p className="text-sm text-gray-500">
                    Balance:
                    {" "}
                    {formatAmount(
                      entry.currency,
                      entry.balance_after
                    )}
                  </p>

                </div>

              </div>
            );
          })}

        </div>
      )}
    </section>
  );
}