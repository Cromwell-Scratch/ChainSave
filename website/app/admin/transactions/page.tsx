"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type TransactionType =
  | "deposit"
  | "withdraw"
  | "contribution"
  | "payout";

type TransactionFilter = "all" | TransactionType;

type Transaction = {
  id: string;
  wallet_id: string;
  amount: number | string | null;
  transaction_type: string;
  description: string | null;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  created_at: string;
};

type Wallet = {
  id: string;
  user_id: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type TransactionView = Transaction & {
  full_name: string;
  email: string;
};

type TransactionStats = {
  total: number;
  deposits: number;
  withdrawals: number;
  contributions: number;
  payouts: number;
};

const INITIAL_STATS: TransactionStats = {
  total: 0,
  deposits: 0,
  withdrawals: 0,
  contributions: 0,
  payouts: 0,
};

const FILTER_OPTIONS: {
  value: TransactionFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "deposit",
    label: "Deposit",
  },
  {
    value: "withdraw",
    label: "Withdrawal",
  },
  {
    value: "contribution",
    label: "Contribution",
  },
  {
    value: "payout",
    label: "Payout",
  },
];

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<
    TransactionView[]
  >([]);

  const [stats, setStats] =
    useState<TransactionStats>(INITIAL_STATS);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<TransactionFilter>("all");

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      setMessage("");

      try {
        const {
          data: transactionData,
          error: transactionError,
        } = await supabase
          .from("wallet_transactions")
          .select(`
            id,
            wallet_id,
            amount,
            transaction_type,
            description,
            status,
            provider,
            provider_reference,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          });

        if (transactionError) {
          throw transactionError;
        }

        const {
          data: walletData,
          error: walletError,
        } = await supabase
          .from("wallets")
          .select("id, user_id");

        if (walletError) {
          throw walletError;
        }

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("id, full_name, email");

        if (profileError) {
          throw profileError;
        }

        const transactionRows =
          (transactionData as Transaction[] | null) ??
          [];

        const wallets =
          (walletData as Wallet[] | null) ?? [];

        const profiles =
          (profileData as Profile[] | null) ?? [];

        const walletToUser = new Map(
          wallets.map((wallet) => [
            wallet.id,
            wallet.user_id,
          ])
        );

        const profilesById = new Map(
          profiles.map((profile) => [
            profile.id,
            profile,
          ])
        );

        const rows: TransactionView[] =
          transactionRows.map((transaction) => {
            const userId = walletToUser.get(
              transaction.wallet_id
            );

            const profile = userId
              ? profilesById.get(userId)
              : undefined;

            return {
              ...transaction,

              full_name:
                profile?.full_name?.trim() ||
                "No name provided",

              email:
                profile?.email?.trim() ||
                "No email available",
            };
          });

        setTransactions(rows);

        setStats({
          total: rows.length,

          deposits: getTransactionTotal(
            rows,
            "deposit"
          ),

          withdrawals: getTransactionTotal(
            rows,
            "withdraw"
          ),

          contributions: getTransactionTotal(
            rows,
            "contribution"
          ),

          payouts: getTransactionTotal(
            rows,
            "payout"
          ),
        });
      } catch (error) {
        console.error(
          "Unable to load transactions:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load transactions."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesFilter =
        filter === "all" ||
        transaction.transaction_type === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        transaction.full_name,
        transaction.email,
        transaction.transaction_type,
        transaction.status,
        transaction.wallet_id,
        transaction.id,
        transaction.description ?? "",
        transaction.provider ?? "",
        transaction.provider_reference ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [filter, search, transactions]);

  function formatMoney(amount: number) {
    return `GHS ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getTypeClasses(type: string) {
    switch (type) {
      case "deposit":
        return "bg-green-100 text-green-800";

      case "withdraw":
        return "bg-red-100 text-red-800";

      case "contribution":
        return "bg-purple-100 text-purple-800";

      case "payout":
        return "bg-orange-100 text-orange-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";

      case "pending":
        return "bg-yellow-100 text-yellow-800";

      case "failed":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <section className="p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Financial Operations
        </p>

        <h1 className="mt-2 text-4xl font-bold text-gray-950">
          Transactions
        </h1>

        <p className="mt-2 text-gray-600">
          Monitor every financial transaction across
          ChainSave.
        </p>
      </div>

      {message && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="mt-8">
          <Card>
            <p className="text-gray-600">
              Loading transactions...
            </p>
          </Card>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <p className="text-sm font-semibold text-gray-500">
                Transactions
              </p>

              <h2 className="mt-3 text-3xl font-bold text-gray-950">
                {stats.total.toLocaleString()}
              </h2>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-gray-500">
                Deposits
              </p>

              <h2 className="mt-3 text-3xl font-bold text-green-700">
                {formatMoney(stats.deposits)}
              </h2>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-gray-500">
                Withdrawals
              </p>

              <h2 className="mt-3 text-3xl font-bold text-red-600">
                {formatMoney(stats.withdrawals)}
              </h2>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-gray-500">
                Contributions
              </p>

              <h2 className="mt-3 text-3xl font-bold text-purple-700">
                {formatMoney(stats.contributions)}
              </h2>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-gray-500">
                Payouts
              </p>

              <h2 className="mt-3 text-3xl font-bold text-orange-600">
                {formatMoney(stats.payouts)}
              </h2>
            </Card>
          </div>

          <Card className="mt-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <input
                type="search"
                placeholder="Search by user, email, reference, ID or description..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 lg:max-w-xl"
              />

              <p className="text-sm font-semibold text-gray-600">
                {filteredTransactions.length} result
                {filteredTransactions.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFilter(option.value)
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter === option.value
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Card>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-semibold text-gray-900">
                  No transactions found
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Try changing your search or filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                        User
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                        Type
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700">
                        Status
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700">
                        Date
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredTransactions.map(
                      (transaction) => {
                        const amount = Number(
                          transaction.amount ?? 0
                        );

                        return (
                          <tr
                            key={transaction.id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="px-6 py-5">
                              <p className="font-bold text-gray-950">
                                {
                                  transaction.full_name
                                }
                              </p>

                              <p className="mt-1 text-sm text-gray-600">
                                {transaction.email}
                              </p>

                              <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                {transaction.description ||
                                  "Wallet transaction"}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getTypeClasses(
                                  transaction.transaction_type
                                )}`}
                              >
                                {
                                  transaction.transaction_type
                                }
                              </span>
                            </td>

                            <td
                              className={`px-6 py-5 text-right font-bold ${
                                amount < 0
                                  ? "text-red-700"
                                  : "text-green-700"
                              }`}
                            >
                              {formatMoney(amount)}
                            </td>

                            <td className="px-6 py-5 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                                  transaction.status
                                )}`}
                              >
                                {transaction.status}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-6 py-5 text-center text-sm font-medium text-gray-700">
                              {formatDate(
                                transaction.created_at
                              )}
                            </td>

                            <td className="px-6 py-5 text-right">
                              <Link
                                href={`/admin/transactions/${transaction.id}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function getTransactionTotal(
  transactions: TransactionView[],
  type: TransactionType
) {
  return transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === type
    )
    .reduce(
      (total, transaction) =>
        total +
        Math.abs(
          Number(transaction.amount ?? 0)
        ),
      0
    );
}