"use client";

import {
  AlertCircle,
  BarChart3,
  Loader2,
  PiggyBank,
  RefreshCw,
  Trophy,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  fullMonth: string;
  amount: number;
};

type TooltipPayload = {
  value?: number | string;
  payload?: ChartPoint;
};

type MonthlyTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  currency: string;
};

const MONTH_COUNT = 12;

export default function MonthlyContributionsChart() {
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [currency, setCurrency] = useState("GHS");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMonthlyContributions = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

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
          buildMonthlyContributionPoints(contributions)
        );
      } catch (error) {
        console.error(
          "Unable to load monthly contributions:",
          error
        );

        setPoints([]);
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load monthly contributions."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadMonthlyContributions();
  }, [loadMonthlyContributions]);

  const totalContributed = useMemo(
    () =>
      points.reduce(
        (sum, point) => sum + point.amount,
        0
      ),
    [points]
  );

  const monthlyAverage = useMemo(
    () =>
      points.length > 0
        ? totalContributed / points.length
        : 0,
    [points, totalContributed]
  );

  const highestMonth = useMemo(
    () =>
      points.reduce<ChartPoint | null>(
        (highest, point) =>
          highest === null ||
          point.amount > highest.amount
            ? point
            : highest,
        null
      ),
    [points]
  );

  const lowestActiveMonth = useMemo(
    () =>
      points
        .filter((point) => point.amount > 0)
        .reduce<ChartPoint | null>(
          (lowest, point) =>
            lowest === null ||
            point.amount < lowest.amount
              ? point
              : lowest,
          null
        ),
    [points]
  );

  const currentMonth = points.at(-1) ?? null;
  const previousMonth = points.at(-2) ?? null;

  const monthChange = useMemo(() => {
    if (!currentMonth || !previousMonth) {
      return 0;
    }

    if (previousMonth.amount <= 0) {
      return currentMonth.amount > 0 ? 100 : 0;
    }

    return (
      ((currentMonth.amount - previousMonth.amount) /
        previousMonth.amount) *
      100
    );
  }, [currentMonth, previousMonth]);

  const hasData = totalContributed > 0;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
            <BarChart3 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-950">
              Monthly Contributions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Compare your completed contributions across the last
              12 months.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadMonthlyContributions(true)
          }
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

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <MonthlyChartSkeleton />
      ) : points.length === 0 ? (
        <MonthlyChartEmptyState />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric
              icon={PiggyBank}
              label="Total contributed"
              value={formatMoney(
                totalContributed,
                currency
              )}
            />

            <SummaryMetric
              icon={TrendingUp}
              label="Monthly average"
              value={formatMoney(
                monthlyAverage,
                currency
              )}
            />

            <SummaryMetric
              icon={Trophy}
              label="Highest month"
              value={
                highestMonth
                  ? `${highestMonth.month} · ${formatMoney(
                      highestMonth.amount,
                      currency
                    )}`
                  : "No data"
              }
            />

            <SummaryMetric
              icon={
                monthChange >= 0
                  ? TrendingUp
                  : TrendingDown
              }
              label="Month-over-month"
              value={`${monthChange >= 0 ? "+" : ""}${monthChange.toFixed(
                1
              )}%`}
              valueClassName={
                monthChange >= 0
                  ? "text-green-700"
                  : "text-red-700"
              }
            />
          </div>

          {hasData ? (
            <>
              <div className="mt-7 h-[340px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={points}
                    margin={{
                      top: 10,
                      right: 8,
                      left: 0,
                      bottom: 0,
                    }}
                    barCategoryGap="24%"
                  >
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
                        formatCompactMoney(
                          value,
                          currency
                        )
                      }
                    />

                    <Tooltip
                      cursor={{
                        fill: "#f3f4f6",
                      }}
                      content={
                        <MonthlyTooltip
                          currency={currency}
                        />
                      }
                    />

                    <Bar
                      dataKey="amount"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={42}
                    >
                      {points.map((point) => (
                        <Cell
                          key={point.monthKey}
                          fill={
                            point.monthKey ===
                            highestMonth?.monthKey
                              ? "#2563eb"
                              : "#93c5fd"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InsightCard
                  title="Best month"
                  body={
                    highestMonth
                      ? `${highestMonth.fullMonth} was your strongest month with ${formatMoney(
                          highestMonth.amount,
                          currency
                        )} contributed.`
                      : "No contribution data is available yet."
                  }
                />

                <InsightCard
                  title="Lowest active month"
                  body={
                    lowestActiveMonth
                      ? `${lowestActiveMonth.fullMonth} recorded ${formatMoney(
                          lowestActiveMonth.amount,
                          currency
                        )} in contributions.`
                      : "Complete a contribution to unlock this insight."
                  }
                />
              </div>
            </>
          ) : (
            <MonthlyChartEmptyState />
          )}
        </>
      )}
    </Card>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  valueClassName = "text-gray-950",
}: {
  icon: typeof PiggyBank;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" />

        <p className="text-sm font-medium">
          {label}
        </p>
      </div>

      <p
        className={`mt-3 text-lg font-bold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function InsightCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-900">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {body}
      </p>
    </div>
  );
}

function MonthlyTooltip({
  active,
  payload,
  currency,
}: MonthlyTooltipProps) {
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
        {point.fullMonth}
      </p>

      <p className="mt-2 text-sm text-gray-600">
        Contributed:{" "}
        <span className="font-bold text-blue-700">
          {formatMoney(
            point.amount,
            currency
          )}
        </span>
      </p>
    </div>
  );
}

function MonthlyChartSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 rounded-2xl bg-gray-100"
          />
        ))}
      </div>

      <div className="mt-7 h-[340px] rounded-2xl bg-gray-100" />
    </div>
  );
}

function MonthlyChartEmptyState() {
  return (
    <div className="mt-7 rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        <BarChart3 className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-bold text-gray-950">
        No monthly contribution data
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Completed savings-circle contributions will appear here
        automatically.
      </p>
    </div>
  );
}

function buildMonthlyContributionPoints(
  contributions: ContributionRow[]
): ChartPoint[] {
  const points = createEmptyChartPoints();
  const monthlyTotals = new Map<string, number>();

  contributions.forEach((contribution) => {
    if (!contribution.paid_at) {
      return;
    }

    const date = new Date(contribution.paid_at);
    const amount = Number(contribution.amount ?? 0);

    if (
      Number.isNaN(date.getTime()) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    const monthKey = createMonthKey(date);

    monthlyTotals.set(
      monthKey,
      (monthlyTotals.get(monthKey) ?? 0) +
        amount
    );
  });

  return points.map((point) => ({
    ...point,
    amount:
      monthlyTotals.get(point.monthKey) ??
      0,
  }));
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
      currentDate.getMonth() -
        monthOffset,
      1
    );

    points.push({
      monthKey: createMonthKey(date),
      month: date.toLocaleDateString(
        "en-US",
        {
          month: "short",
        }
      ),
      fullMonth:
        date.toLocaleDateString(
          "en-US",
          {
            month: "long",
            year: "numeric",
          }
        ),
      amount: 0,
    });
  }

  return points;
}

function getChartStartDate() {
  const currentDate = new Date();

  return new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() -
      (MONTH_COUNT - 1),
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
  return `${currency} ${Number(
    amount
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCompactMoney(
  amount: number,
  currency: string
) {
  const formatted =
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Number(amount));

  return `${currency} ${formatted}`;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}