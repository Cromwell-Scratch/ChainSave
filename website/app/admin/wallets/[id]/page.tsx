"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Banknote,
  CircleDollarSign,
  Clock3,
  PiggyBank,
  UserRound,
  WalletCards,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type WalletRow = {
  id: string;
  user_id: string;
  balance: number | string | null;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  frozen_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  role: string;
};

type WalletTransaction = {
  id: string;
  wallet_id: string;
  amount: number | string | null;
  transaction_type: string;
  description: string | null;
  status: string;
  created_at: string | null;
};

export default function AdminWalletDetailsPage() {
  const params = useParams<{
    id: string;
  }>();

  const walletId = params.id;

  const [wallet, setWallet] =
    useState<WalletRow | null>(null);

  const [profile, setProfile] =
    useState<ProfileRow | null>(null);

  const [transactions, setTransactions] =
    useState<WalletTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!walletId) {
      return;
    }

    async function loadWallet() {
      setLoading(true);
      setMessage("");

      try {
        const {
          data: walletData,
          error: walletError,
        } = await supabase
          .from("wallets")
          .select(`
            id,
            user_id,
            balance,
            currency,
            status,
            created_at,
            updated_at,
            frozen_at
          `)
          .eq("id", walletId)
          .single();

        if (walletError) {
          throw walletError;
        }

        const normalizedWallet =
          walletData as WalletRow;

        setWallet(normalizedWallet);

        const [
          profileResult,
          transactionsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              email,
              role,
              status
            `)
            .eq("id", normalizedWallet.user_id)
            .maybeSingle(),

          supabase
            .from("wallet_transactions")
            .select(`
              id,
              wallet_id,
              amount,
              transaction_type,
              description,
              status,
              created_at
            `)
            .eq("wallet_id", walletId)
            .order("created_at", {
              ascending: false,
            }),
        ]);

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (transactionsResult.error) {
          throw transactionsResult.error;
        }

        setProfile(
          (profileResult.data as ProfileRow | null) ??
            null
        );

        setTransactions(
          (transactionsResult.data as
            | WalletTransaction[]
            | null) ?? []
        );
      } catch (error) {
        console.error(
          "Unable to load wallet details:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load wallet details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, [walletId]);

  const completedTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.status === "completed"
      ),
    [transactions]
  );

  const totalDeposits = useMemo(
    () =>
      completedTransactions
        .filter(
          (transaction) =>
            transaction.transaction_type ===
            "deposit"
        )
        .reduce(
          (total, transaction) =>
            total +
            Math.abs(
              Number(transaction.amount ?? 0)
            ),
          0
        ),
    [completedTransactions]
  );

  const totalWithdrawals = useMemo(
    () =>
      completedTransactions
        .filter(
          (transaction) =>
            transaction.transaction_type ===
            "withdraw"
        )
        .reduce(
          (total, transaction) =>
            total +
            Math.abs(
              Number(transaction.amount ?? 0)
            ),
          0
        ),
    [completedTransactions]
  );

  const totalContributions = useMemo(
    () =>
      completedTransactions
        .filter(
          (transaction) =>
            transaction.transaction_type ===
            "contribution"
        )
        .reduce(
          (total, transaction) =>
            total +
            Math.abs(
              Number(transaction.amount ?? 0)
            ),
          0
        ),
    [completedTransactions]
  );

  const totalPayouts = useMemo(
    () =>
      completedTransactions
        .filter(
          (transaction) =>
            transaction.transaction_type ===
            "payout"
        )
        .reduce(
          (total, transaction) =>
            total +
            Math.abs(
              Number(transaction.amount ?? 0)
            ),
          0
        ),
    [completedTransactions]
  );

  function formatMoney(
    amount: number,
    currency: string = "GHS"
  ) {
    return `${currency} ${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  function getTransactionStyle(type: string) {
    switch (type) {
      case "deposit":
        return {
          icon: ArrowDownToLine,
          iconClass:
            "bg-green-100 text-green-700",
          amountClass: "text-green-700",
          sign: "+",
        };

      case "withdraw":
        return {
          icon: ArrowUpFromLine,
          iconClass: "bg-red-100 text-red-700",
          amountClass: "text-red-700",
          sign: "-",
        };

      case "contribution":
        return {
          icon: PiggyBank,
          iconClass:
            "bg-purple-100 text-purple-700",
          amountClass: "text-red-700",
          sign: "-",
        };

      case "payout":
        return {
          icon: Banknote,
          iconClass:
            "bg-orange-100 text-orange-700",
          amountClass: "text-green-700",
          sign: "+",
        };

      default:
        return {
          icon: CircleDollarSign,
          iconClass:
            "bg-gray-100 text-gray-700",
          amountClass: "text-gray-950",
          sign: "",
        };
    }
  }

  if (loading) {
    return (
      <section className="p-6 lg:p-8">
        <p className="text-gray-600">
          Loading wallet details...
        </p>
      </section>
    );
  }

  if (message || !wallet) {
    return (
      <section className="p-6 lg:p-8">
        <Link
          href="/admin/wallets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wallets
        </Link>

        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {message || "Wallet not found."}
        </p>
      </section>
    );
  }

  const currency = wallet.currency || "GHS";
  const balance = Number(wallet.balance ?? 0);

  const summaryCards = [
    {
      label: "Total Deposits",
      value: totalDeposits,
      icon: ArrowDownToLine,
      iconClass: "bg-green-100 text-green-700",
    },
    {
      label: "Total Withdrawals",
      value: totalWithdrawals,
      icon: ArrowUpFromLine,
      iconClass: "bg-red-100 text-red-700",
    },
    {
      label: "Total Contributions",
      value: totalContributions,
      icon: PiggyBank,
      iconClass:
        "bg-purple-100 text-purple-700",
    },
    {
      label: "Total Payouts",
      value: totalPayouts,
      icon: Banknote,
      iconClass:
        "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <section className="p-6 lg:p-8">
      <Link
        href="/admin/wallets"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Wallets
      </Link>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
  <div className="flex items-start justify-between">
    <div>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
        <WalletCards className="h-8 w-8 text-green-700" />
      </div>

      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
        Wallet Details
      </p>

      <h1 className="mt-2 text-3xl font-bold text-gray-950">
        {profile?.full_name || "Unnamed User"}
      </h1>

      <p className="mt-2 text-gray-600">
        {profile?.email || "No email available"}
      </p>
    </div>

    <span
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        profile?.status === "active"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {profile?.status ?? "Unknown"}
    </span>
  </div>
  </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">

  <div className="rounded-xl bg-gray-50 p-5">
    <p className="text-sm text-gray-500">Current Balance</p>

    <p className="mt-2 text-3xl font-bold text-green-700">
      {wallet?.currency} {Number(wallet?.balance ?? 0).toFixed(2)}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-5">
    <p className="text-sm text-gray-500">Wallet ID</p>

    <p className="mt-2 break-all font-mono text-sm">
      {wallet?.id}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-5">
    <p className="text-sm text-gray-500">User ID</p>

    <p className="mt-2 break-all font-mono text-sm">
      {wallet?.user_id}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-5">
    <p className="text-sm text-gray-500">Created</p>

    <p className="mt-2 font-semibold">
      {wallet
        ? new Date(wallet.created_at).toLocaleDateString()
        : "-"}
    </p>
  </div>

</div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <UserRound className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Wallet Owner
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-950">
                  {profile?.full_name ||
                    "No name provided"}
                </h2>

                <p className="mt-1 text-gray-600">
                  {profile?.email ||
                    "No email available"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-green-50 px-5 py-4">
              <p className="text-sm font-semibold text-green-700">
                Current Balance
              </p>

              <p className="mt-2 text-3xl font-bold text-green-900">
                {formatMoney(balance, currency)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t border-gray-200 pt-6 sm:grid-cols-2">
            <WalletDetail
              label="Wallet ID"
              value={wallet.id}
            />

            <WalletDetail
              label="User ID"
              value={wallet.user_id}
            />

            <WalletDetail
              label="Currency"
              value={currency}
            />

            <WalletDetail
              label="Created"
              value={formatDate(wallet.created_at)}
            />

            <WalletDetail
              label="Last Updated"
              value={formatDate(wallet.updated_at)}
            />

            <WalletDetail
              label="Frozen At"
              value={formatDate(wallet.frozen_at)}
            />
          </div>
        </Card>

        <Card>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <WalletCards className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-950">
            Account Information
          </h2>

          <div className="mt-5 space-y-4">
            <WalletDetail
              label="Profile Role"
              value={profile?.role || "user"}
            />

            <WalletDetail
              label="Profile Status"
              value={profile?.status || "active"}
            />

            <WalletDetail
              label="Transactions"
              value={transactions.length.toString()}
            />
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((summary) => {
          const Icon = summary.icon;

          return (
            <Card key={summary.label}>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${summary.iconClass}`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <p className="mt-5 text-sm font-semibold text-gray-600">
                {summary.label}
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {formatMoney(
                  summary.value,
                  currency
                )}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 overflow-hidden p-0">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-2xl font-bold text-gray-950">
            Recent Transactions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Latest financial activity for this wallet.
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <WalletCards className="mx-auto h-8 w-8 text-gray-400" />

            <p className="mt-4 font-semibold text-gray-900">
              No transactions found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const style = getTransactionStyle(
                transaction.transaction_type
              );

              const Icon = style.icon;

              return (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold capitalize text-gray-950">
                        {transaction.transaction_type}
                      </p>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {transaction.description ||
                          "Wallet transaction"}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(
                          transaction.created_at
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p
                      className={`font-bold ${style.amountClass}`}
                    >
                      {style.sign}
                      {formatMoney(
                        Math.abs(
                          Number(
                            transaction.amount ?? 0
                          )
                        ),
                        currency
                      )}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        transaction.status ===
                        "completed"
                          ? "bg-green-100 text-green-800"
                          : transaction.status ===
                              "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}

type WalletDetailProps = {
  label: string;
  value: React.ReactNode;
};

function WalletDetail({
  label,
  value,
}: WalletDetailProps) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-all font-semibold text-gray-950">
        {value}
      </p>
    </div>
  );
}