"use client";

import {
  CalendarDays,
  CircleDollarSign,
  Users,
  WalletCards,
} from "lucide-react";

type DashboardHeaderProps = {
  userName: string;
  walletBalance: number;
  activeCircles: number;
  nextContribution: string;
  upcomingPayout: string;
};

export default function DashboardHeader({
  userName,
  walletBalance,
  activeCircles,
  nextContribution,
  upcomingPayout,
}: DashboardHeaderProps) {
  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 18) {
      return "Good Afternoon";
    }

    return "Good Evening";
  }

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
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 p-6 text-white shadow-lg sm:p-8">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />

      <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-white/5" />

      <div className="relative">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-100">
            Savings overview
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {getGreeting()}, {userName} 👋
          </h1>

          <p className="mt-2 max-w-2xl text-green-100">
            Stay consistent—every contribution brings
            you closer to your savings goals.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HeaderItem
            icon={WalletCards}
            label="Wallet Balance"
            value={formatMoney(walletBalance)}
          />

          <HeaderItem
            icon={Users}
            label="Active Circles"
            value={String(activeCircles)}
          />

          <HeaderItem
            icon={CalendarDays}
            label="Next Contribution"
            value={nextContribution}
          />

          <HeaderItem
            icon={CircleDollarSign}
            label="Upcoming Payout"
            value={upcomingPayout}
          />
        </div>
      </div>
    </section>
  );
}

type HeaderItemProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
};

function HeaderItem({
  icon: Icon,
  label,
  value,
}: HeaderItemProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
      <Icon className="h-6 w-6 text-green-100" />

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-green-100">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-white">
        {value}
      </p>
    </div>
  );
}