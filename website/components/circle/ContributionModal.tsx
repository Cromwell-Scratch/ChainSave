"use client";

import type { FormEvent } from "react";
import { CheckCircle2, X } from "lucide-react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { formatAmount } from "@/components/circle/helpers";

type ContributionModalProps = {
  open: boolean;

  circleName: string;
  currency: string;

  contributionAmount: string;
  expectedContribution: number;

  walletBalance: number;

  serviceFee: number;
  totalDebit: number;
  quoteLoading: boolean;
  quoteError: string;

  loading: boolean;
  message: string;

  onClose: () => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;

  onAmountChange: (
    value: string
  ) => void;
};
export default function ContributionModal({
  open,

  circleName,
  currency,

  contributionAmount,
  expectedContribution,

  walletBalance,
  serviceFee,
  totalDebit,
 quoteLoading,
 quoteError,

  loading,

  message,

  onClose,

  onSubmit,

  onAmountChange,
}: ContributionModalProps) {
  if (!open) return null;

  const amount =
    Number(contributionAmount || 0);


const balanceAfter =
  walletBalance - totalDebit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Confirm Contribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Review your payment to{" "}
              {circleName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-5"
        >
          <div className="rounded-2xl bg-green-50 p-5">
            <p className="text-sm font-medium text-green-800">
              Savings Circle
            </p>

            <p className="mt-2 text-xl font-bold text-green-900">
              {circleName}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-gray-200 p-5">
            <SummaryRow
  label="Contribution"
  value={`${currency} ${formatAmount(
    amount
  )}`}
/>

<SummaryRow
  label="Service Fee"
  value={`${currency} ${formatAmount(
    serviceFee
  )}`}
/>

<div className="border-t pt-4">
  <SummaryRow
    label="Total Debit"
    value={`${currency} ${formatAmount(
      totalDebit
    )}`}
  />
</div>

<SummaryRow
  label="Wallet Balance"
  value={`${currency} ${formatAmount(
    walletBalance
  )}`}
/>

<div className="border-t pt-4">
  <SummaryRow
    label="Balance After Payment"
    value={`${currency} ${formatAmount(
      balanceAfter
    )}`}
  />
</div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Contribution Amount
            </label>

            <Input
               type="number"
               value={contributionAmount}
               readOnly
              />

            <p className="mt-2 text-xs text-gray-500">
              Expected contribution:{" "}
              {currency}{" "}
              {formatAmount(
                expectedContribution
              )}
            </p>
          </div>

          {quoteError && (
  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
    {quoteError}
  </div>
)}

          {balanceAfter < 0 && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Your wallet balance is
               insufficient for this
                contribution and service fee.
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                 loading ||
                 quoteLoading ||
                 Boolean(quoteError) ||
                 balanceAfter < 0 ||
                 amount <= 0
                }
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />

              {loading
                ? "Processing..."
                : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}