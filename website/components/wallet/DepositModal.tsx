"use client";

import { ArrowDownLeft, X } from "lucide-react";
import { useState } from "react";

interface DepositModalProps {
  open: boolean;
  currency: string;
  onClose: () => void;
  onDeposit: (amount: number) => Promise<void>;
}

export default function DepositModal({
  open,
  currency,
  onClose,
  onDeposit,
}: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const value = Number(amount);

    if (!value || value <= 0) return;

    try {
      setLoading(true);

      await onDeposit(value);

      setAmount("");

      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-gray-200 p-6">

          <div className="flex items-center gap-4">

            <div className="rounded-2xl bg-green-100 p-3 text-green-700">
              <ArrowDownLeft className="h-6 w-6" />
            </div>

            <div>

              <h2 className="text-2xl font-bold text-gray-900">
                Deposit Funds
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Add money to your {currency} wallet.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2 text-gray-700 transition hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >

          {/* Amount */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Deposit Amount
            </label>

            <input
              type="number"
              min="0"
              step={
                currency === "RBTC"
                  ? "0.00000001"
                  : "0.01"
              }
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="Enter amount"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-100"
              required
            />

          </div>

          {/* Payment */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Payment Method
            </label>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-bold text-gray-900">
                    Paystack
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    Mobile Money • Bank Card • Bank Transfer
                  </p>

                </div>

                <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                  Recommended
                </span>

              </div>

            </div>

          </div>

          {/* Notice */}

          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">

            <p className="text-sm text-green-800">
              You'll be redirected securely to Paystack
              to complete your payment. Your wallet will
              be credited automatically after payment
              verification.
            </p>

          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Redirecting..."
                : "Continue to Payment"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}