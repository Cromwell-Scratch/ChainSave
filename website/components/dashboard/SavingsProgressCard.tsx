"use client";

import {
  CheckCircle2,
  Mail,
  Target,
  TrendingUp,
} from "lucide-react";

type SavingsProgressCardProps = {
  totalSavings: number;
  savingsGoal: number;
  completedCircles: number;
  pendingInvites: number;
};

export default function SavingsProgressCard({
  totalSavings,
  savingsGoal,
  completedCircles,
  pendingInvites,
}: SavingsProgressCardProps) {
  const progressPercentage =
    savingsGoal > 0
      ? Math.min(
          100,
          Math.round(
            (totalSavings / savingsGoal) * 100
          )
        )
      : 0;

  const remainingAmount = Math.max(
    savingsGoal - totalSavings,
    0
  );

  function formatMoney(amount: number) {
    return `GHS ${Number(amount).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-green-100 p-3 text-green-700">
              <TrendingUp className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-950">
                Savings Progress
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your completed contributions across
                all savings circles.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-green-50 px-5 py-4 text-left lg:text-right">
          <p className="text-sm font-medium text-green-700">
            Overall progress
          </p>

          <p className="mt-1 text-3xl font-bold text-green-800">
            {progressPercentage}%
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Amount saved
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-950">
              {formatMoney(totalSavings)}
            </p>
          </div>

          <p className="text-sm font-semibold text-gray-600">
            Goal: {formatMoney(savingsGoal)}
          </p>
        </div>

        <div className="mt-5 h-4 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-700"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        <div className="mt-3 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {progressPercentage}% completed
          </p>

          <p>
            {remainingAmount > 0
              ? `${formatMoney(
                  remainingAmount
                )} remaining`
              : savingsGoal > 0
                ? "Savings goal completed"
                : "Join a circle to begin saving"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <ProgressDetail
          icon={Target}
          label="Savings Goal"
          value={formatMoney(savingsGoal)}
          accent="blue"
        />

        <ProgressDetail
          icon={CheckCircle2}
          label="Completed Circles"
          value={String(completedCircles)}
          accent="green"
        />

        <ProgressDetail
          icon={Mail}
          label="Pending Invitations"
          value={String(pendingInvites)}
          accent="orange"
        />
      </div>
    </section>
  );
}

type ProgressDetailProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  accent: "green" | "blue" | "orange";
};

function ProgressDetail({
  icon: Icon,
  label,
  value,
  accent,
}: ProgressDetailProps) {
  const classes = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
      <div
        className={`rounded-xl p-3 ${classes[accent]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="mt-1 text-lg font-bold text-gray-950">
          {value}
        </p>
      </div>
    </div>
  );
}