"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Fuel,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import Card from "@/components/ui/Card";
import RecentActivity from "@/components/admin/RecentActivity";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: string;
  created_at: string | null;
};

type CircleRow = {
  id: string;
  name: string;
  status: string | null;
  contract_address: string | null;
  creation_tx_hash: string | null;
  blockchain_status: string | null;
  blockchain_network: string | null;
  created_at: string | null;
};

type WalletRow = {
  id: string;
  user_id: string;
  balance: number | string | null;
  status: string | null;
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

type PayoutRow = {
  id: string;
  status: string;
  amount: number | string | null;
  created_at: string | null;
};

type FinanceSummary = {
  todayRevenue: number;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  availableRevenue: number;
  gasWallet: {
    localBalance: number;
    rbtcBalance: number;
  };
  pendingWithdrawals: number;
};

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  totalCircles: number;
  activeCircles: number;
  walletBalance: number;
  frozenWallets: number;
  todayContributions: number;
  todayWithdrawals: number;
  pendingTransactions: number;
  pendingPayouts: number;
  verifiedContracts: number;
  failedDeployments: number;
};

const INITIAL_STATS: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalCircles: 0,
  activeCircles: 0,
  walletBalance: 0,
  frozenWallets: 0,
  todayContributions: 0,
  todayWithdrawals: 0,
  pendingTransactions: 0,
  pendingPayouts: 0,
  verifiedContracts: 0,
  failedDeployments: 0,
};

const ROOTSTOCK_EXPLORER =
  process.env.NEXT_PUBLIC_ROOTSTOCK_EXPLORER_URL ??
  "https://explorer.testnet.rootstock.io";

