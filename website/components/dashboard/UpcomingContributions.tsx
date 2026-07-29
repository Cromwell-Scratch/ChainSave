"use client";

import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import ContributionCard from "./ContributionCard";

type ContributionStatus =
  | "due"
  | "paid"
  | "overdue"
  | "upcoming";

export type UpcomingContributionCircle = {
  id: string;
  name: string;
  contribution_amount: number | string;
  currency: string | null;
  status: string | null;
  completed: boolean | null;
  started: boolean | null;
  current_round: number | string | null;
  current_payout_order: number | string | null;
  next_contribution_date: string | null;
};

type UpcomingContributionsProps = {
  circles: UpcomingContributionCircle[];
  onContributionComplete?: () => void;
};

type MembershipRow = {
  id: string;
  circle_id: string;
};

type CircleCycleRow = {
  circle_id: string;
  current_position: number | string | null;
};

type ContributionRow = {
  circle_id: string;
  member_id: string;
  round_number: number | string | null;
  status: string | null;
};

type ContributionItem = {
  circleId: string;
  circleName: string;
  currency: string;
  amount: number;
  currentRound: number;
  dueDate: string | null;
  status: ContributionStatus;
};

type RpcResult = {
  success?: boolean;
  wallet_balance?: number | string;
  round_number?: number | string;
  amount?: number | string;
  currency?: string;
};

