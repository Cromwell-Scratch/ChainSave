"use client";

import { Receipt, Plus } from "lucide-react";
import Link from "next/link";

export default function TransactionEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-20 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <Receipt className="h-10 w-10 text-green-600" />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-gray-900">
        No Transactions Yet
      </h2>

      <p className="mx-auto mt-3 max-w-md text-gray-500">
        Your deposits, withdrawals, savings contributions and payouts will
        appear here once you start using ChainSave.
      </p>

      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/wallet"
          className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Go to Wallet
        </Link>

        <Link
          href="/create-circle"
          className="flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Plus className="h-5 w-5" />
          Create Circle
        </Link>
      </div>
    </div>
  );
}