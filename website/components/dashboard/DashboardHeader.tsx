"use client";

import {
  Wallet,
  Users,
  CalendarClock,
  Trophy,
  TrendingUp,
} from "lucide-react";

type DashboardHeaderProps = {
  userName: string;
  walletBalance: number;
  activeCircles: number;
  nextContribution: string;
  upcomingPayout: string;
  totalSavings: number;
  savingsGoal: number;
};

export default function DashboardHeader({
  userName,
  walletBalance,
  activeCircles,
  nextContribution,
  upcomingPayout,
  totalSavings,
  savingsGoal,
}: DashboardHeaderProps) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const progress =
    savingsGoal > 0
      ? Math.min(
          (totalSavings / savingsGoal) * 100,
          100
        )
      : 0;

  const money = (amount: number) =>
    amount.toLocaleString("en-US", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    });

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-green-700 to-lime-500 p-8 text-white shadow-2xl">

      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-15">
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 320"
        >
          <path
            d="M0 210 C180 150 300 260 470 210 S760 120 1200 220V320H0Z"
            fill="#dcfce7"
          />
        </svg>
      </div>

      <div className="relative flex flex-col gap-8 xl:flex-row xl:justify-between">

        <div className="flex-1">

          <p className="uppercase tracking-[0.25em] text-sm text-green-100">
            ChainSave Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            {greeting}, {userName} 👋
          </h1>

          <p className="mt-3 max-w-xl text-green-50">
            Every contribution brings you one step closer to
            financial freedom. Keep saving consistently.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon={<Wallet size={22} />}
              title="Wallet"
              value={money(walletBalance)}
            />

            <StatCard
              icon={<Users size={22} />}
              title="Active Circles"
              value={activeCircles.toString()}
            />

            <StatCard
              icon={<CalendarClock size={22} />}
              title="Next Contribution"
              value={nextContribution}
            />

            <StatCard
              icon={<TrendingUp size={22} />}
              title="Upcoming Payout"
              value={upcomingPayout}
            />

          </div>

        </div>

        <div className="w-full max-w-sm rounded-3xl bg-white/15 p-6 backdrop-blur-xl border border-white/20">

          <div className="flex items-center gap-2">

            <Trophy className="text-yellow-300" />

            <h2 className="font-semibold text-lg">
              Savings Goal
            </h2>

          </div>

          <div className="mt-6 text-5xl font-bold">
            {progress.toFixed(0)}%
          </div>

          <div className="mt-5 h-3 rounded-full bg-white/20">

            <div
              className="h-3 rounded-full bg-lime-300 transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="mt-5 flex justify-between text-sm text-green-100">

            <span>
              Saved
            </span>

            <span>
              Goal
            </span>

          </div>

          <div className="mt-2 flex justify-between font-semibold">

            <span>
              {money(totalSavings)}
            </span>

            <span>
              {money(savingsGoal)}
            </span>

          </div>

        </div>

      </div>

    </section>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/15">

      <div className="text-lime-300">
        {icon}
      </div>

      <p className="mt-3 text-xs uppercase tracking-wide text-green-100">
        {title}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>

    </div>
  );
}