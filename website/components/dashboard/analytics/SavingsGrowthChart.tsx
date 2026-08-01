"use client";

import {
  AlertCircle,
  Loader2,
  PiggyBank,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type MembershipRow = {
  id: string;
};

type ContributionRow = {
  id: string;
  member_id: string;
  amount: number | string | null;
  currency: string | null;
  status: string;
  paid_at: string | null;
};

type ChartPoint = {
  monthKey: string;
  month: string;
  monthlyAmount: number;
  total: number;
};

type TooltipPayload = {
  value?: number | string;
  payload?: ChartPoint;
};

type SavingsTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  currency: string;
};

const MONTH_COUNT = 12;

export default function SavingsGrowthChart() {
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [currency, setCurrency] = useState("GHS");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const loadSavingsGrowth = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        const {
          data: membershipsData,
          error: membershipsError,
        } = await supabase
          .from("circle_members")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("status", "accepted");

        if (membershipsError) {
          throw membershipsError;
        }

        const memberships =
          (membershipsData ?? []) as MembershipRow[];

        if (memberships.length === 0) {
          setPoints(createEmptyChartPoints());
          setCurrency("GHS");
          return;
        }

        const memberIds = memberships.map(
          (membership) => membership.id
        );

        const startDate = getChartStartDate();

        const {
          data: contributionsData,
          error: contributionsError,
        } = await supabase
          .from("contributions")
          .select(`
            id,
            member_id,
            amount,
            currency,
            status,
            paid_at
          `)
          .in("member_id", memberIds)
          .eq("status", "completed")
          .gte("paid_at", startDate.toISOString())
          .order("paid_at", {
            ascending: true,
          });

        if (contributionsError) {
          throw contributionsError;
        }

        const contributions =
          (contributionsData ?? []) as ContributionRow[];

        const detectedCurrency =
          contributions.find(
            (contribution) =>
              contribution.currency?.trim()
          )?.currency?.toUpperCase() || "GHS";

        setCurrency(detectedCurrency);
        setPoints(
          buildSavingsGrowthPoints(contributions)
        );
      } catch (error) {
        console.error(
          "Unable to load savings growth:",
          error
        );

        setPoints([]);
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load savings growth."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadSavingsGrowth();
  }, [loadSavingsGrowth]);

  const totalSaved = useMemo(
    () =>
      points.length > 0
        ? points[points.length - 1].total
        : 0,
    [points]
  );

  const currentMonthAmount = useMemo(
    () =>
      points.length > 0
        ? points[points.length - 1].monthlyAmount
        : 0,
    [points]
  );

  const previousMonthAmount = useMemo(
    () =>
      points.length > 1
        ? points[points.length - 2].monthlyAmount
        : 0,
    [points]
  );

  const monthlyChange = useMemo(() => {
    if (previousMonthAmount <= 0) {
      return currentMonthAmount > 0 ? 100 : 0;
    }

    return (
      ((currentMonthAmount - previousMonthAmount) /
        previousMonthAmount) *
      100
    );
  }, [currentMonthAmount, previousMonthAmount]);

  const hasSavings = totalSaved > 0;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-green-100 p-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-950">
                Savings Growth
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your cumulative completed contributions over the
                last 12 months.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadSavingsGrowth(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh
        </button>
      </div>

      {message && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <SavingsGrowthSkeleton />
      ) : points.length === 0 ? (
        <SavingsGrowthEmptyState />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <SummaryMetric
              label="Total saved"
              value={formatMoney(totalSaved, currency)}
            />

            <SummaryMetric
              label="This month"
              value={formatMoney(
                currentMonthAmount,
                currency
              )}
            />

            <SummaryMetric
              label="Monthly change"
              value={`${monthlyChange >= 0 ? "+" : ""}${monthlyChange.toFixed(
                1
              )}%`}
              valueClassName={
                monthlyChange >= 0
                  ? "text-green-700"
                  : "text-red-700"
              }
            />
          </div>

          {hasSavings ? (
            <div className="mt-7 h-[320px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={points}
                  margin={{
                    top: 10,
                    right: 8,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="savingsGrowthFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#16a34a"
                        stopOpacity={0.25}
                      />

                      <stop
                        offset="95%"
                        stopColor="#16a34a"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                    minTickGap={20}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tick={{
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                    tickFormatter={(value: number) =>
                      formatCompactMoney(value, currency)
                    }
                  />

                  <Tooltip
                    cursor={{
                      stroke: "#16a34a",
                      strokeDasharray: "4 4",
                    }}
                    content={
                      <SavingsTooltip currency={currency} />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#16a34a"
                    strokeWidth={3}
                    fill="url(#savingsGrowthFill)"
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      fill: "#ffffff",
                      stroke: "#16a34a",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SavingsGrowthEmptyState />
          )}
        </>
      )}
    </Card>
  );
}

function SummaryMetric({
  label,
  value,
  valueClassName = "text-gray-950",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function SavingsTooltip({
  active,
  payload,
  label,
  currency,
}: SavingsTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-bold text-gray-900">
        {label}
      </p>

      <p className="mt-2 text-sm text-gray-600">
        Total:{" "}
        <span className="font-bold text-green-700">
          {formatMoney(point.total, currency)}
        </span>
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Added this month:{" "}
        {formatMoney(point.monthlyAmount, currency)}
      </p>
    </div>
  );
}

function SavingsGrowthSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 rounded-2xl bg-gray-100"
          />
        ))}
      </div>

      <div className="mt-7 h-[320px] rounded-2xl bg-gray-100" />
    </div>
  );
}

function SavingsGrowthEmptyState() {
  return (
    <div className="mt-7 rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
        <PiggyBank className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-bold text-gray-950">
        No savings history yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Completed circle contributions will build your savings
        growth chart automatically.
      </p>
    </div>
  );
}

function buildSavingsGrowthPoints(
  contributions: ContributionRow[]
): ChartPoint[] {
  const baseMonths = createEmptyChartPoints();
  const monthlyTotals = new Map<string, number>();

  contributions.forEach((contribution) => {
    if (!contribution.paid_at) {
      return;
    }

    const date = new Date(contribution.paid_at);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const monthKey = createMonthKey(date);
    const amount = Number(contribution.amount ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    monthlyTotals.set(
      monthKey,
      (monthlyTotals.get(monthKey) ?? 0) + amount
    );
  });

  let runningTotal = 0;

  return baseMonths.map((point) => {
    const monthlyAmount =
      monthlyTotals.get(point.monthKey) ?? 0;

    runningTotal += monthlyAmount;

    return {
      ...point,
      monthlyAmount,
      total: runningTotal,
    };
  });
}

function createEmptyChartPoints(): ChartPoint[] {
  const currentDate = new Date();
  const points: ChartPoint[] = [];

  for (
    let monthOffset = MONTH_COUNT - 1;
    monthOffset >= 0;
    monthOffset -= 1
  ) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - monthOffset,
      1
    );

    points.push({
      monthKey: createMonthKey(date),
      month: date.toLocaleDateString("en-US", {
        month: "short",
      }),
      monthlyAmount: 0,
      total: 0,
    });
  }

  return points;
}

function getChartStartDate() {
  const currentDate = new Date();

  return new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - (MONTH_COUNT - 1),
    1
  );
}

function createMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatMoney(
  amount: number,
  currency: string
) {
  return `${currency} ${Number(amount).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatCompactMoney(
  amount: number,
  currency: string
) {
  const formatted = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount));

  return `${currency} ${formatted}`;
}