"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  transaction_type:
    | "deposit"
    | "withdrawal"
    | "contribution"
    | "payout";
  status: "pending" | "completed" | "failed";
  payment_method?: string;
  description?: string;
  reference?: string;
  circle_name?: string;
  created_at: string;
}

interface Props {
  transaction: Transaction;
  onClick?: () => void;
}

export default function TransactionCard({
  transaction,
  onClick,
}: Props) {
  const {
    amount,
    currency,
    transaction_type,
    status,
    description,
    circle_name,
    created_at,
  } = transaction;

  const icon = () => {
    switch (transaction_type) {
      case "deposit":
        return (
          <ArrowDownLeft className="h-6 w-6 text-green-600" />
        );

      case "withdrawal":
        return (
          <ArrowUpRight className="h-6 w-6 text-red-500" />
        );

      case "contribution":
        return (
          <Users className="h-6 w-6 text-blue-600" />
        );

      default:
        return (
          <Wallet className="h-6 w-6 text-purple-600" />
        );
    }
  };

  const badge = () => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </span>
        );

      case "pending":
        return (
          <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        );

      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <XCircle className="h-4 w-4" />
            Failed
          </span>
        );
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-green-500 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">

        <div className="flex items-center gap-4">

          <div className="rounded-xl bg-gray-100 p-3">
            {icon()}
          </div>

          <div className="text-left">

            <h3 className="font-semibold capitalize text-gray-900">
              {transaction_type}
            </h3>

            <p className="text-sm text-gray-500">
              {description || "Wallet transaction"}
            </p>

            {circle_name && (
              <p className="mt-1 text-xs font-medium text-green-700">
                {circle_name}
              </p>
            )}

          </div>

        </div>

        {badge()}

      </div>

      <div className="mt-5 flex items-end justify-between">

        <div>

          <p className="text-2xl font-bold text-gray-900">
            {currency}{" "}
            {Number(amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {new Date(created_at).toLocaleString()}
          </p>

        </div>

      </div>
    </button>
  );
}