export default function AdminDashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats>(INITIAL_STATS);

  const [finance, setFinance] =
    useState<FinanceSummary | null>(null);

  const [latestUsers, setLatestUsers] =
    useState<ProfileRow[]>([]);

  const [latestCircles, setLatestCircles] =
    useState<CircleRow[]>([]);

  const [latestTransactions, setLatestTransactions] =
    useState<TransactionRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const [
        profilesResult,
        circlesResult,
        walletsResult,
        transactionsResult,
        payoutsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, status, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("circles")
          .select(
            `
              id,
              name,
              status,
              contract_address,
              creation_tx_hash,
              blockchain_status,
              blockchain_network,
              created_at
            `
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("wallets")
          .select("id, user_id, balance, status"),

        supabase
          .from("wallet_transactions")
          .select(
            `
              id,
              wallet_id,
              amount,
              transaction_type,
              status,
              description,
              created_at
            `
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("circle_payouts")
          .select("id, status, amount, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const requiredError =
        profilesResult.error ||
        circlesResult.error ||
        walletsResult.error ||
        transactionsResult.error;

      if (requiredError) {
        throw requiredError;
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

      const payoutRows =
        payoutsResult.error
          ? []
          : ((payoutsResult.data as PayoutRow[] | null) ?? []);

      if (payoutsResult.error) {
        console.warn(
          "Payout summary is unavailable:",
          payoutsResult.error
        );
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const isToday = (date: string | null) =>
        Boolean(
          date &&
            new Date(date).getTime() >=
              startOfToday.getTime()
        );

      const walletBalance = walletRows.reduce(
        (total, wallet) =>
          total + Number(wallet.balance ?? 0),
        0
      );

      const todayContributions = transactionRows
        .filter(
          (transaction) =>
            transaction.transaction_type ===
              "contribution" &&
            transaction.status === "completed" &&
            isToday(transaction.created_at)
        )
        .reduce(
          (total, transaction) =>
            total +
            Math.abs(Number(transaction.amount ?? 0)),
          0
        );

      const todayWithdrawals = transactionRows
        .filter(
          (transaction) =>
            transaction.transaction_type ===
              "withdraw" &&
            transaction.status === "completed" &&
            isToday(transaction.created_at)
        )
        .reduce(
          (total, transaction) =>
            total +
            Math.abs(Number(transaction.amount ?? 0)),
          0
        );

      setStats({
        totalUsers: profileRows.length,
        activeUsers: profileRows.filter(
          (profile) => profile.status === "active"
        ).length,
        totalCircles: circleRows.length,
        activeCircles: circleRows.filter(
          (circle) => circle.status === "active"
        ).length,
        walletBalance,
        frozenWallets: walletRows.filter(
          (wallet) => wallet.status === "frozen"
        ).length,
        todayContributions,
        todayWithdrawals,
        pendingTransactions: transactionRows.filter(
          (transaction) =>
            transaction.status === "pending"
        ).length,
        pendingPayouts: payoutRows.filter(
          (payout) =>
            payout.status === "pending" ||
            payout.status === "queued" ||
            payout.status === "scheduled"
        ).length,
        verifiedContracts: circleRows.filter(
          (circle) =>
            circle.blockchain_status === "confirmed" &&
            Boolean(circle.contract_address)
        ).length,
        failedDeployments: circleRows.filter(
          (circle) =>
            circle.blockchain_status === "failed"
        ).length,
      });

      setLatestUsers(profileRows.slice(0, 5));
      setLatestCircles(circleRows.slice(0, 5));
      setLatestTransactions(transactionRows.slice(0, 6));

      if (session?.access_token) {
        const response = await fetch(
          "/api/admin/finance/summary",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
            cache: "no-store",
          }
        );

        if (response.ok) {
          const result = await response.json();

          setFinance({
            todayRevenue: Number(
              result.todayRevenue ?? 0
            ),
            monthlyRevenue: Number(
              result.monthlyRevenue ?? 0
            ),
            lifetimeRevenue: Number(
              result.lifetimeRevenue ?? 0
            ),
            availableRevenue: Number(
              result.availableRevenue ?? 0
            ),
            gasWallet: {
              localBalance: Number(
                result.gasWallet?.localBalance ?? 0
              ),
              rbtcBalance: Number(
                result.gasWallet?.rbtcBalance ?? 0
              ),
            },
            pendingWithdrawals: Number(
              result.pendingWithdrawals ?? 0
            ),
          });
        } else {
          console.warn(
            "Finance summary could not be loaded."
          );
        }
      }
    } catch (error) {
      console.error(
        "Unable to load super admin dashboard:",
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
    void loadDashboard();
  }, [loadDashboard]);

  const systemHealth = useMemo(() => {
    if (
      stats.failedDeployments > 0 ||
      stats.pendingTransactions > 10
    ) {
      return {
        label: "Needs attention",
        description:
          "Review failed deployments or pending transactions.",
        classes:
          "border-orange-200 bg-orange-50 text-orange-800",
        icon: AlertTriangle,
      };
    }

    return {
      label: "Healthy",
      description:
        "Core financial and Rootstock services are operating normally.",
      classes:
        "border-green-200 bg-green-50 text-green-800",
      icon: CheckCircle2,
    };
  }, [
    stats.failedDeployments,
    stats.pendingTransactions,
  ]);

  const globalResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const users = latestUsers
      .filter((user) =>
        [
          user.full_name ?? "",
          user.email ?? "",
          user.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .map((user) => ({
        id: user.id,
        label:
          user.full_name ||
          user.email ||
          "Unnamed user",
        description: user.email || user.id,
        href: "/admin/users",
        type: "User",
      }));

    const circles = latestCircles
      .filter((circle) =>
        [
          circle.name,
          circle.id,
          circle.contract_address ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .map((circle) => ({
        id: circle.id,
        label: circle.name,
        description:
          circle.contract_address ||
          circle.blockchain_status ||
          circle.id,
        href: circle.contract_address
          ? `${ROOTSTOCK_EXPLORER}/address/${circle.contract_address}`
          : "/admin",
        type: "Circle",
        external: Boolean(circle.contract_address),
      }));

    const transactions = latestTransactions
      .filter((transaction) =>
        [
          transaction.id,
          transaction.wallet_id,
          transaction.transaction_type,
          transaction.status,
          transaction.description ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .map((transaction) => ({
        id: transaction.id,
        label: formatLabel(
          transaction.transaction_type
        ),
        description:
          transaction.description ||
          transaction.id,
        href: `/admin/transactions/${transaction.id}`,
        type: "Transaction",
      }));

    return [...users, ...circles, ...transactions].slice(
      0,
      8
    );
  }, [
    latestCircles,
    latestTransactions,
    latestUsers,
    search,
  ]);

  const HealthIcon = systemHealth.icon;

  return (
    <section className="px-4 py-6 sm:px-6 lg:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Executive Overview
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-4xl">
            Super Admin Dashboard
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Monitor users, circles, wallets, revenue,
            payouts and Rootstock operations from one
            command center.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-medium text-red-700">
          {message}
        </div>
      )}

      <div className="relative mt-7">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search recent users, circles, contracts or transactions..."
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-gray-950 shadow-sm outline-none placeholder:text-gray-400 focus:border-green-600"
        />

        {search.trim() && (
          <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            {globalResults.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">
                No recent records match this search.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {globalResults.map((result) =>
                  "external" in result &&
                  result.external ? (
                    <a
                      key={`${result.type}-${result.id}`}
                      href={result.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
                    >
                      <ResultContent result={result} />
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </a>
                  ) : (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.href}
                      className="block px-5 py-4 transition hover:bg-gray-50"
                    >
                      <ResultContent result={result} />
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={
            loading
              ? "..."
              : stats.totalUsers.toLocaleString()
          }
          subtitle={`${stats.activeUsers} active`}
          icon={Users}
          iconClasses="bg-blue-100 text-blue-700"
        />

        <MetricCard
          title="Active Circles"
          value={
            loading
              ? "..."
              : stats.activeCircles.toLocaleString()
          }
          subtitle={`${stats.totalCircles} total circles`}
          icon={Layers3}
          iconClasses="bg-purple-100 text-purple-700"
        />

        <MetricCard
          title="Wallet Balance"
          value={
            loading
              ? "Loading..."
              : formatMoney(stats.walletBalance)
          }
          subtitle={`${stats.frozenWallets} frozen wallets`}
          icon={WalletCards}
          iconClasses="bg-emerald-100 text-emerald-700"
        />

        <MetricCard
          title="Today's Revenue"
          value={
            loading && !finance
              ? "Loading..."
              : formatMoney(
                  finance?.todayRevenue ?? 0
                )
          }
          subtitle={`${formatMoney(
            finance?.monthlyRevenue ?? 0
          )} this month`}
          icon={TrendingUp}
          iconClasses="bg-green-100 text-green-700"
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Today's Contributions"
          value={formatMoney(
            stats.todayContributions
          )}
          subtitle="Completed today"
          icon={CircleDollarSign}
          iconClasses="bg-indigo-100 text-indigo-700"
        />

        <MetricCard
          title="Today's Withdrawals"
          value={formatMoney(
            stats.todayWithdrawals
          )}
          subtitle="Completed today"
          icon={Activity}
          iconClasses="bg-red-100 text-red-700"
        />

        <MetricCard
          title="Pending Payouts"
          value={stats.pendingPayouts.toLocaleString()}
          subtitle={`${stats.pendingTransactions} pending wallet transactions`}
          icon={Bell}
          iconClasses="bg-orange-100 text-orange-700"
        />

        <MetricCard
          title="Rootstock Contracts"
          value={stats.verifiedContracts.toLocaleString()}
          subtitle={`${stats.failedDeployments} failed deployments`}
          icon={ShieldCheck}
          iconClasses="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
                System Status
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-950">
                Operations Health
              </h2>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${systemHealth.classes}`}
            >
              <HealthIcon className="h-4 w-4" />
              {systemHealth.label}
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-600">
            {systemHealth.description}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <HealthRow
              label="Platform revenue available"
              value={formatMoney(
                finance?.availableRevenue ?? 0
              )}
            />

            <HealthRow
              label="Gas wallet local balance"
              value={formatMoney(
                finance?.gasWallet.localBalance ?? 0
              )}
            />

            <HealthRow
              label="Gas wallet RBTC"
              value={`${(
                finance?.gasWallet.rbtcBalance ?? 0
              ).toFixed(8)} RBTC`}
            />

            <HealthRow
              label="Pending revenue withdrawals"
              value={String(
                finance?.pendingWithdrawals ?? 0
              )}
            />
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
            Quick Actions
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-950">
            Admin Shortcuts
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <QuickAction
              href="/admin/users"
              label="Manage Users"
              icon={Users}
            />

            <QuickAction
              href="/admin/wallets"
              label="Manage Wallets"
              icon={WalletCards}
            />

            <QuickAction
              href="/admin/finance"
              label="Open Finance"
              icon={CircleDollarSign}
            />

            <QuickAction
              href="/admin/reports"
              label="View Reports"
              icon={TrendingUp}
            />

            <QuickAction
              href="/admin/notifications/create"
              label="Send Notification"
              icon={Bell}
            />

            <QuickAction
              href="/admin/audit-logs"
              label="Audit Logs"
              icon={ShieldCheck}
            />
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <SectionHeader
            title="Latest Users"
            description="Newest ChainSave accounts"
            href="/admin/users"
          />

          {loading ? (
            <LoadingRows />
          ) : latestUsers.length === 0 ? (
            <EmptyState text="No users found." />
          ) : (
            <div className="divide-y divide-gray-100">
              {latestUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-950">
                      {user.full_name ||
                        user.email ||
                        "Unnamed user"}
                    </p>

                    <p className="mt-1 truncate text-sm text-gray-500">
                      {user.email || user.id}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden p-0">
          <SectionHeader
            title="Latest Rootstock Circles"
            description="Recent smart-contract deployments"
            href="/admin"
          />

          {loading ? (
            <LoadingRows />
          ) : latestCircles.length === 0 ? (
            <EmptyState text="No circles found." />
          ) : (
            <div className="divide-y divide-gray-100">
              {latestCircles.map((circle) => (
                <div
                  key={circle.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-950">
                      {circle.name}
                    </p>

                    <p className="mt-1 truncate font-mono text-xs text-gray-500">
                      {circle.contract_address ||
                        "Contract pending"}
                    </p>
                  </div>

                  {circle.contract_address ? (
                    <a
                      href={`${ROOTSTOCK_EXPLORER}/address/${circle.contract_address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800"
                    >
                      Explorer
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <RecentActivity />
    </section>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClasses,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  iconClasses: string;
}) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-600">
            {title}
          </p>

          <p className="mt-3 break-words text-2xl font-bold text-gray-950 sm:text-3xl">
            {value}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClasses}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function HealthRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words font-bold text-gray-950">
        {value}
      </p>
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
      className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-800 transition hover:border-green-300 hover:bg-green-50 hover:text-green-800"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icon className="h-5 w-5" />
      </div>

      <span>{label}</span>
    </Link>
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
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-6">
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
        className="shrink-0 text-sm font-semibold text-green-700 hover:text-green-800"
      >
        View all
      </Link>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-gray-100"
        />
      ))}
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <p className="px-6 py-10 text-center text-gray-500">
      {text}
    </p>
  );
}

function ResultContent({
  result,
}: {
  result: {
    label: string;
    description: string;
    type: string;
  };
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
          {result.type}
        </span>

        <p className="truncate font-bold text-gray-950">
          {result.label}
        </p>
      </div>

      <p className="mt-1 truncate text-sm text-gray-500">
        {result.description}
      </p>
    </div>
  );
}

function formatMoney(amount: number) {
  return `GHS ${Number(amount || 0).toLocaleString(
    "en-GH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}
