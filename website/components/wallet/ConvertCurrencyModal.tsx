"use client";

import { AlertCircle, ArrowLeftRight, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface ConvertibleBalance {
  currency: string;
  availableBalance: number;
}

interface ConvertCurrencyModalProps {
  open: boolean;
  balances: ConvertibleBalance[];
  rates: Record<string, number>;
  onClose: () => void;
  onConvert: (data: {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
    rate: number;
    convertedAmount: number;
  }) => Promise<void>;
}

function getDecimals(currency: string) {
  return currency === "RBTC" ? 8 : 2;
}

function formatAmount(currency: string, amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: getDecimals(currency),
    maximumFractionDigits: getDecimals(currency),
  });
}

export default function ConvertCurrencyModal({
  open,
  balances,
  rates,
  onClose,
  onConvert,
}: ConvertCurrencyModalProps) {
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setAmount("");
      setError("");
      setLoading(false);
      return;
    }

    const firstCurrency = balances[0]?.currency ?? "";
    const secondCurrency =
      balances.find((balance) => balance.currency !== firstCurrency)?.currency ??
      "";

    setFromCurrency((current) => current || firstCurrency);
    setToCurrency((current) => current || secondCurrency);
  }, [open, balances]);

  const sourceBalance = useMemo(
    () =>
      balances.find((balance) => balance.currency === fromCurrency)
        ?.availableBalance ?? 0,
    [balances, fromCurrency]
  );

  const parsedAmount = Number(amount);

  const rateKey = `${fromCurrency}_${toCurrency}`;
  const conversionRate = rates[rateKey] ?? 0;

  const convertedAmount =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && conversionRate > 0
      ? parsedAmount * conversionRate
      : 0;

  const validConversion =
    fromCurrency.length > 0 &&
    toCurrency.length > 0 &&
    fromCurrency !== toCurrency &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= sourceBalance &&
    conversionRate > 0;

  if (!open) return null;

  function closeModal() {
    if (loading) return;

    setAmount("");
    setError("");
    onClose();
  }

  function useMaximumBalance() {
    setAmount(sourceBalance.toFixed(getDecimals(fromCurrency)));
    setError("");
  }

  function switchCurrencies() {
    if (loading) return;

    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount("");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!fromCurrency || !toCurrency) {
      setError("Select both the source and destination currencies.");
      return;
    }

    if (fromCurrency === toCurrency) {
      setError("Choose two different currencies.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount to convert.");
      return;
    }

    if (parsedAmount > sourceBalance) {
      setError(
        `You only have ${fromCurrency} ${formatAmount(
          fromCurrency,
          sourceBalance
        )} available.`
      );
      return;
    }

    if (!conversionRate || conversionRate <= 0) {
      setError("An exchange rate is not currently available for this pair.");
      return;
    }

    try {
      setLoading(true);

      await onConvert({
        fromCurrency,
        toCurrency,
        amount: parsedAmount,
        rate: conversionRate,
        convertedAmount,
      });

      setAmount("");
      onClose();
    } catch (conversionError) {
      console.error("Currency conversion failed:", conversionError);

      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "The currency conversion could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="convert-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3 text-orange-700">
              <ArrowLeftRight className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="convert-modal-title"
                className="text-xl font-semibold text-gray-900"
              >
                Convert Currency
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Exchange funds between your wallet balances.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            aria-label="Close conversion modal"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="convert-from-currency"
                className="text-sm font-medium text-gray-700"
              >
                From
              </label>

              <p className="text-sm text-gray-500">
                Available:{" "}
                <span className="font-medium text-gray-900">
                  {fromCurrency || "—"}{" "}
                  {fromCurrency
                    ? formatAmount(fromCurrency, sourceBalance)
                    : "0.00"}
                </span>
              </p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
              <input
                id="convert-amount"
                type="number"
                min="0"
                max={sourceBalance}
                step={fromCurrency === "RBTC" ? "0.00000001" : "0.01"}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                placeholder="Enter amount"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                required
              />

              <select
                id="convert-from-currency"
                value={fromCurrency}
                onChange={(event) => {
                  setFromCurrency(event.target.value);
                  setAmount("");
                  setError("");
                }}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {balances.map((balance) => (
                  <option
                    key={balance.currency}
                    value={balance.currency}
                    disabled={balance.currency === toCurrency}
                  >
                    {balance.currency}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={useMaximumBalance}
              disabled={sourceBalance <= 0 || loading}
              className="mt-3 text-sm font-medium text-green-700 transition hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use maximum
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={switchCurrencies}
              disabled={!fromCurrency || !toCurrency || loading}
              aria-label="Switch source and destination currencies"
              className="rounded-full border border-gray-300 bg-white p-3 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <label
              htmlFor="convert-to-currency"
              className="text-sm font-medium text-gray-700"
            >
              To
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-lg font-semibold text-gray-900">
                  {toCurrency || "—"}{" "}
                  {toCurrency
                    ? formatAmount(toCurrency, convertedAmount)
                    : "0.00"}
                </p>
              </div>

              <select
                id="convert-to-currency"
                value={toCurrency}
                onChange={(event) => {
                  setToCurrency(event.target.value);
                  setError("");
                }}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {balances.map((balance) => (
                  <option
                    key={balance.currency}
                    value={balance.currency}
                    disabled={balance.currency === fromCurrency}
                  >
                    {balance.currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-orange-50 p-4">
            <p className="text-sm text-orange-800">
              Exchange rate
            </p>

            <p className="mt-1 font-semibold text-orange-900">
              1 {fromCurrency || "—"} ={" "}
              {toCurrency
                ? formatAmount(toCurrency, conversionRate)
                : "0.00"}{" "}
              {toCurrency || "—"}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <p className="text-sm leading-6">{error}</p>
            </div>
          )}

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">You convert</span>

              <span className="font-medium text-gray-900">
                {fromCurrency || "—"}{" "}
                {fromCurrency
                  ? formatAmount(
                      fromCurrency,
                      Number.isFinite(parsedAmount) ? parsedAmount : 0
                    )
                  : "0.00"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">You receive</span>

              <span className="font-semibold text-green-700">
                {toCurrency || "—"}{" "}
                {toCurrency
                  ? formatAmount(toCurrency, convertedAmount)
                  : "0.00"}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !validConversion}
              className="rounded-xl bg-orange-600 px-5 py-3 font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Converting..." : "Confirm Conversion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}