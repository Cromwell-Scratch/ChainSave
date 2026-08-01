"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

import TransactionSummary from "@/components/transactions/TransactionSummary";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import TransactionTimeline from "@/components/transactions/TransactionTimeline";
import TransactionDetailsModal from "@/components/transactions/TransactionDetailsModal";
import TransactionEmptyState from "@/components/transactions/TransactionEmptyState";

import type { Transaction } from "@/components/transactions/TransactionCard";

export default function TransactionsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const [search, setSearch] = useState("");

  const [selectedFilter, setSelectedFilter] =
    useState("All");

  const [currency] = useState("GHS");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    await loadTransactions(session.user.id);
  }

  async function loadTransactions(userId: string) {
  setLoading(true);

  try {
    // Step 1: Find the wallet belonging to the logged-in user.
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, currency")
      .eq("user_id", userId)
      .maybeSingle();

    if (walletError) {
      console.error("Wallet loading error:", walletError);
      setTransactions([]);
      return;
    }

    if (!wallet) {
      console.warn("No wallet exists for this user.");
      setTransactions([]);
      return;
    }

    // Step 2: Load every transaction belonging to that wallet.
    const { data, error: transactionError } = await supabase
      .from("wallet_transactions")
      .select(`
        id,
        wallet_id,
        amount,
        transaction_type,
        description,
        status,
        created_at,
        provider,
        provider_reference,
        provider_transaction_id,
        paid_at
      `)
      .eq("wallet_id", wallet.id)
      .order("created_at", {
        ascending: false,
      });

    if (transactionError) {
      console.error(
        "Transaction loading error:",
        transactionError
      );

      setTransactions([]);
      return;
    }

    const formattedTransactions: Transaction[] = (data ?? []).map(
      (transaction) => {
        const originalType = String(
          transaction.transaction_type ?? ""
        ).toLowerCase();

        // Your database uses "withdraw", while the UI type uses
        // "withdrawal".
        const transactionType: Transaction["transaction_type"] =
          originalType === "withdraw"
            ? "withdrawal"
            : originalType === "deposit"
              ? "deposit"
              : originalType === "contribution"
                ? "contribution"
                : "payout";

        return {
          id: transaction.id,

          // Some contribution rows are stored as negative amounts.
          // The UI should display the absolute transaction amount.
          amount: Math.abs(Number(transaction.amount ?? 0)),

          currency: wallet.currency ?? "GHS",

          transaction_type: transactionType,

          status:
            transaction.status === "pending" ||
            transaction.status === "failed"
              ? transaction.status
              : "completed",

          payment_method:
            transaction.provider ??
            (transactionType === "deposit"
              ? "Wallet deposit"
              : "Wallet"),

          description:
            transaction.description ??
            "ChainSave wallet transaction",

          reference:
            transaction.provider_reference ??
            transaction.provider_transaction_id ??
            transaction.id,

          created_at:
            transaction.paid_at ??
            transaction.created_at,
        };
      }
    );

    setTransactions(formattedTransactions);
  } catch (error) {
    console.error("Unexpected transaction error:", error);
    setTransactions([]);
  } finally {
    setLoading(false);
  }
}

  const filteredTransactions = useMemo(() => {
    let results = [...transactions];

    if (search.trim()) {
      const term = search.toLowerCase();

      results = results.filter((transaction) =>
        [
          transaction.transaction_type,
          transaction.description,
          transaction.reference,
          transaction.circle_name,
          transaction.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }

    if (selectedFilter !== "All") {
      const filter = selectedFilter.toLowerCase();

      results = results.filter(
        (transaction) =>
          transaction.transaction_type === filter ||
          transaction.status === filter
      );
    }

    return results;
  }, [transactions, search, selectedFilter]);

  const moneyIn = useMemo(() => {
  return transactions
    .filter(
      (transaction) =>
        transaction.status === "completed" &&
        (transaction.transaction_type === "deposit" ||
          transaction.transaction_type === "payout")
    )
    .reduce(
      (sum, transaction) =>
        sum + Math.abs(Number(transaction.amount)),
      0
    );
}, [transactions]);

const moneyOut = useMemo(() => {
  return transactions
    .filter(
      (transaction) =>
        transaction.status === "completed" &&
        (transaction.transaction_type === "withdrawal" ||
          transaction.transaction_type === "contribution")
    )
    .reduce(
      (sum, transaction) =>
        sum + Math.abs(Number(transaction.amount)),
      0
    );
}, [transactions]);

const netFlow = moneyIn - moneyOut;
  
    const exportCSV = () => {
    if (!filteredTransactions.length) return;

    const headers = [
      "Date",
      "Type",
      "Amount",
      "Currency",
      "Status",
      "Reference",
      "Description",
      "Circle",
    ];

    const rows = filteredTransactions.map((t) => [
      t.created_at,
      t.transaction_type,
      t.amount,
      t.currency,
      t.status,
      t.reference ?? "",
      t.description ?? "",
      t.circle_name ?? "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "transactions.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>

          <p className="mt-4 text-gray-600">
            Loading transactions...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">

        <Sidebar />

        <div className="flex-1">

          <Topbar />

          <div className="mx-auto max-w-7xl space-y-8 p-8">

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-green-600">
                Financial Activity
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Transactions
              </h1>

              <p className="mt-2 text-gray-500">
                Track every deposit, withdrawal, contribution and payout.
              </p>
            </div>

            <TransactionSummary
              totalTransactions={transactions.length}
              moneyIn={moneyIn}
              moneyOut={moneyOut}
              netFlow={netFlow}
              currency={currency}
            />

            <TransactionFilters
              search={search}
              onSearchChange={setSearch}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              onExport={exportCSV}
            />
                        {filteredTransactions.length === 0 ? (
              <TransactionEmptyState />
            ) : (
              <TransactionTimeline
                transactions={filteredTransactions}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            <TransactionDetailsModal
              transaction={selectedTransaction}
              open={selectedTransaction !== null}
              onClose={() => setSelectedTransaction(null)}
            />

          </div>
        </div>
      </div>
    </main>
  );
}