"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Send,
} from "lucide-react";

interface WalletQuickActionsProps {
  onDeposit: () => void;
  onWithdraw: () => void;
  onConvert: () => void;
  onSend: () => void;
}

export default function WalletQuickActions({
  onDeposit,
  onWithdraw,
  onConvert,
  onSend,
}: WalletQuickActionsProps) {
  const actions = [
    {
      label: "Deposit",
      description: "Add money to your wallet",
      icon: ArrowDownLeft,
      onClick: onDeposit,
    },
    {
      label: "Withdraw",
      description: "Move funds out of ChainSave",
      icon: ArrowUpRight,
      onClick: onWithdraw,
    },
    {
      label: "Convert",
      description: "Exchange between currencies",
      icon: ArrowLeftRight,
      onClick: onConvert,
    },
    {
      label: "Send",
      description: "Send money to another wallet",
      icon: Send,
      onClick: onSend,
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage and move funds from one place.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="group rounded-2xl border border-gray-200 p-5 text-left transition hover:border-green-300 hover:bg-green-50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700 transition group-hover:bg-green-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                {action.label}
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}