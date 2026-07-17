"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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

export default function WalletPage() {
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadWallet() {
      setLoading(true);
      setMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          setMessage(userError.message);
          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: walletData, error: walletError } =
          await supabase
            .from("wallets")
            .select(
              "id, user_id, balance, currency, created_at"
            )
            .eq("user_id", user.id)
            .single();

        if (walletError) {
          setMessage(walletError.message);
          return;
        }

        const loadedWallet = walletData as Wallet;
        setWallet(loadedWallet);

        const {
          data: transactionData,
          error: transactionError,
        } = await supabase
          .from("wallet_transactions")
          .select(
            "id, wallet_id, amount, transaction_type, description, status, created_at"
          )
          .eq("wallet_id", loadedWallet.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (transactionError) {
          setMessage(transactionError.message);
          return;
        }

        setTransactions(
          (transactionData as WalletTransaction[]) ?? []
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load wallet."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, [router]);

  function formatAmount(amount: number) {
    return Number(amount).toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1">
          <Topbar />

          <section className="p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Wallet
                </h1>

                <p className="mt-2 text-gray-600">
                  Manage your ChainSave wallet and view recent
                  transactions.
                </p>
              </div>

              <div className="flex gap-3">
                <Button disabled>
                  Deposit Funds
                </Button>

                <Button variant="secondary" disabled>
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
              <p className="mt-8 font-medium text-red-600">
                {message}
              </p>
            )}

            {!loading && !message && wallet && (
              <>
                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <p className="text-sm font-medium text-gray-500">
                      Available Balance
                    </p>

                    <h2 className="mt-3 text-4xl font-bold text-green-700">
                      {wallet.currency}{" "}
                      {formatAmount(wallet.balance)}
                    </h2>

                    <p className="mt-3 text-sm text-gray-500">
                      This balance will be used for contributions
                      and future payouts.
                    </p>
                  </Card>

                  <Card>
                    <p className="text-sm font-medium text-gray-500">
                      Wallet Currency
                    </p>

                    <h2 className="mt-3 text-3xl font-bold text-gray-900">
                      {wallet.currency}
                    </h2>

                    <p className="mt-3 text-sm text-gray-500">
                      Default wallet currency
                    </p>
                  </Card>
                </div>

                <Card className="mt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Recent Transactions
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Your latest wallet activity
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    {transactions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                        <h3 className="font-semibold text-gray-900">
                          No wallet transactions yet
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          Deposits, withdrawals, contributions, and
                          payouts will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transactions.map((transaction) => {
                          const isCredit =
                            transaction.transaction_type ===
                              "deposit" ||
                            transaction.transaction_type ===
                              "payout";

                          return (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                            >
                              <div>
                                <p className="font-semibold capitalize text-gray-900">
                                  {transaction.transaction_type}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                  {transaction.description ||
                                    "Wallet transaction"}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                  {transaction.created_at
                                    ? new Date(
                                        transaction.created_at
                                      ).toLocaleString()
                                    : "Date unavailable"}
                                </p>
                              </div>

                              <div className="text-right">
                                <p
                                  className={`font-bold ${
                                    isCredit
                                      ? "text-green-700"
                                      : "text-red-600"
                                  }`}
                                >
                                  {isCredit ? "+" : "-"}
                                  {wallet.currency}{" "}
                                  {formatAmount(
                                    Math.abs(transaction.amount)
                                  )}
                                </p>

                                <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                                  {transaction.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {!loading && !message && !wallet && (
              <Card className="mt-8 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Wallet not found
                </h2>

                <p className="mt-2 text-gray-500">
                  No wallet is connected to this account yet.
                </p>
              </Card>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}