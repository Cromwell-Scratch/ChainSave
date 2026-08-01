"use client";

import {
  CheckCircle2,
  Target,
  TrendingUp,
  Wallet,
  Mail,
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
  const percentage =
    savingsGoal > 0
      ? Math.min(
          Math.round((totalSavings / savingsGoal) * 100),
          100
        )
      : 0;

  const formatMoney = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    });

  return (
    <section>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Savings Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor your savings performance at a glance.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {/* Total Saved */}

        <Card
          title="Total Saved"
          value={formatMoney(totalSavings)}
          subtitle="Across all active circles"
          icon={
            <Wallet
              className="h-6 w-6 text-emerald-600"
            />
          }
          accent="bg-emerald-50"
        />

        {/* Goal */}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Savings Goal
              </p>

              <h3 className="mt-2 text-3xl font-bold text-slate-800">
                {percentage}%
              </h3>

            </div>

            <div className="rounded-2xl bg-blue-50 p-3">

              <Target className="h-6 w-6 text-blue-600" />

            </div>

          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
              style={{
                width: `${percentage}%`,
              }}
            />

          </div>

          <div className="mt-4 flex justify-between text-sm">

            <span className="text-slate-500">
              {formatMoney(totalSavings)}
            </span>

            <span className="font-semibold text-slate-700">
              {formatMoney(savingsGoal)}
            </span>

          </div>

        </div>

        {/* Completed */}

        <Card
          title="Completed Circles"
          value={completedCircles.toString()}
          subtitle="Successfully finished"
          icon={
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          }
          accent="bg-green-50"
        />

        {/* Invites */}

        <Card
          title="Pending Invitations"
          value={pendingInvites.toString()}
          subtitle={
            pendingInvites > 0
              ? "Waiting for your response"
              : "You're all caught up"
          }
          icon={
            <Mail className="h-6 w-6 text-orange-600" />
          }
          accent="bg-orange-50"
        />

      </div>

      <div className="mt-8 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 p-6">

        <div className="flex items-center gap-3">

          <TrendingUp className="text-emerald-600" />

          <div>

            <h3 className="font-semibold text-slate-800">
              Savings Health
            </h3>

            <p className="text-sm text-slate-600">

              {percentage >= 80 &&
                "Excellent progress! You're almost at your savings goal."}

              {percentage >= 50 &&
                percentage < 80 &&
                "Great work. You're more than halfway to your target."}

              {percentage >= 20 &&
                percentage < 50 &&
                "Good progress. Keep contributing consistently."}

              {percentage < 20 &&
                "You're just getting started. Every contribution counts."}

            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

function Card({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-slate-800">
            {value}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {subtitle}
          </p>

        </div>

        <div className={`rounded-2xl p-3 ${accent}`}>
          {icon}
        </div>

      </div>

    </div>
  );
}