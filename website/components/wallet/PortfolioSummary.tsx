"use client";

import { Wallet, Lock, Coins, TrendingUp } from "lucide-react";

interface PortfolioSummaryProps {
  portfolioValue: number;
  availableBalance: number;
  lockedBalance: number;
  currency: string;
  activeCurrencies: number;
}

function formatAmount(amount: number, currency: string) {
  const decimals = currency === "RBTC" ? 8 : 2;

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export default function PortfolioSummary({
  portfolioValue,
  availableBalance,
  lockedBalance,
  currency,
  activeCurrencies,
}: PortfolioSummaryProps) {
  const cards = [
    {
      title: "Portfolio Value",
      value: formatAmount(portfolioValue, currency),
      icon: Wallet,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Available",
      value: formatAmount(availableBalance, currency),
      icon: Coins,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Locked",
      value: formatAmount(lockedBalance, currency),
      icon: Lock,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      title: "Currencies",
      value: activeCurrencies.toString(),
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>

              <h2 className="mt-2 break-words text-xl font-bold text-gray-900 sm:text-2xl">
                {card.value}
              </h2>
            </div>

            <div className={`rounded-xl p-3 ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}