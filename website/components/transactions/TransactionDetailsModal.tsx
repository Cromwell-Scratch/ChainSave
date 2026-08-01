"use client";

import { X, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import type { Transaction } from "./TransactionCard";

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export default function TransactionDetailsModal({
  transaction,
  open,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!open || !transaction) return null;

  const copyReference = async () => {
    if (!transaction.reference) return;

    await navigator.clipboard.writeText(transaction.reference);

    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = () => {
    switch (transaction.status) {
      case "completed":
        return (
          <span className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
            <CheckCircle2 size={16} />
            Completed
          </span>
        );

      case "pending":
        return (
          <span className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
            <Clock size={16} />
            Pending
          </span>
        );

      default:
        return (
          <span className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
            <XCircle size={16} />
            Failed
          </span>
        );
    }
  };

  const Row = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex justify-between border-b border-gray-100 py-4">
      <span className="font-medium text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-2xl font-bold">
              Transaction Details
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Complete transaction information
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X />
          </button>
        </div>

        <div className="space-y-2 p-6">

          <Row
            label="Amount"
            value={`${transaction.currency} ${transaction.amount.toLocaleString(undefined,{
              minimumFractionDigits:2,
            })}`}
          />

          <Row
            label="Transaction Type"
            value={transaction.transaction_type}
          />

          <Row
            label="Status"
            value={statusBadge()}
          />

          <Row
            label="Payment Method"
            value={transaction.payment_method || "Wallet"}
          />

          <Row
            label="Circle"
            value={transaction.circle_name || "-"}
          />

          <Row
            label="Description"
            value={transaction.description || "-"}
          />

          <Row
            label="Date"
            value={new Date(transaction.created_at).toLocaleString()}
          />

          <div className="flex justify-between py-4">

            <span className="font-medium text-gray-500">
              Reference
            </span>

            <div className="flex items-center gap-3">

              <span className="font-semibold">
                {transaction.reference || "-"}
              </span>

              {transaction.reference && (
                <button
                  onClick={copyReference}
                  className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200"
                >
                  <Copy size={16} />
                </button>
              )}

            </div>

          </div>

          {copied && (
            <div className="rounded-xl bg-green-50 p-3 text-center text-green-700">
              Reference copied successfully.
            </div>
          )}

        </div>

        <div className="border-t p-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}