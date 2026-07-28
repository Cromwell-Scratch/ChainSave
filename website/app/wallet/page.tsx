"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CircleDollarSign,
  Clock3,
  Filter,
  Landmark,
  Search,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string | null;
};

type WalletTransaction = {
  id: string;
  wallet_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  status: string;
  created_at: string | null;
};

type TransactionMode = "deposit" | "withdraw";

type TransactionFilter =
  | "all"
  | "deposit"
  | "withdraw"
  | "contribution"
  | "payout";

const transactionFilters: {
  label: string;
  value: TransactionFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Deposits", value: "deposit" },
  { label: "Withdrawals", value: "withdraw" },
  { label: "Contributions", value: "contribution" },
  { label: "Payouts", value: "payout" },
];

export default function WalletPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [activeFilter, setActiveFilter] =
    useState<TransactionFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [modalMode, setModalMode] =
    useState<TransactionMode | null>(null);
  const [amount, setAmount] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadTransactions = useCallback(
    async (walletId: string) => {
      const {
        data: transactionData,
        error: transactionError,
      } = await supabase
        .from("wallet_transactions")
        .select(
          "id, wallet_id, amount, transaction_type, description, status, created_at"
        )
        .eq("wallet_id", walletId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (transactionError) {
        throw transactionError;
      }

      setTransactions(
        ((transactionData as WalletTransaction[]) ?? []).map(
          (transaction) => ({
            ...transaction,
            amount: Number(transaction.amount),
          })
        )
      );
    },
    []
  );

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: existingWallet,
        error: walletError,
      } = await supabase
        .from("wallets")
        .select("id, user_id, balance, currency, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletError) {
        throw walletError;
      }

      let loadedWallet = existingWallet as Wallet | null;

      if (!loadedWallet) {
        const {
          data: newWallet,
          error: createWalletError,
        } = await supabase
          .from("wallets")
          .insert({
            user_id: user.id,
            balance: 0,
            currency: "GHS",
          })
          .select("id, user_id, balance, currency, created_at")
          .single();

        if (createWalletError) {
          throw createWalletError;
        }

        loadedWallet = newWallet as Wallet;
      }

      const normalizedWallet: Wallet = {
        ...loadedWallet,
        balance: Number(loadedWallet.balance),
      };

      setWallet(normalizedWallet);
      await loadTransactions(normalizedWallet.id);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load wallet."
      );
    } finally {
      setLoading(false);
    }
  }, [loadTransactions, router]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const totalDeposited = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.transaction_type === "deposit" &&
            transaction.status === "completed"
        )
        .reduce(
          (total, transaction) =>
            total + Math.abs(Number(transaction.amount)),
          0
        ),
    [transactions]
  );

  const totalWithdrawn = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.transaction_type === "withdraw" &&
            transaction.status === "completed"
        )
        .reduce(
          (total, transaction) =>
            total + Math.abs(Number(transaction.amount)),
          0
        ),
    [transactions]
  );

  const totalContributed = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.transaction_type === "contribution" &&
            transaction.status === "completed"
        )
        .reduce(
          (total, transaction) =>
            total + Math.abs(Number(transaction.amount)),
          0
        ),
    [transactions]
  );

  const totalPayouts = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.transaction_type === "payout" &&
            transaction.status === "completed"
        )
        .reduce(
          (total, transaction) =>
            total + Math.abs(Number(transaction.amount)),
          0
        ),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesFilter =
        activeFilter === "all" ||
        transaction.transaction_type === activeFilter;

      const searchableText = `${transaction.transaction_type} ${
        transaction.description ?? ""
      } ${transaction.status}`.toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchTerm, transactions]);

  function formatAmount(value: number) {
    return Number(value).toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatTransactionDate(date: string | null) {
    if (!date) {
      return "Date unavailable";
    }

    const transactionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    const isToday =
      transactionDate.toDateString() === today.toDateString();

    const isYesterday =
      transactionDate.toDateString() ===
      yesterday.toDateString();

    const time = transactionDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `Today, ${time}`;
    }

    if (isYesterday) {
      return `Yesterday, ${time}`;
    }

    return transactionDate.toLocaleString();
  }

  function openTransactionModal(mode: TransactionMode) {
    setModalMode(mode);
    setAmount("");
    setTransactionMessage("");
    setSuccessMessage("");
  }

  function closeTransactionModal() {
    if (processing) return;

    setModalMode(null);
    setAmount("");
    setTransactionMessage("");
  }

  async function handlePaystackDeposit(
  depositAmount: number
) {
  setMessage("");
  setSuccessMessage("");

  try {
    if (
      !Number.isFinite(depositAmount) ||
      depositAmount <= 0
    ) {
      setMessage("Enter a valid deposit amount.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user?.email) {
      setMessage("You must be logged in to make a deposit.");
      return;
    }

    const {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

if (sessionError) {
  throw sessionError;
}

if (!session?.access_token) {
  throw new Error(
    "Your session has expired. Please sign in again."
  );
}

const response = await fetch(
  "/api/paystack/initialize",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      amount: depositAmount,
    }),
  }
);

    const result = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(
        result.message ||
          "Unable to initialize the Paystack payment."
      );
    }

    const accessCode = result.data?.access_code;

    if (!accessCode) {
      throw new Error(
        "Paystack did not return an access code."
      );
    }

    /*
     * Import Paystack only after the user clicks.
     * This prevents Next.js from loading it during
     * server-side rendering, where window is unavailable.
     */
    const { default: PaystackPop } = await import(
      "@paystack/inline-js"
    );

    const popup = new PaystackPop();

    popup.resumeTransaction(accessCode);
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error
    );

    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to initialize payment."
    );
  }
}

