"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  WalletCards,
} from "lucide-react";

type ContributionStatus =
  | "due"
  | "paid"
  | "overdue"
  | "upcoming";

type ContributionCardProps = {
  circleId: string;
  circleName: string;
  currency: string;
  amount: number;
  currentRound: number;
  dueDate: string | null;
  status: ContributionStatus;
  loading?: boolean;
  onPay?: (circleId: string) => void;
};

export default function ContributionCard({
  circleId,
  circleName,
  currency,
  amount,
  currentRound,
  dueDate,
  status,
  loading = false,
  onPay,
}: ContributionCardProps) {
  const isPaid = status === "paid";
  const isOverdue = status === "overdue";
  const canPay =
    !isPaid &&
    !loading &&
    Boolean(onPay);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/circles/${circleId}`}
              className="truncate text-lg font-bold text-gray-950 transition hover:text-green-700"
            >
              {circleName}
            </Link>

            <StatusBadge status={status} />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />

              <span>
                Round {currentRound}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />

              <span>
                {formatDueDate(
                  dueDate,
                  status
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Amount due
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-950">
              {formatMoney(
                amount,
                currency
              )}
            </p>
          </div>

          {isPaid ? (
            <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Paid
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                onPay?.(circleId)
              }
              disabled={!canPay}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <WalletCards className="h-4 w-4" />
                  Pay Now
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {isOverdue && !isPaid && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          This contribution is overdue. Pay as soon as possible to keep your circle on schedule.
        </p>
      )}
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: ContributionStatus;
}) {
  const classes = {
    due: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    upcoming: "bg-blue-100 text-blue-700",
  };

  const labels = {
    due: "Due",
    paid: "Paid",
    overdue: "Overdue",
    upcoming: "Upcoming",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
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

function formatDueDate(
  value: string | null,
  status: ContributionStatus
) {
  if (status === "paid") {
    return "Paid for this round";
  }

  if (!value) {
    return "Date not scheduled";
  }

  const targetDate = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  targetDate.setHours(0, 0, 0, 0);

  const differenceInDays = Math.round(
    (targetDate.getTime() -
      today.getTime()) /
      86_400_000
  );

  if (differenceInDays === 0) {
    return "Due today";
  }

  if (differenceInDays === 1) {
    return "Due tomorrow";
  }

  if (differenceInDays === -1) {
    return "1 day overdue";
  }

  if (differenceInDays < 0) {
    return `${Math.abs(
      differenceInDays
    )} days overdue`;
  }

  if (differenceInDays <= 7) {
    return `Due in ${differenceInDays} days`;
  }

  return `Due ${targetDate.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  )}`;
}