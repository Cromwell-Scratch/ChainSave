"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Smartphone,
  X,
} from "lucide-react";

interface WithdrawModalProps {
  open: boolean;
  currency: string;
  availableBalance: number;
  loading?: boolean;
  onClose: () => void;
  onWithdraw: (data: {
    amount: number;
    destinationType: "mobile_money" | "ghipss";
    destinationName: string;
    destinationAccount: string;
    destinationBankCode: string;
  }) => Promise<void>;
}

type WithdrawalMethod = "mobile_money" | "ghipss";

const mobileMoneyProviders = [
  {
    label: "MTN Mobile Money",
    code: "MTN",
  },
  {
    label: "Telecel Cash",
    code: "VOD",
  },
  {
    label: "AirtelTigo Money",
    code: "ATL",
  },
];

const ghanaBanks = [
  {
    label: "GCB Bank",
    code: "040100",
  },
  {
    label: "Ecobank Ghana",
    code: "040103",
  },
  {
    label: "Fidelity Bank",
    code: "040106",
  },
  {
    label: "Absa Ghana",
    code: "040107",
  },
  {
    label: "Stanbic Bank",
    code: "040108",
  },
];

function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function WithdrawModal({
  open,
  currency,
  availableBalance,
  loading = false,
  onClose,
  onWithdraw,
}: WithdrawModalProps) {
  const [method, setMethod] =
    useState<WithdrawalMethod>("mobile_money");

  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState("MTN");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isProcessing = loading || submitting;

  const numericAmount = Number(amount);

  const selectedOptions =
    method === "mobile_money"
      ? mobileMoneyProviders
      : ghanaBanks;

  const disabled = useMemo(() => {
    return (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      numericAmount > availableBalance ||
      !name.trim() ||
      !account.trim() ||
      !provider ||
      isProcessing
    );
  }, [
    numericAmount,
    availableBalance,
    name,
    account,
    provider,
    isProcessing,
  ]);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setName("");
      setAccount("");
      setProvider("MTN");
      setMethod("mobile_money");
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  function closeModal() {
    if (isProcessing) return;

    setAmount("");
    setName("");
    setAccount("");
    setProvider("MTN");
    setMethod("mobile_money");
    setError("");

    onClose();
  }

  function changeMethod(nextMethod: WithdrawalMethod) {
    setMethod(nextMethod);
    setAccount("");
    setError("");

    if (nextMethod === "mobile_money") {
      setProvider("MTN");
    } else {
      setProvider(ghanaBanks[0]?.code ?? "");
    }
  }

  function useMaximumBalance() {
    setAmount(availableBalance.toFixed(2));
    setError("");
  }

  async function submit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Enter a valid withdrawal amount.");
      return;
    }

    if (numericAmount > availableBalance) {
      setError(
        `You only have ${formatMoney(
          currency,
          availableBalance
        )} available.`
      );
      return;
    }

    if (!name.trim()) {
      setError("Enter the account holder's name.");
      return;
    }

    if (!account.trim()) {
      setError(
        method === "mobile_money"
          ? "Enter a valid mobile money number."
          : "Enter a valid bank account number."
      );
      return;
    }

    if (!provider) {
      setError(
        method === "mobile_money"
          ? "Select a mobile money provider."
          : "Select a bank."
      );
      return;
    }

    try {
      setSubmitting(true);

      await onWithdraw({
        amount: numericAmount,
        destinationType: method,
        destinationName: name.trim(),
        destinationAccount: account.trim(),
        destinationBankCode: provider,
      });

      setAmount("");
      setName("");
      setAccount("");
      setError("");

      onClose();
    } catch (withdrawError) {
      console.error(
        "Withdrawal request failed:",
        withdrawError
      );

      const message =
        withdrawError instanceof Error
          ? withdrawError.message
          : "Unable to process withdrawal.";

      if (
        message
          .toLowerCase()
          .includes("starter business")
      ) {
        setError(
          "Paystack payouts are not enabled for this Starter Business account. Your account must be upgraded before automatic withdrawals can be processed."
        );
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-100 p-3 text-red-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="withdraw-modal-title"
                className="text-xl font-bold text-gray-900"
              >
                Withdraw Funds
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Withdraw money from your ChainSave wallet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={isProcessing}
            aria-label="Close withdrawal modal"
            className="rounded-xl bg-gray-100 p-2 text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          {/* Balance */}

          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              Available Balance
            </p>

            <p className="mt-1 text-2xl font-bold text-green-800">
              {formatMoney(currency, availableBalance)}
            </p>
          </div>

          {/* Amount */}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="withdraw-amount"
                className="text-sm font-semibold text-gray-800"
              >
                Withdrawal Amount
              </label>

              <button
                type="button"
                onClick={useMaximumBalance}
                disabled={
                  availableBalance <= 0 || isProcessing
                }
                className="text-sm font-semibold text-green-700 transition hover:text-green-800 disabled:opacity-50"
              >
                Use maximum
              </button>
            </div>

            <input
              id="withdraw-amount"
              type="number"
              min="0"
              max={availableBalance}
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder={`Enter ${currency} amount`}
              disabled={isProcessing}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Method */}

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-800">
              Withdrawal Method
            </p>

            <div className="flex flex-wrap gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
                <input
                  type="radio"
                  name="withdrawal-method"
                  checked={method === "mobile_money"}
                  onChange={() =>
                    changeMethod("mobile_money")
                  }
                  disabled={isProcessing}
                  className="h-4 w-4 accent-green-600"
                />

                <Smartphone className="h-4 w-4 text-green-700" />

                Mobile Money
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
                <input
                  type="radio"
                  name="withdrawal-method"
                  checked={method === "ghipss"}
                  onChange={() =>
                    changeMethod("ghipss")
                  }
                  disabled={isProcessing}
                  className="h-4 w-4 accent-green-600"
                />

                <Building2 className="h-4 w-4 text-green-700" />

                Bank Account
              </label>
            </div>
          </div>

          {/* Account holder */}

          <div>
            <label
              htmlFor="withdraw-name"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Account Holder Name
            </label>

            <input
              id="withdraw-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="Enter the account holder's full name"
              disabled={isProcessing}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Provider or bank */}

          <div>
            <label
              htmlFor="withdraw-provider"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              {method === "mobile_money"
                ? "Mobile Money Provider"
                : "Bank"}
            </label>

            <select
              id="withdraw-provider"
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value);
                setError("");
              }}
              disabled={isProcessing}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-gray-100"
            >
              {selectedOptions.map((item) => (
                <option
                  key={item.code}
                  value={item.code}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Number */}

          <div>
            <label
              htmlFor="withdraw-account"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              {method === "mobile_money"
                ? "Mobile Money Number"
                : "Bank Account Number"}
            </label>

            <input
              id="withdraw-account"
              type="text"
              inputMode={
                method === "mobile_money"
                  ? "tel"
                  : "numeric"
              }
              value={account}
              onChange={(event) => {
                setAccount(event.target.value);
                setError("");
              }}
              placeholder={
                method === "mobile_money"
                  ? "Example: 0551234567"
                  : "Enter bank account number"
              }
              disabled={isProcessing}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Error */}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <p className="text-sm leading-6">
                {error}
              </p>
            </div>
          )}

          {/* Notice */}

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm leading-6 text-yellow-800">
              Withdrawals are processed securely through
              Paystack. Automatic payouts require an
              approved Paystack business account.
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={closeModal}
            disabled={isProcessing}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={disabled}
            className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing
              ? "Processing..."
              : `Withdraw ${
                  numericAmount > 0
                    ? formatMoney(
                        currency,
                        numericAmount
                      )
                    : ""
                }`}
          </button>
        </div>
      </form>
    </div>
  );
}