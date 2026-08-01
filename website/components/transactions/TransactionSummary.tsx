"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
} from "lucide-react";

interface Props {
  totalTransactions: number;
  moneyIn: number;
  moneyOut: number;
  netFlow: number;
  currency?: string;
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function SummaryCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </h2>
        </div>

        <div
          className={`h-14 w-14 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <div className={iconColor}>{icon}</div>
        </div>

      </div>
    </div>
  );
}

export default function TransactionSummary({
  totalTransactions,
  moneyIn,
  moneyOut,
  netFlow,
  currency = "GHS",
}: Props) {
  const formatMoney = (value: number) =>
    `${currency} ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      <SummaryCard
        title="Total Transactions"
        value={totalTransactions.toLocaleString()}
        icon={<Wallet size={28} />}
        iconBg="bg-green-100"
        iconColor="text-green-700"
      />

      <SummaryCard
        title="Money In"
        value={formatMoney(moneyIn)}
        icon={<ArrowDownLeft size={28} />}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-700"
      />

      <SummaryCard
        title="Money Out"
        value={formatMoney(moneyOut)}
        icon={<ArrowUpRight size={28} />}
        iconBg="bg-red-100"
        iconColor="text-red-600"
      />

      <SummaryCard
        title="Net Flow"
        value={formatMoney(netFlow)}
        icon={<TrendingUp size={28} />}
        iconBg="bg-blue-100"
        iconColor="text-blue-700"
      />

    </div>
  );
}