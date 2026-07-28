"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CircleDollarSign,
  Layers3,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
};

type CircleRow = {
  id: string;
  name: string;
  created_at: string | null;
};

type WalletRow = {
  id: string;
  user_id: string;
  balance: number | string | null;
};

type TransactionRow = {
  id: string;
  wallet_id: string;
  amount: number | string | null;
  transaction_type: string;
  status: string;
  description: string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type DashboardStats = {
  users: number;
  circles: number;
  walletBalance: number;
  deposits: number;
  completedTransactions: number;
  pendingTransactions: number;
};

type TransactionView = TransactionRow & {
  userName: string;
  userEmail: string;
};

const INITIAL_STATS: DashboardStats = {
  users: 0,
  circles: 0,
  walletBalance: 0,
  deposits: 0,
  completedTransactions: 0,
  pendingTransactions: 0,
};

export default function AdminDashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats>(INITIAL_STATS);
  const [profiles, setProfiles] =
    useState<ProfileRow[]>([]);
  const [circles, setCircles] =
    useState<CircleRow[]>([]);
  const [wallets, setWallets] =
    useState<WalletRow[]>([]);
  const [transactions, setTransactions] =
    useState<TransactionRow[]>([]);
  const [notifications, setNotifications] =
    useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [
        profilesResult,
        circlesResult,
        walletsResult,
        transactionsResult,
        notificationsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, created_at")
          .order("created_at", { ascending: false }),

        supabase
          .from("circles")
          .select("id, name, created_at")
          .order("created_at", { ascending: false }),

        supabase
          .from("wallets")
          .select("id, user_id, balance"),

        supabase
          .from("wallet_transactions")
          .select(`
            id,
            wallet_id,
            amount,
            transaction_type,
            status,
            description,
            created_at
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("notifications")
          .select("id, title, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const firstError =
        profilesResult.error ||
        circlesResult.error ||
        walletsResult.error ||
        transactionsResult.error ||
        notificationsResult.error;

      if (firstError) {
        throw firstError;
      }

      const profileRows =
        (profilesResult.data as ProfileRow[] | null) ??
        [];
      const circleRows =
        (circlesResult.data as CircleRow[] | null) ??
        [];
      const walletRows =
        (walletsResult.data as WalletRow[] | null) ??
        [];
      const transactionRows =
        (transactionsResult.data as TransactionRow[] | null) ??
        [];
      const notificationRows =
        (notificationsResult.data as NotificationRow[] | null) ??
        [];

      const walletBalance = walletRows.reduce(
        (total, wallet) =>
          total + Number(wallet.balance ?? 0),
        0
      );

      const deposits = transactionRows
        .filter(
          (transaction) =>
            transaction.transaction_type === "deposit" &&
            transaction.status === "completed"
        )
        .reduce(
          (total, transaction) =>
            total +
            Math.abs(Number(transaction.amount ?? 0)),
          0
        );

      setProfiles(profileRows);
      setCircles(circleRows);
      setWallets(walletRows);
      setTransactions(transactionRows);
      setNotifications(notificationRows);

      setStats({
        users: profileRows.length,
        circles: circleRows.length,
        walletBalance,
        deposits,
        completedTransactions:
          transactionRows.filter(
            (transaction) =>
              transaction.status === "completed"
          ).length,
        pendingTransactions:
          transactionRows.filter(
            (transaction) =>
              transaction.status === "pending"
          ).length,
      });
    } catch (error) {
      console.error(
        "Unable to load admin dashboard:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const latestTransactions =
    useMemo<TransactionView[]>(() => {
      const walletToUser = new Map(
        wallets.map((wallet) => [
          wallet.id,
          wallet.user_id,
        ])
      );

      const profileMap = new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ])
      );

      return transactions
        .slice(0, 6)
        .map((transaction) => {
          const userId = walletToUser.get(
            transaction.wallet_id
          );
          const profile = userId
            ? profileMap.get(userId)
            : undefined;

          return {
            ...transaction,
            userName:
              profile?.full_name?.trim() ||
              profile?.email?.split("@")[0] ||
              "Unknown user",
            userEmail:
              profile?.email?.trim() ||
              "No email available",
          };
        });
    }, [profiles, transactions, wallets]);

  const latestUsers = useMemo(
    () => profiles.slice(0, 5),
    [profiles]
  );

  const latestCircles = useMemo(
    () => circles.slice(0, 5),
    [circles]
  );

  function formatMoney(amount: number) {
    return `GHS ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <section className="p-6 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Platform Overview
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-950">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Monitor the most important activity across ChainSave.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {message}
        </p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total Users"
          value={loading ? "..." : stats.users.toLocaleString()}
          description="Registered ChainSave members"
          icon={Users}
          iconClasses="bg-blue-100 text-blue-700"
          valueClasses="text-gray-950"
        />

        <MetricCard
          title="Total Deposits"
          value={loading ? "Loading..." : formatMoney(stats.deposits)}
          description="Completed wallet deposits"
          icon={CircleDollarSign}
          iconClasses="bg-green-100 text-green-700"
          valueClasses="text-green-700"
        />

        <MetricCard
          title="Savings Circles"
          value={loading ? "..." : stats.circles.toLocaleString()}
          description="Circles created on the platform"
          icon={Layers3}
          iconClasses="bg-purple-100 text-purple-700"
          valueClasses="text-purple-700"
        />

        <MetricCard
          title="Wallet Balance"
          value={loading ? "Loading..." : formatMoney(stats.walletBalance)}
          description="Combined balance across all wallets"
          icon={WalletCards}
          iconClasses="bg-emerald-100 text-emerald-700"
          valueClasses="text-emerald-700"
        />

        <MetricCard
          title="Completed Transactions"
          value={
            loading
              ? "..."
              : stats.completedTransactions.toLocaleString()
          }
          description="Successful financial records"
          icon={Activity}
          iconClasses="bg-indigo-100 text-indigo-700"
          valueClasses="text-indigo-700"
        />

        <MetricCard
          title="Pending Transactions"
          value={
            loading
              ? "..."
              : stats.pendingTransactions.toLocaleString()
          }
          description="Transactions awaiting completion"
          icon={ShieldCheck}
          iconClasses="bg-orange-100 text-orange-700"
          valueClasses="text-orange-700"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden p-0 xl:col-span-2">
          <SectionHeader
            title="Latest Transactions"
            description="Most recent financial activity"
            href="/admin/transactions"
          />

          {loading ? (
            <div className="p-8 text-gray-600">
              Loading transactions...
            </div>
          ) : latestTransactions.length === 0 ? (
            <EmptyState message="No transactions found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <TableHeader>User</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader align="right">
                      Amount
                    </TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Date</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {latestTransactions.map(
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
                              {transaction.userName}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {transaction.userEmail}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getTypeClasses(
                                transaction.transaction_type
                              )}`}
                            >
                              {transaction.transaction_type}
                            </span>
                          </td>

                          <td
                            className={`px-6 py-5 text-right font-bold ${getAmountClasses(
                              transaction.transaction_type
                            )}`}
                          >
                            {formatMoney(
                              transaction.transaction_type ===
                                "contribution" ||
                              transaction.transaction_type ===
                                "withdraw"
                                ? Math.abs(amount)
                                : amount
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                                transaction.status
                              )}`}
                            >
                              {transaction.status}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-gray-700">
                            {formatDate(
                              transaction.created_at
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden p-0">
          <SectionHeader
            title="Latest Users"
            description="Newest registered members"
            href="/admin/users"
          />

          {loading ? (
            <div className="p-8 text-gray-600">
              Loading users...
            </div>
          ) : latestUsers.length === 0 ? (
            <EmptyState message="No users found." />
          ) : (
            <div className="divide-y divide-gray-200">
              {latestUsers.map((profile) => (
                <div
                  key={profile.id}
                  className="px-6 py-5 transition hover:bg-gray-50"
                >
                  <p className="font-bold text-gray-950">
                    {profile.full_name?.trim() ||
                      profile.email?.split("@")[0] ||
                      "No name provided"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {profile.email || "No email available"}
                  </p>

                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Joined{" "}
                    {profile.created_at
                      ? formatDate(profile.created_at)
                      : "date unavailable"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="text-xl font-bold text-gray-950">
            Quick Actions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Jump directly to common admin tasks.
          </p>

          <div className="mt-6 grid gap-3">
            <QuickAction
              href="/admin/notifications/create"
              label="Create Notification"
              icon={Bell}
            />
            <QuickAction
              href="/admin/users"
              label="Manage Users"
              icon={Users}
            />
            <QuickAction
              href="/admin/transactions"
              label="View Transactions"
              icon={CircleDollarSign}
            />
            <QuickAction
              href="/admin/reports"
              label="Open Reports"
              icon={Activity}
            />
            <QuickAction
              href="/admin/settings"
              label="Platform Settings"
              icon={Settings}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-950">
            Latest Circles
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Recently created savings circles.
          </p>

          <div className="mt-6 divide-y divide-gray-200">
            {loading ? (
              <p className="py-4 text-gray-600">
                Loading circles...
              </p>
            ) : latestCircles.length === 0 ? (
              <p className="py-4 text-gray-500">
                No circles found.
              </p>
            ) : (
              latestCircles.map((circle) => (
                <div
                  key={circle.id}
                  className="py-4"
                >
                  <p className="font-bold text-gray-950">
                    {circle.name}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Created{" "}
                    {circle.created_at
                      ? formatDate(circle.created_at)
                      : "date unavailable"}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-950">
            Recent Notifications
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Latest platform communication records.
          </p>

          <div className="mt-6 divide-y divide-gray-200">
            {loading ? (
              <p className="py-4 text-gray-600">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="py-4 text-gray-500">
                No notifications found.
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="py-4"
                >
                  <p className="font-bold text-gray-950">
                    {notification.title}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                        notification.status
                      )}`}
                    >
                      {notification.status}
                    </span>

                    <span className="text-xs font-medium text-gray-500">
                      {formatDate(
                        notification.created_at
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  iconClasses: string;
  valueClasses: string;
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClasses,
  valueClasses,
}: MetricCardProps) {
  return (
    <Card className="transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-600">
            {title}
          </p>

          <h2
            className={`mt-3 break-words text-3xl font-bold ${valueClasses}`}
          >
            {value}
          </h2>

          <p className="mt-3 text-sm text-gray-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconClasses}`}
        >
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-5">
      <div>
        <h2 className="text-xl font-bold text-gray-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="text-sm font-semibold text-green-700 transition hover:text-green-800"
      >
        View all
      </Link>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 transition hover:border-green-300 hover:bg-green-50 hover:text-green-800"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icon className="h-5 w-5" />
      </div>
      {label}
    </Link>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="p-10 text-center text-gray-500">
      {message}
    </div>
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
    case "sent":
      return "bg-green-100 text-green-800";
    case "pending":
    case "scheduled":
      return "bg-yellow-100 text-yellow-800";
    case "draft":
      return "bg-purple-100 text-purple-800";
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}