async function handleWalletTransaction(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (!wallet || !modalMode) {
    return;
  }

  setProcessing(true);
  setTransactionMessage("");
  setSuccessMessage("");
  setMessage("");

  try {
    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setTransactionMessage("Enter a valid amount.");
      return;
    }

    /*
     * Deposits are initialized through Paystack.
     * Do not credit the wallet from the browser.
     */
    if (modalMode === "deposit") {
      await handlePaystackDeposit(numericAmount);

      setModalMode(null);
      setAmount("");
      return;
    }

    /*
     * Temporary development withdrawal flow.
     */
    if (numericAmount > Number(wallet.balance)) {
      setTransactionMessage(
        "You do not have enough wallet balance for this withdrawal."
      );
      return;
    }

    const currentBalance = Number(wallet.balance);
    const newBalance = currentBalance - numericAmount;

    const { error: balanceError } = await supabase
      .from("wallets")
      .update({
        balance: newBalance,
      })
      .eq("id", wallet.id);

    if (balanceError) {
      throw balanceError;
    }

    const {
      data: newTransaction,
      error: transactionError,
    } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        amount: numericAmount,
        transaction_type: "withdraw",
        description: "Manual wallet withdrawal",
        status: "completed",
      })
      .select(
        "id, wallet_id, amount, transaction_type, description, status, created_at"
      )
      .single();

    if (transactionError) {
      /*
       * Restore the previous balance if recording
       * the withdrawal transaction fails.
       */
      await supabase
        .from("wallets")
        .update({
          balance: currentBalance,
        })
        .eq("id", wallet.id);

      throw transactionError;
    }

    setWallet((currentWallet) =>
      currentWallet
        ? {
            ...currentWallet,
            balance: newBalance,
          }
        : currentWallet
    );

    setTransactions((currentTransactions) => [
      {
        ...(newTransaction as WalletTransaction),
        amount: Number(newTransaction.amount),
      },
      ...currentTransactions,
    ]);

    setSuccessMessage(
      `${wallet.currency} ${formatAmount(
        numericAmount
      )} was withdrawn successfully.`
    );

    setModalMode(null);
    setAmount("");
  } catch (error) {
    console.error("Wallet transaction error:", error);

    setTransactionMessage(
      error instanceof Error
        ? error.message
        : "Unable to complete the transaction."
    );
  } finally {
    setProcessing(false);
  }
}

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="p-6 lg:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                  Financial hub
                </p>

                <h1 className="mt-2 text-4xl font-bold text-gray-900">
                  Wallet
                </h1>

                <p className="mt-2 text-gray-600">
                  Manage your ChainSave balance and review your
                  financial activity.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    openTransactionModal("deposit")
                  }
                  disabled={!wallet || loading}
                >
                  <ArrowDownToLine className="mr-2 h-5 w-5" />
                  Deposit Funds
                </Button>

                <Button
                  variant="secondary"
                  onClick={() =>
                    openTransactionModal("withdraw")
                  }
                  disabled={!wallet || loading}

                  
                >
                  <ArrowUpFromLine className="mr-2 h-5 w-5" />
                  Withdraw
                </Button>
              </div>
            </div>

            {loading && (
              <p className="mt-8 text-gray-600">
                Loading wallet...
              </p>
            )}

            {message && (
              <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
                {message}
              </p>
            )}

            {successMessage && (
              <p className="mt-8 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
                {successMessage}
              </p>
            )}

            {!loading && !message && wallet && (
              <>
                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                  <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 p-10 text-white shadow-2xl lg:col-span-2">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
                    <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/5" />

                    <div className="relative z-10">
                      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-widest text-green-100">
                            ChainSave Wallet
                          </p>

                          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
                            {wallet.currency}{" "}
                            {formatAmount(wallet.balance)}
                          </h2>

                          <p className="mt-2 text-green-100">
                            Available Balance
                          </p>
                        </div>

                        <div className="w-fit rounded-3xl bg-white/20 p-5 backdrop-blur">
                          <WalletCards className="h-10 w-10" />
                        </div>
                      </div>

                      <div className="mt-10 grid gap-6 sm:grid-cols-3">
                        <WalletInformation
                          label="Wallet ID"
                          value={`${wallet.id.slice(0, 8)}...`}
                        />

                        <WalletInformation
                          label="Currency"
                          value={wallet.currency}
                        />

                        <WalletInformation
                          label="Status"
                          value="Active"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Wallet Currency
                        </p>

                        <h2 className="mt-3 text-3xl font-bold text-gray-900">
                          🇬🇭 {wallet.currency}
                        </h2>
                      </div>

                      <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                        <Landmark className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 border-t border-gray-200 pt-5">
                      <WalletDetail
                        label="Currency name"
                        value="Ghana Cedi"
                      />

                      <WalletDetail
                        label="Wallet type"
                        value="Internal Wallet"
                      />

                      <WalletDetail
                        label="Network"
                        value="Rootstock ready"
                      />

                      <WalletDetail
                        label="Status"
                        value="Active"
                      />
                    </div>
                  </Card>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    icon={TrendingUp}
                    label="Total Deposited"
                    value={`${wallet.currency} ${formatAmount(
                      totalDeposited
                    )}`}
                    accent="green"
                  />

                  <SummaryCard
                    icon={TrendingDown}
                    label="Total Withdrawn"
                    value={`${wallet.currency} ${formatAmount(
                      totalWithdrawn
                    )}`}
                    accent="red"
                  />

                  <SummaryCard
                    icon={CircleDollarSign}
                    label="Circle Contributions"
                    value={`${wallet.currency} ${formatAmount(
                      totalContributed
                    )}`}
                    accent="blue"
                  />

                  <SummaryCard
                    icon={Banknote}
                    label="Payouts Received"
                    value={`${wallet.currency} ${formatAmount(
                      totalPayouts
                    )}`}
                    accent="purple"
                  />
                </div>

                <Card className="mt-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Transaction History
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Review deposits, withdrawals,
                        contributions, and payouts.
                      </p>
                    </div>

                    <div className="relative w-full lg:max-w-sm">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                      <Input
                        type="search"
                        placeholder="Search transactions"
                        value={searchTerm}
                        onChange={(event) =>
                          setSearchTerm(event.target.value)
                        }
                        className="pl-12"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="mr-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Filter className="h-4 w-4" />
                      Filter
                    </div>

                    {transactionFilters.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() =>
                          setActiveFilter(filter.value)
                        }
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          activeFilter === filter.value
                            ? "bg-green-700 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-7">
                    {filteredTransactions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                          <WalletCards className="h-7 w-7" />
                        </div>

                        <h3 className="mt-5 text-xl font-bold text-gray-900">
                          No transactions found
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                          Change the selected filter or deposit
                          funds to begin using your wallet.
                        </p>

                        <Button
                          className="mt-6"
                          onClick={() =>
                            openTransactionModal("deposit")
                          }
                        >
                          <ArrowDownToLine className="mr-2 h-5 w-5" />
                          Deposit Funds
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredTransactions.map(
                          (transaction) => (
                            <TransactionRow
                              key={transaction.id}
                              transaction={transaction}
                              currency={wallet.currency}
                              formatAmount={formatAmount}
                              formatDate={
                                formatTransactionDate
                              }
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}
          </section>
        </div>
      </div>

      {modalMode && wallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalMode === "deposit"
                    ? "Deposit Funds"
                    : "Withdraw Funds"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {modalMode === "deposit"
                    ? "Add funds to your internal ChainSave wallet."
                    : `Available balance: ${
                        wallet.currency
                      } ${formatAmount(wallet.balance)}`}
                </p>
              </div>

              <button
                type="button"
                onClick={closeTransactionModal}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close transaction form"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={handleWalletTransaction}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Amount
                </label>

                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  required
                />

                <p className="mt-2 text-xs text-gray-500">
                  Currency: {wallet.currency}
                </p>
              </div>

              {transactionMessage && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {transactionMessage}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeTransactionModal}
                  disabled={processing}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={processing}>
                  {processing
                    ? "Processing..."
                    : modalMode === "deposit"
                      ? "Confirm Deposit"
                      : "Confirm Withdrawal"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}

type WalletInformationProps = {
  label: string;
  value: string;
};

function WalletInformation({
  label,
  value,
}: WalletInformationProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-green-100">
        {label}
      </p>

      <p className="mt-1 font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

type WalletDetailProps = {
  label: string;
  value: string;
};

function WalletDetail({
  label,
  value,
}: WalletDetailProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

type SummaryCardProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  accent: "green" | "red" | "blue" | "purple";
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: SummaryCardProps) {
  const accentClasses = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-3 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 ${accentClasses[accent]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

type TransactionRowProps = {
  transaction: WalletTransaction;
  currency: string;
  formatAmount: (amount: number) => string;
  formatDate: (date: string | null) => string;
};

function TransactionRow({
  transaction,
  currency,
  formatAmount,
  formatDate,
}: TransactionRowProps) {
  const transactionStyles = {
    deposit: {
      icon: ArrowDownToLine,
      iconClass: "bg-green-100 text-green-700",
      amountClass: "text-green-700",
      title: "Deposit",
      credit: true,
    },
    withdraw: {
      icon: ArrowUpFromLine,
      iconClass: "bg-red-100 text-red-700",
      amountClass: "text-red-600",
      title: "Withdrawal",
      credit: false,
    },
    contribution: {
      icon: CircleDollarSign,
      iconClass: "bg-blue-100 text-blue-700",
      amountClass: "text-red-600",
      title: "Circle Contribution",
      credit: false,
    },
    payout: {
      icon: Banknote,
      iconClass: "bg-purple-100 text-purple-700",
      amountClass: "text-green-700",
      title: "Payout",
      credit: true,
    },
  };

  const style =
    transactionStyles[
      transaction.transaction_type as keyof typeof transactionStyles
    ] ?? {
      icon: WalletCards,
      iconClass: "bg-gray-100 text-gray-700",
      amountClass: "text-gray-900",
      title: transaction.transaction_type,
      credit: Number(transaction.amount) >= 0,
    };

  const Icon = style.icon;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div className="min-w-0">
          <p className="font-bold capitalize text-gray-900">
            {style.title}
          </p>

          <p className="mt-1 truncate text-sm text-gray-500">
            {transaction.description || "Wallet transaction"}
          </p>

          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDate(transaction.created_at)}
          </div>
        </div>
      </div>

      <div className="text-left sm:text-right">
        <p className={`font-bold ${style.amountClass}`}>
          {style.credit ? "+" : "-"}
          {currency}{" "}
          {formatAmount(
            Math.abs(Number(transaction.amount))
          )}
        </p>

        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            transaction.status === "completed"
              ? "bg-green-100 text-green-700"
              : transaction.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {transaction.status}
        </span>
      </div>
    </div>
  );
}
