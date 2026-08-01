"use client";

import { ArrowUpRight, ArrowDownLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

interface CurrencyBalanceCardProps {
  currency: string;
  availableBalance: number;
  lockedBalance: number;
  address?: string;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

const currencyConfig = {
  GHS: {
    name: "Ghana Cedi",
    flag: "🇬🇭",
    decimals: 2,
  },
  NGN: {
    name: "Nigerian Naira",
    flag: "🇳🇬",
    decimals: 2,
  },
  KES: {
    name: "Kenyan Shilling",
    flag: "🇰🇪",
    decimals: 2,
  },
  RBTC: {
    name: "Rootstock Bitcoin",
    flag: "₿",
    decimals: 8,
  },
};

export default function CurrencyBalanceCard({
  currency,
  availableBalance,
  lockedBalance,
  address,
  onDeposit,
  onWithdraw,
}: CurrencyBalanceCardProps) {
  const [copied, setCopied] = useState(false);

  const config =
    currencyConfig[currency as keyof typeof currencyConfig];

  const total = availableBalance + lockedBalance;

  function format(value: number) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
  }

  async function copyAddress() {
    if (!address) return;

    await navigator.clipboard.writeText(address);

    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <div className="flex items-center gap-2">

            <span className="text-3xl">{config.flag}</span>

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                {currency}
              </h2>

              <p className="text-sm text-gray-500">
                {config.name}
              </p>

            </div>

          </div>

        </div>

        <div className="text-right">

          <p className="text-sm text-gray-500">
            Total
          </p>

          <h2 className="text-2xl font-bold text-gray-900">
            {format(total)}
          </h2>

        </div>

      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">

        <div className="rounded-xl bg-green-50 p-4">

          <p className="text-sm text-green-700">
            Available
          </p>

          <p className="mt-1 font-semibold text-green-900">
            {format(availableBalance)}
          </p>

        </div>

        <div className="rounded-xl bg-yellow-50 p-4">

          <p className="text-sm text-yellow-700">
            Locked
          </p>

          <p className="mt-1 font-semibold text-yellow-900">
            {format(lockedBalance)}
          </p>

        </div>

      </div>

      {address && (
        <div className="mt-5 rounded-xl border bg-gray-50 p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-gray-500">
                Wallet Address
              </p>

              <p className="mt-1 truncate font-mono text-sm">
                {address}
              </p>

            </div>

            <button
              onClick={copyAddress}
              className="rounded-lg border p-2 hover:bg-gray-100"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

          </div>

        </div>
      )}

      <div className="mt-6 flex gap-3">

        <button
          onClick={onDeposit}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700"
        >
          <ArrowDownLeft className="h-5 w-5" />
          Deposit
        </button>

        <button
          onClick={onWithdraw}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-medium transition hover:bg-gray-100"
        >
          <ArrowUpRight className="h-5 w-5" />
          Withdraw
        </button>

      </div>

    </div>
  );
}