"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarRange,
  CircleDollarSign,
  Download,
  Layers3,
  RefreshCw,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type WalletRow = {
  balance: number | string | null;
};

type TransactionRow = {
  id: string;
  wallet_id: string;
  amount: number | string | null;
  transaction_type: string;
  description: string | null;
  status: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  created_at: string | null;
};

type CircleRow = {
  id: string;
  created_at: string | null;
};

type ReportStats = {
  users: number;
  circles: number;
  walletBalance: number;
  completedTransactions: number;
  pendingTransactions: number;
  totalDeposits: number;
};

type ChartTransactionData = {
  period: string;
  deposits: number;
  withdrawals: number;
  contributions: number;
  payouts: number;
};

type GrowthData = {
  period: string;
  users: number;
  circles: number;
};

type BreakdownData = {
  name: string;
  value: number;
  fill: string;
};

type DateRangePreset =
  | "all_time"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_year"
  | "custom";

type DateBounds = {
  start: Date | null;
  end: Date | null;
};

type TimeBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

const INITIAL_STATS: ReportStats = {
  users: 0,
  circles: 0,
  walletBalance: 0,
  completedTransactions: 0,
  pendingTransactions: 0,
  totalDeposits: 0,
};

const RANGE_OPTIONS: Array<{
  value: DateRangePreset;
  label: string;
}> = [
  { value: "all_time", label: "All Time" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_90_days", label: "Last 90 Days" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export default function AdminReportsPage() {
  const [transactions, setTransactions] =
    useState<TransactionRow[]>([]);

  const [profiles, setProfiles] =
    useState<ProfileRow[]>([]);

  const [circles, setCircles] =
    useState<CircleRow[]>([]);

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [dateRange, setDateRange] =
    useState<DateRangePreset>("all_time");

  const [customStartDate, setCustomStartDate] =
    useState("");

  const [customEndDate, setCustomEndDate] =
    useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [
        profilesResult,
        circlesResult,
        walletsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, created_at"),

        supabase
          .from("circles")
          .select("id, created_at"),

        supabase
          .from("wallets")
          .select("balance"),

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
          .order("created_at", {
            ascending: false,
          }),
      ]);

      const firstError =
        profilesResult.error ||
        circlesResult.error ||
        walletsResult.error ||
        transactionsResult.error;

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
        (
          transactionsResult.data as
            | TransactionRow[]
            | null
        ) ?? [];

      const currentWalletBalance = walletRows.reduce(
        (total, wallet) =>
          total + Number(wallet.balance ?? 0),
        0
      );

      setProfiles(profileRows);
      setCircles(circleRows);
      setTransactions(transactionRows);
      setWalletBalance(currentWalletBalance);
    } catch (error) {
      console.error(
        "Unable to load reports:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load reports and analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const dateBounds = useMemo(
    () =>
      getDateBounds(
        dateRange,
        customStartDate,
        customEndDate
      ),
    [customEndDate, customStartDate, dateRange]
  );

  const customRangeError = useMemo(() => {
    if (dateRange !== "custom") {
      return "";
    }

    if (!customStartDate || !customEndDate) {
      return "Choose both a start date and an end date.";
    }

    const start = new Date(
      `${customStartDate}T00:00:00`
    );

    const end = new Date(
      `${customEndDate}T23:59:59.999`
    );

    if (start.getTime() > end.getTime()) {
      return "The start date must be before the end date.";
    }

    return "";
  }, [customEndDate, customStartDate, dateRange]);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        isDateWithinRange(
          transaction.created_at,
          dateBounds
        )
      ),
    [dateBounds, transactions]
  );

  const filteredProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.created_at &&
          isDateWithinRange(
            profile.created_at,
            dateBounds
          )
      ),
    [dateBounds, profiles]
  );

  const filteredCircles = useMemo(
    () =>
      circles.filter(
        (circle) =>
          circle.created_at &&
          isDateWithinRange(
            circle.created_at,
            dateBounds
          )
      ),
    [circles, dateBounds]
  );

  const stats = useMemo<ReportStats>(() => {
    const completedTransactions =
      filteredTransactions.filter(
        (transaction) =>
          transaction.status === "completed"
      ).length;

    const pendingTransactions =
      filteredTransactions.filter(
        (transaction) =>
          transaction.status === "pending"
      ).length;

    const totalDeposits = filteredTransactions
      .filter(
        (transaction) =>
          transaction.transaction_type ===
            "deposit" &&
          transaction.status === "completed"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            Number(transaction.amount ?? 0)
          ),
        0
      );

    return {
      users: filteredProfiles.length,
      circles: filteredCircles.length,
      walletBalance,
      completedTransactions,
      pendingTransactions,
      totalDeposits,
    };
  }, [
    filteredCircles.length,
    filteredProfiles.length,
    filteredTransactions,
    walletBalance,
  ]);

  const timeBuckets = useMemo(
    () =>
      createTimeBuckets(
        dateRange,
        dateBounds,
        filteredTransactions,
        filteredProfiles,
        filteredCircles
      ),
    [
      dateBounds,
      dateRange,
      filteredCircles,
      filteredProfiles,
      filteredTransactions,
    ]
  );

  const chartTransactions =
    useMemo<ChartTransactionData[]>(() => {
      return timeBuckets.map((bucket) => {
        const rows = filteredTransactions.filter(
          (transaction) =>
            isDateWithinRange(
              transaction.created_at,
              {
                start: bucket.start,
                end: bucket.end,
              }
            )
        );

        return {
          period: bucket.label,
          deposits: sumTransactions(
            rows,
            "deposit"
          ),
          withdrawals: sumTransactions(
            rows,
            "withdraw"
          ),
          contributions: sumTransactions(
            rows,
            "contribution"
          ),
          payouts: sumTransactions(
            rows,
            "payout"
          ),
        };
      });
    }, [filteredTransactions, timeBuckets]);

  const growthData = useMemo<GrowthData[]>(() => {
    return timeBuckets.map((bucket) => ({
      period: bucket.label,

      users: filteredProfiles.filter(
        (profile) =>
          profile.created_at &&
          isDateWithinRange(
            profile.created_at,
            {
              start: bucket.start,
              end: bucket.end,
            }
          )
      ).length,

      circles: filteredCircles.filter(
        (circle) =>
          circle.created_at &&
          isDateWithinRange(
            circle.created_at,
            {
              start: bucket.start,
              end: bucket.end,
            }
          )
      ).length,
    }));
  }, [
    filteredCircles,
    filteredProfiles,
    timeBuckets,
  ]);

  const transactionBreakdown =
    useMemo<BreakdownData[]>(() => {
      const types = [
        {
          type: "deposit",
          name: "Deposits",
          fill: "#16a34a",
        },
        {
          type: "withdraw",
          name: "Withdrawals",
          fill: "#dc2626",
        },
        {
          type: "contribution",
          name: "Contributions",
          fill: "#7e22ce",
        },
        {
          type: "payout",
          name: "Payouts",
          fill: "#ea580c",
        },
      ];

      return types.map((item) => ({
        name: item.name,

        value: filteredTransactions.filter(
          (transaction) =>
            transaction.transaction_type ===
            item.type
        ).length,

        fill: item.fill,
      }));
    }, [filteredTransactions]);

  const recentTransactions = useMemo(
    () => filteredTransactions.slice(0, 6),
    [filteredTransactions]
  );

  const rangeLabel = useMemo(
    () =>
      getRangeLabel(
        dateRange,
        customStartDate,
        customEndDate
      ),
    [customEndDate, customStartDate, dateRange]
  );

  function formatMoney(amount: number) {
    return `GHS ${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function exportCsv() {
    if (customRangeError) {
      setMessage(customRangeError);
      return;
    }

    setMessage("");

    if (filteredTransactions.length === 0) {
      setMessage(
        "There are no transactions to export for the selected date range."
      );
      return;
    }

    const headers = [
      "Transaction ID",
      "Wallet ID",
      "Type",
      "Amount",
      "Status",
      "Description",
      "Created At",
    ];

    const rows = filteredTransactions.map(
      (transaction) => [
        transaction.id,
        transaction.wallet_id,
        transaction.transaction_type,
        Number(
          transaction.amount ?? 0
        ).toFixed(2),
        transaction.status,
        transaction.description ?? "",
        new Date(
          transaction.created_at
        ).toISOString(),
      ]
    );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            escapeCsvValue(String(value))
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `chainsave-transactions-${getFileDateStamp()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <section className="p-6 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Analytics
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-950">
            Reports & Analytics
          </h1>

          <p className="mt-2 text-gray-600">
            Monitor platform performance and
            financial activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportCsv}
            disabled={
              loading ||
              filteredTransactions.length === 0 ||
              Boolean(customRangeError)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>

          <button
            type="button"
            onClick={loadAnalytics}
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
      </div>

      {message && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {message}
        </p>
      )}

      <Card className="mt-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-green-700" />

              <h2 className="text-lg font-bold text-gray-950">
                Reporting Period
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {rangeLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setDateRange(option.value);
                  setMessage("");
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  dateRange === option.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {dateRange === "custom" && (
          <div className="mt-6 grid gap-4 border-t border-gray-200 pt-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="report-start-date"
                className="text-sm font-semibold text-gray-700"
              >
                Start date
              </label>

              <input
                id="report-start-date"
                type="date"
                value={customStartDate}
                onChange={(event) => {
                  setCustomStartDate(
                    event.target.value
                  );
                  setMessage("");
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label
                htmlFor="report-end-date"
                className="text-sm font-semibold text-gray-700"
              >
                End date
              </label>

              <input
                id="report-end-date"
                type="date"
                value={customEndDate}
                onChange={(event) => {
                  setCustomEndDate(
                    event.target.value
                  );
                  setMessage("");
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {customRangeError && (
              <p className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {customRangeError}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold">
            {filteredTransactions.length} transaction
            {filteredTransactions.length === 1
              ? ""
              : "s"}
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold">
            {filteredProfiles.length} new user
            {filteredProfiles.length === 1
              ? ""
              : "s"}
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold">
            {filteredCircles.length} new circle
            {filteredCircles.length === 1
              ? ""
              : "s"}
          </span>
        </div>
      </Card>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total Deposits"
          value={
            loading
              ? "Loading..."
              : formatMoney(stats.totalDeposits)
          }
          description={`Completed deposits · ${rangeLabel}`}
          icon={CircleDollarSign}
          iconClasses="bg-green-100 text-green-700"
          valueClasses="text-green-700"
        />

        <MetricCard
          title="Registered Users"
          value={
            loading
              ? "..."
              : stats.users.toLocaleString()
          }
          description={`Profiles created · ${rangeLabel}`}
          icon={Users}
          iconClasses="bg-blue-100 text-blue-700"
          valueClasses="text-gray-950"
        />

        <MetricCard
          title="Savings Circles"
          value={
            loading
              ? "..."
              : stats.circles.toLocaleString()
          }
          description={`Circles created · ${rangeLabel}`}
          icon={Layers3}
          iconClasses="bg-purple-100 text-purple-700"
          valueClasses="text-purple-700"
        />

        <MetricCard
          title="Wallet Balance"
          value={
            loading
              ? "Loading..."
              : formatMoney(stats.walletBalance)
          }
          description="Current combined balance (not date filtered)"
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
          description={`Completed records · ${rangeLabel}`}
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
          description={`Pending records · ${rangeLabel}`}
          icon={Activity}
          iconClasses="bg-orange-100 text-orange-700"
          valueClasses="text-orange-700"
        />
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <Card
                key={index}
                className="animate-pulse"
              >
                <div className="h-6 w-48 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-64 rounded bg-gray-200" />
                <div className="mt-8 h-72 rounded-xl bg-gray-100" />
              </Card>
            )
          )}
        </div>
      ) : customRangeError ? (
        <Card className="mt-8">
          <EmptyChart message={customRangeError} />
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <ChartCard
              title="Transaction Flow"
              description={`Financial activity · ${rangeLabel}`}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={chartTransactions}
                  margin={{
                    top: 15,
                    right: 15,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />

                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="deposits"
                    name="Deposits"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="withdrawals"
                    name="Withdrawals"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="contributions"
                    name="Contributions"
                    stroke="#7e22ce"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="payouts"
                    name="Payouts"
                    stroke="#ea580c"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Transaction Breakdown"
              description={`Records by transaction type · ${rangeLabel}`}
            >
              {transactionBreakdown.every(
                (item) => item.value === 0
              ) ? (
                <EmptyChart message="No transaction data is available for this date range." />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={transactionBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={4}
                    />

                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="User & Circle Growth"
              description={`New profiles and circles · ${rangeLabel}`}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={growthData}
                  margin={{
                    top: 15,
                    right: 15,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip />
                  <Legend />

                  <Bar
                    dataKey="users"
                    name="New Users"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="circles"
                    name="New Circles"
                    fill="#7e22ce"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Deposit Trend"
              description={`Completed deposits · ${rangeLabel}`}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={chartTransactions}
                  margin={{
                    top: 15,
                    right: 15,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="deposits"
                    name="Deposits"
                    stroke="#16a34a"
                    fill="#dcfce7"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <Card className="mt-8 overflow-hidden p-0">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Recent Financial Activity
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Latest wallet transactions · {rangeLabel}
                </p>
              </div>

              <p className="text-sm font-semibold text-gray-600">
                Showing {recentTransactions.length} of{" "}
                {filteredTransactions.length}
              </p>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                No transactions were found for the selected date range.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentTransactions.map(
                  (transaction) => {
                    const amount = Number(
                      transaction.amount ?? 0
                    );

                    return (
                      <div
                        key={transaction.id}
                        className="flex flex-col gap-4 px-6 py-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-bold capitalize text-gray-950">
                              {
                                transaction.transaction_type
                              }
                            </p>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                                transaction.status
                              )}`}
                            >
                              {transaction.status}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-sm text-gray-600">
                            {transaction.description ||
                              "Wallet transaction"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(
                              transaction.created_at
                            )}
                          </p>
                        </div>

                        <p
                          className={`text-lg font-bold ${getAmountClasses(
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
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </Card>
        </>
      )}
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

type ChartCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function ChartCard({
  title,
  description,
  children,
}: ChartCardProps) {
  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-950">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>

      <div className="mt-6 h-80 w-full">
        {children}
      </div>
    </Card>
  );
}

function EmptyChart({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-6 text-center text-gray-500">
      {message}
    </div>
  );
}

function getDateBounds(
  preset: DateRangePreset,
  customStartDate: string,
  customEndDate: string
): DateBounds {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (preset === "all_time") {
    return {
      start: null,
      end: null,
    };
  }

  if (preset === "custom") {
    if (!customStartDate || !customEndDate) {
      return {
        start: null,
        end: null,
      };
    }

    return {
      start: new Date(
        `${customStartDate}T00:00:00`
      ),
      end: new Date(
        `${customEndDate}T23:59:59.999`
      ),
    };
  }

  if (preset === "this_year") {
    return {
      start: new Date(
        now.getFullYear(),
        0,
        1,
        0,
        0,
        0,
        0
      ),
      end: endOfToday,
    };
  }

  const days =
    preset === "last_7_days"
      ? 7
      : preset === "last_30_days"
        ? 30
        : 90;

  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return {
    start,
    end: endOfToday,
  };
}

function isDateWithinRange(
  dateValue: string,
  bounds: DateBounds
) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (
    bounds.start &&
    date.getTime() < bounds.start.getTime()
  ) {
    return false;
  }

  if (
    bounds.end &&
    date.getTime() > bounds.end.getTime()
  ) {
    return false;
  }

  return true;
}

function createTimeBuckets(
  preset: DateRangePreset,
  bounds: DateBounds,
  transactions: TransactionRow[],
  profiles: ProfileRow[],
  circles: CircleRow[]
): TimeBucket[] {
  const fallbackEnd = new Date();
  fallbackEnd.setHours(23, 59, 59, 999);

  const allDates = [
    ...transactions.map(
      (transaction) =>
        new Date(transaction.created_at)
    ),
    ...profiles
      .filter((profile) => profile.created_at)
      .map(
        (profile) =>
          new Date(profile.created_at as string)
      ),
    ...circles
      .filter((circle) => circle.created_at)
      .map(
        (circle) =>
          new Date(circle.created_at as string)
      ),
  ].filter(
    (date) => !Number.isNaN(date.getTime())
  );

  const earliestDate =
    allDates.length > 0
      ? new Date(
          Math.min(
            ...allDates.map((date) =>
              date.getTime()
            )
          )
        )
      : new Date(
          fallbackEnd.getFullYear(),
          fallbackEnd.getMonth() - 5,
          1
        );

  const start =
    bounds.start ??
    new Date(
      earliestDate.getFullYear(),
      earliestDate.getMonth(),
      1
    );

  const end = bounds.end ?? fallbackEnd;

  const totalDays = Math.max(
    1,
    Math.ceil(
      (end.getTime() - start.getTime()) /
        86_400_000
    ) + 1
  );

  if (
    preset === "last_7_days" ||
    (preset === "custom" && totalDays <= 14)
  ) {
    return createDailyBuckets(start, end);
  }

  if (
    preset === "last_30_days" ||
    (preset === "custom" && totalDays <= 45)
  ) {
    return createWeeklyBuckets(start, end);
  }

  return createMonthlyBuckets(start, end);
}

function createDailyBuckets(
  start: Date,
  end: Date
) {
  const buckets: TimeBucket[] = [];
  const cursor = new Date(start);

  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= end.getTime()) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);

    bucketEnd.setHours(23, 59, 59, 999);

    buckets.push({
      key: bucketStart.toISOString(),
      label: bucketStart.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      ),
      start: bucketStart,
      end: bucketEnd,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

function createWeeklyBuckets(
  start: Date,
  end: Date
) {
  const buckets: TimeBucket[] = [];
  const cursor = new Date(start);

  cursor.setHours(0, 0, 0, 0);

  let weekNumber = 1;

  while (cursor.getTime() <= end.getTime()) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);

    bucketEnd.setDate(
      bucketEnd.getDate() + 6
    );
    bucketEnd.setHours(23, 59, 59, 999);

    if (bucketEnd.getTime() > end.getTime()) {
      bucketEnd.setTime(end.getTime());
    }

    buckets.push({
      key: bucketStart.toISOString(),
      label: `Week ${weekNumber}`,
      start: bucketStart,
      end: bucketEnd,
    });

    cursor.setDate(cursor.getDate() + 7);
    weekNumber += 1;
  }

  return buckets;
}

function createMonthlyBuckets(
  start: Date,
  end: Date
) {
  const buckets: TimeBucket[] = [];

  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    1
  );

  while (cursor.getTime() <= end.getTime()) {
    const bucketStart = new Date(cursor);

    const bucketEnd = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    if (bucketEnd.getTime() > end.getTime()) {
      bucketEnd.setTime(end.getTime());
    }

    buckets.push({
      key: `${bucketStart.getFullYear()}-${bucketStart.getMonth()}`,
      label: bucketStart.toLocaleDateString(
        "en-US",
        {
          month: "short",
          year:
            start.getFullYear() !== end.getFullYear()
              ? "numeric"
              : undefined,
        }
      ),
      start: bucketStart,
      end: bucketEnd,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
}

function getRangeLabel(
  preset: DateRangePreset,
  customStartDate: string,
  customEndDate: string
) {
  const selectedOption = RANGE_OPTIONS.find(
    (option) => option.value === preset
  );

  if (preset !== "custom") {
    return selectedOption?.label ?? "All Time";
  }

  if (!customStartDate || !customEndDate) {
    return "Choose a custom date range";
  }

  return `${formatShortDate(
    customStartDate
  )} – ${formatShortDate(customEndDate)}`;
}

function formatShortDate(date: string) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sumTransactions(
  transactions: TransactionRow[],
  type: string
) {
  return transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === type &&
        transaction.status === "completed"
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

function formatDate(date: string) {
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

function escapeCsvValue(value: string) {
  const escaped = value.replace(
    /"/g,
    '""'
  );

  return `"${escaped}"`;
}

function getFileDateStamp() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
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