export default function UpcomingContributions({
  circles,
  onContributionComplete,
}: UpcomingContributionsProps) {
  const [items, setItems] = useState<
    ContributionItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [processingCircleId, setProcessingCircleId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const circleIds = useMemo(
    () =>
      circles
        .filter(
          (circle) =>
            !Boolean(circle.completed) &&
            circle.status !== "completed" &&
            circle.status !== "closed"
        )
        .map((circle) => circle.id),
    [circles]
  );

  const loadContributions = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        if (circleIds.length === 0) {
          setItems([]);
          return;
        }

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
          .select("id, circle_id")
          .eq("user_id", session.user.id)
          .eq("status", "accepted")
          .in("circle_id", circleIds);

        if (membershipsError) {
          throw membershipsError;
        }

        const memberships =
          (membershipsData ??
            []) as MembershipRow[];

        if (memberships.length === 0) {
          setItems([]);
          return;
        }

        const membershipByCircle =
          memberships.reduce<
            Record<string, MembershipRow>
          >((result, membership) => {
            result[membership.circle_id] =
              membership;

            return result;
          }, {});

        const memberIds = memberships.map(
          (membership) => membership.id
        );

        const [
          cyclesResponse,
          contributionsResponse,
        ] = await Promise.all([
          supabase
            .from("circle_cycles")
            .select(
              "circle_id, current_position"
            )
            .eq("status", "active")
            .in("circle_id", circleIds),

          supabase
            .from("contributions")
            .select(
              "circle_id, member_id, round_number, status"
            )
            .eq("status", "completed")
            .in("member_id", memberIds)
            .in("circle_id", circleIds),
        ]);

        if (cyclesResponse.error) {
          throw cyclesResponse.error;
        }

        if (contributionsResponse.error) {
          throw contributionsResponse.error;
        }

        const cycles =
          (cyclesResponse.data ??
            []) as CircleCycleRow[];

        const contributions =
          (contributionsResponse.data ??
            []) as ContributionRow[];

        const activeRoundByCircle =
          cycles.reduce<Record<string, number>>(
            (result, cycle) => {
              result[cycle.circle_id] =
                toPositiveInteger(
                  cycle.current_position,
                  1
                );

              return result;
            },
            {}
          );

        const completedPaymentKeys =
          new Set(
            contributions.map(
              (contribution) =>
                createPaymentKey(
                  contribution.circle_id,
                  contribution.member_id,
                  toPositiveInteger(
                    contribution.round_number,
                    1
                  )
                )
            )
          );

        const nextItems = circles
          .filter(
            (circle) =>
              circleIds.includes(circle.id) &&
              Boolean(
                membershipByCircle[circle.id]
              )
          )
          .map<ContributionItem>((circle) => {
            const membership =
              membershipByCircle[circle.id];

            const currentRound =
              activeRoundByCircle[circle.id] ??
              toPositiveInteger(
                circle.current_payout_order ??
                  circle.current_round,
                1
              );

            const hasPaid =
              completedPaymentKeys.has(
                createPaymentKey(
                  circle.id,
                  membership.id,
                  currentRound
                )
              );

            return {
              circleId: circle.id,
              circleName: circle.name,
              currency:
                circle.currency?.toUpperCase() ||
                "GHS",
              amount: Number(
                circle.contribution_amount ?? 0
              ),
              currentRound,
              dueDate:
                circle.next_contribution_date,
              status: determineStatus(
                hasPaid,
                circle.next_contribution_date,
                Boolean(circle.started)
              ),
            };
          })
          .sort(compareItems);

        setItems(nextItems);
      } catch (error) {
        console.error(
          "Unable to load upcoming contributions:",
          error
        );

        setItems([]);
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load upcoming contributions."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [circleIds, circles]
  );

  useEffect(() => {
    void loadContributions();
  }, [loadContributions]);

  async function handlePay(
    circleId: string
  ) {
    if (processingCircleId) {
      return;
    }

    setProcessingCircleId(circleId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data, error } =
        await supabase.rpc(
          "make_circle_contribution",
          {
            p_circle_id: circleId,
          }
        );

      if (error) {
        throw error;
      }

      const result =
        (data ?? {}) as RpcResult;

      if (result.success === false) {
        throw new Error(
          "The contribution could not be completed."
        );
      }

      const paidItem = items.find(
        (item) =>
          item.circleId === circleId
      );

      setSuccessMessage(
        paidItem
          ? `${formatMoney(
              paidItem.amount,
              paidItem.currency
            )} was contributed to ${
              paidItem.circleName
            }.`
          : "Contribution completed successfully."
      );

      await loadContributions(true);
      onContributionComplete?.();
    } catch (error) {
      console.error(
        "Unable to make contribution:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to complete the contribution."
        )
      );
    } finally {
      setProcessingCircleId(null);
    }
  }

  return (
    <section
      aria-labelledby="upcoming-contributions-title"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="upcoming-contributions-title"
            className="text-xl font-bold text-gray-950"
          >
            Upcoming Contributions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review your active circles and pay
            directly from the dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadContributions(true)
          }
          disabled={
            loading ||
            refreshing ||
            Boolean(processingCircleId)
          }
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
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <ContributionSkeletons />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <ContributionCard
              key={item.circleId}
              circleId={item.circleId}
              circleName={item.circleName}
              currency={item.currency}
              amount={item.amount}
              currentRound={
                item.currentRound
              }
              dueDate={item.dueDate}
              status={item.status}
              loading={
                processingCircleId ===
                item.circleId
              }
              onPay={handlePay}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ContributionSkeletons() {
  return (
    <div
      aria-label="Loading upcoming contributions"
      className="grid gap-4"
    >
      {[0, 1].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="h-6 w-48 rounded bg-gray-200" />

              <div className="mt-4 flex gap-4">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-28 rounded bg-gray-200" />
              </div>
            </div>

            <div className="space-y-3 sm:text-right">
              <div className="h-4 w-20 rounded bg-gray-200 sm:ml-auto" />
              <div className="h-8 w-28 rounded bg-gray-200 sm:ml-auto" />
              <div className="h-10 w-28 rounded-xl bg-gray-200 sm:ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
        <CalendarCheck2 className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-bold text-gray-950">
        No upcoming contributions
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Contributions from your active savings
        circles will appear here once their
        payment schedules begin.
      </p>
    </div>
  );
}

function determineStatus(
  hasPaid: boolean,
  dueDate: string | null,
  hasStarted: boolean
): ContributionStatus {
  if (hasPaid) {
    return "paid";
  }

  if (!hasStarted || !dueDate) {
    return "upcoming";
  }

  const targetDate = parseDate(dueDate);
  const today = startOfDay(new Date());
  const dueDay = startOfDay(targetDate);

  if (dueDay.getTime() < today.getTime()) {
    return "overdue";
  }

  if (dueDay.getTime() === today.getTime()) {
    return "due";
  }

  return "upcoming";
}

function compareItems(
  first: ContributionItem,
  second: ContributionItem
) {
  const priority: Record<
    ContributionStatus,
    number
  > = {
    overdue: 0,
    due: 1,
    upcoming: 2,
    paid: 3,
  };

  const statusDifference =
    priority[first.status] -
    priority[second.status];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  const firstDate = first.dueDate
    ? parseDate(first.dueDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  const secondDate = second.dueDate
    ? parseDate(second.dueDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  return (
    firstDate - secondDate ||
    first.circleName.localeCompare(
      second.circleName
    )
  );
}

function createPaymentKey(
  circleId: string,
  memberId: string,
  roundNumber: number
) {
  return `${circleId}:${memberId}:${roundNumber}`;
}

function toPositiveInteger(
  value: number | string | null | undefined,
  fallback: number
) {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

function parseDate(value: string) {
  return value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00`);
}

function startOfDay(value: Date) {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
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