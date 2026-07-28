"use client";

import {
  Copy,
  Globe2,
  Lock,
} from "lucide-react";

import Card from "@/components/ui/Card";
import type { Circle } from "@/components/circle/types";
import {
  formatAmount,
  formatDate,
  getCircleCode,
} from "@/components/circle/helpers";

type CircleHeaderProps = {
  circle: Circle;
  totalSaved: number;
  savingsGoal: number;
  progressPercentage: number;
  acceptedMembersCount: number;
  onCopyCode: () => void;
};

export default function CircleHeader({
  circle,
  totalSaved,
  savingsGoal,
  progressPercentage,
  acceptedMembersCount,
  onCopyCode,
}: CircleHeaderProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                Savings Circle
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                {circle.privacy === "private" ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Globe2 className="h-4 w-4" />
                )}

                {circle.privacy === "private"
                  ? "Private"
                  : "Public"}
              </span>

              {circle.completed && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  Completed
                </span>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
              {circle.name}
            </h1>

            <p className="mt-3 max-w-2xl text-green-100">
              {circle.description ||
                "No description provided."}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-green-100">
              Circle Code
            </p>

            <div className="mt-2 flex items-center gap-3">
              <p className="text-xl font-bold tracking-wider">
                {getCircleCode(circle)}
              </p>

              <button
                type="button"
                onClick={onCopyCode}
                className="rounded-lg p-2 transition hover:bg-white/15"
                aria-label="Copy circle code"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-green-100">
                Total saved
              </p>

              <p className="mt-1 text-3xl font-bold">
                {circle.currency}{" "}
                {formatAmount(totalSaved)}
              </p>
            </div>

            <p className="text-sm font-semibold text-green-100">
              {progressPercentage}% of{" "}
              {circle.currency}{" "}
              {formatAmount(savingsGoal)}
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HeaderStat
            label="Contribution"
            value={`${circle.currency} ${formatAmount(
              circle.contribution_amount
            )}`}
          />

          <HeaderStat
            label="Frequency"
            value={circle.contribution_frequency}
          />

          <HeaderStat
            label="Accepted Members"
            value={`${acceptedMembersCount} / ${circle.max_members}`}
          />

          <HeaderStat
            label="Start Date"
            value={formatDate(circle.start_date)}
          />
        </div>
      </div>
    </Card>
  );
}

type HeaderStatProps = {
  label: string;
  value: string;
};

function HeaderStat({
  label,
  value,
}: HeaderStatProps) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wide text-green-100">
        {label}
      </p>

      <p className="mt-2 font-bold text-white">
        {value}
      </p>
    </div>
  );
}