"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CircleDollarSign,
  Copy,
  UserRound,
  WalletCards,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type TransactionRow = {
  id: string;
  wallet_id: string;
  amount: number | string | null;
  transaction_type: string;
  description: string | null;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  provider_transaction_id: string | null;
  created_at: string;
  paid_at: string | null;
};

type WalletRow = {
  id: string;
  user_id: string;
  balance: number | string | null;
  currency: string;
  status: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: string;
};

export default function TransactionDetailsPage() {
  const params = useParams<{
    id: string;
  }>();

  const transactionId = params.id;

  const [transaction, setTransaction] =
    useState<TransactionRow | null>(null);

  const [wallet, setWallet] =
    useState<WalletRow | null>(null);

  const [profile, setProfile] =
    useState<ProfileRow | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      return;
    }

    async function loadTransactionDetails() {
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
            provider_transaction_id,
            created_at,
            paid_at
          `)
          .eq("id", transactionId)
          .single();

        if (transactionError) {
          throw transactionError;
        }

        const normalizedTransaction =
          transactionData as TransactionRow;

        setTransaction(normalizedTransaction);

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
            created_at
          `)
          .eq(
            "id",
            normalizedTransaction.wallet_id
          )
          .maybeSingle();

        if (walletError) {
          throw walletError;
        }

        const normalizedWallet =
          walletData as WalletRow | null;

        setWallet(normalizedWallet);

        if (normalizedWallet?.user_id) {
          const {
            data: profileData,
            error: profileError,
          } = await supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              email,
              role,
              status
            `)
            .eq(
              "id",
              normalizedWallet.user_id
            )
            .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          setProfile(
            (profileData as ProfileRow | null) ??
              null
          );
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error(
          "Unable to load transaction details:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load transaction details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactionDetails();
  }, [transactionId]);

  async function copyTransactionId() {
    if (!transaction?.id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        transaction.id
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Unable to copy transaction ID:",
        error
      );
    }
  }

  function formatMoney(
    amount: number | string | null,
    currency: string = "GHS"
  ) {
    const numericAmount = Number(amount ?? 0);

    return `${currency} ${numericAmount.toLocaleString(
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

  function getAmountClasses(type: string) {
    switch (type) {
      case "deposit":
        return "text-green-700";

      case "withdraw":
        return "text-red-700";

      case "contribution":
        return "text-purple-700";

      case "payout":
        return "text-orange-700";

      default:
        return "text-gray-950";
    }
  }

  if (loading) {
    return (
      <section className="p-6 lg:p-8">
        <Link
          href="/admin/transactions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>

        <Card className="mt-8">
          <p className="text-gray-600">
            Loading transaction details...
          </p>
        </Card>
      </section>
    );
  }

  if (message || !transaction) {
    return (
      <section className="p-6 lg:p-8">
        <Link
          href="/admin/transactions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>

        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {message || "Transaction not found."}
        </p>
      </section>
    );
  }

  const currency = wallet?.currency || "GHS";
  const ownerName =
    profile?.full_name?.trim() ||
    "No name provided";

  const ownerEmail =
    profile?.email?.trim() ||
    "No email available";

  return (
    <section className="p-6 lg:p-8">
      <Link
        href="/admin/transactions"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Transactions
      </Link>

      <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <CircleDollarSign className="h-7 w-7" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Transaction Details
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-950">
            Transaction Information
          </h1>

          <p className="mt-2 text-gray-600">
            Review the complete transaction, wallet and
            owner information.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-bold capitalize ${getTypeClasses(
              transaction.transaction_type
            )}`}
          >
            {transaction.transaction_type}
          </span>

          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-bold capitalize ${getStatusClasses(
              transaction.status
            )}`}
          >
            {transaction.status}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-col gap-5 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">
                Transaction Amount
              </p>

              <p
                className={`mt-2 text-4xl font-bold ${getAmountClasses(
                  transaction.transaction_type
                )}`}
              >
                {formatMoney(
                  transaction.amount,
                  currency
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={copyTransactionId}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <DetailItem
              label="Transaction ID"
              value={transaction.id}
              monospace
            />

            <DetailItem
              label="Wallet ID"
              value={transaction.wallet_id}
              monospace
            />

            <DetailItem
              label="Description"
              value={
                transaction.description ||
                "No description provided"
              }
            />

            <DetailItem
              label="Provider"
              value={
                transaction.provider || "Manual"
              }
            />

            <DetailItem
              label="Provider Reference"
              value={
                transaction.provider_reference ||
                "Not available"
              }
              monospace
            />

            <DetailItem
              label="Provider Transaction ID"
              value={
                transaction.provider_transaction_id ||
                "Not available"
              }
              monospace
            />

            <DetailItem
              label="Created"
              value={formatDate(
                transaction.created_at
              )}
            />

            <DetailItem
              label="Paid At"
              value={formatDate(
                transaction.paid_at
              )}
            />
          </div>
        </Card>

        <Card>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <UserRound className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-950">
            Wallet Owner
          </h2>

          <div className="mt-6 space-y-5">
            <DetailItem
              label="Name"
              value={ownerName}
            />

            <DetailItem
              label="Email"
              value={ownerEmail}
            />

            <DetailItem
              label="User ID"
              value={
                wallet?.user_id ||
                "Not available"
              }
              monospace
            />

            <DetailItem
              label="Profile Role"
              value={profile?.role || "user"}
            />

            <DetailItem
              label="Profile Status"
              value={
                profile?.status || "active"
              }
            />
          </div>

          {wallet && (
            <Link
              href={`/admin/wallets/${wallet.id}`}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <WalletCards className="h-4 w-4" />
              View Wallet
            </Link>
          )}
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-gray-500">
            Wallet Balance
          </p>

          <p className="mt-3 text-2xl font-bold text-green-800">
            {formatMoney(
              wallet?.balance ?? 0,
              currency
            )}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gray-500">
            Wallet Status
          </p>

          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
              wallet?.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {wallet?.status || "Unknown"}
          </span>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gray-500">
            Wallet Created
          </p>

          <p className="mt-3 font-semibold text-gray-950">
            {formatDate(
              wallet?.created_at ?? null
            )}
          </p>
        </Card>
      </div>

      <Card className="mt-8">
        <h2 className="text-xl font-bold text-gray-950">
          Transaction Timeline
        </h2>

        <div className="mt-6 space-y-6">
          <TimelineItem
            title="Transaction created"
            description={formatDate(
              transaction.created_at
            )}
          />

          {transaction.provider && (
            <TimelineItem
              title="Payment provider recorded"
              description={transaction.provider}
            />
          )}

          {transaction.paid_at && (
            <TimelineItem
              title="Payment confirmed"
              description={formatDate(
                transaction.paid_at
              )}
            />
          )}

          <TimelineItem
            title={`Transaction ${transaction.status}`}
            description={`Current status: ${transaction.status}`}
            isLast
          />
        </div>
      </Card>
    </section>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
  monospace?: boolean;
};

function DetailItem({
  label,
  value,
  monospace = false,
}: DetailItemProps) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-500">
        {label}
      </p>

      <p
        className={`mt-1 break-all font-semibold text-gray-950 ${
          monospace
            ? "font-mono text-sm"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type TimelineItemProps = {
  title: string;
  description: string;
  isLast?: boolean;
};

function TimelineItem({
  title,
  description,
  isLast = false,
}: TimelineItemProps) {
  return (
    <div className="relative flex gap-4">
      <div className="relative flex flex-col items-center">
        <div className="h-4 w-4 rounded-full bg-green-600 ring-4 ring-green-100" />

        {!isLast && (
          <div className="mt-2 h-full w-px bg-gray-200" />
        )}
      </div>

      <div className="pb-3">
        <p className="font-bold text-gray-950">
          {title}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}