"use client";

import { AlertCircle, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface SendableBalance {
  currency: string;
  availableBalance: number;
}

interface SendMoneyModalProps {
  open: boolean;
  balances: SendableBalance[];
  onClose: () => void;
  onSend: (data: {
    currency: string;
    amount: number;
    recipient: string;
    note?: string;
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

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SendMoneyModal({
  open,
  balances,
  onClose,
  onSend,
}: SendMoneyModalProps) {
  const [currency, setCurrency] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setRecipient("");
      setAmount("");
      setNote("");
      setError("");
      setLoading(false);
      return;
    }

    setCurrency((current) => current || balances[0]?.currency || "");
  }, [open, balances]);

  const availableBalance = useMemo(
    () =>
      balances.find((balance) => balance.currency === currency)
        ?.availableBalance ?? 0,
    [balances, currency]
  );

  const parsedAmount = Number(amount);

  const validRecipient = looksLikeEmail(recipient);

  const validSend =
    currency.length > 0 &&
    validRecipient &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= availableBalance;

  if (!open) return null;

  function closeModal() {
    if (loading) return;

    setRecipient("");
    setAmount("");
    setNote("");
    setError("");
    onClose();
  }

  function useMaximumBalance() {
    setAmount(availableBalance.toFixed(getDecimals(currency)));
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!currency) {
      setError("Select a currency.");
      return;
    }

    if (!recipient.trim()) {
      setError("Enter the recipient's ChainSave email address.");
      return;
    }

    if (!validRecipient) {
      setError(
        "Enter a valid ChainSave account email address."
      );
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount to send.");
      return;
    }

    if (parsedAmount > availableBalance) {
      setError(
        `You only have ${currency} ${formatAmount(
          currency,
          availableBalance
        )} available.`
      );
      return;
    }

    try {
      setLoading(true);

      await onSend({
        currency,
        amount: parsedAmount,
        recipient: recipient.trim(),
        note: note.trim() || undefined,
      });

      setRecipient("");
      setAmount("");
      setNote("");
      onClose();
    } catch (sendError) {
      console.error("Send money failed:", sendError);

      setError(
        sendError instanceof Error
          ? sendError.message
          : "The transfer could not be completed."
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
      aria-labelledby="send-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Send className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="send-modal-title"
                className="text-xl font-semibold text-gray-900"
              >
                Send Money
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Send funds to another ChainSave user or wallet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            aria-label="Close send money modal"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label
              htmlFor="send-recipient"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Recipient
            </label>

            <input
              id="send-recipient"
              type="text"
              value={recipient}
              onChange={(event) => {
                setRecipient(event.target.value);
                setError("");
              }}
              placeholder="recipient@example.com"
              disabled={loading}
              autoComplete="off"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              required
            />

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Enter the email address used by the recipient's ChainSave account.
              Direct Rootstock transfers are not enabled yet.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="send-currency"
                className="text-sm font-medium text-gray-700"
              >
                Currency
              </label>

              <p className="text-sm text-gray-500">
                Available:{" "}
                <span className="font-medium text-gray-900">
                  {currency || "—"}{" "}
                  {currency
                    ? formatAmount(currency, availableBalance)
                    : "0.00"}
                </span>
              </p>
            </div>

            <select
              id="send-currency"
              value={currency}
              onChange={(event) => {
                setCurrency(event.target.value);
                setAmount("");
                setError("");
              }}
              disabled={loading}
              className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              {balances.map((balance) => (
                <option key={balance.currency} value={balance.currency}>
                  {balance.currency}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="send-amount"
                className="block text-sm font-medium text-gray-700"
              >
                Amount ({currency || "Currency"})
              </label>

              <button
                type="button"
                onClick={useMaximumBalance}
                disabled={availableBalance <= 0 || loading}
                className="text-sm font-medium text-green-700 transition hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use maximum
              </button>
            </div>

            <input
              id="send-amount"
              type="number"
              min="0"
              max={availableBalance}
              step={currency === "RBTC" ? "0.00000001" : "0.01"}
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder={`Enter ${currency || ""} amount`}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="send-note"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Note
              <span className="ml-1 font-normal text-gray-400">
                Optional
              </span>
            </label>

            <textarea
              id="send-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What is this payment for?"
              disabled={loading}
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {note.length}/200
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <p className="text-sm leading-6">{error}</p>
            </div>
          )}

          <div className="rounded-xl bg-yellow-50 p-4">
            <p className="text-sm leading-6 text-yellow-800">
              Verify the recipient email carefully. Internal ChainSave transfers
              are processed immediately.
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Recipient</span>

              <span className="max-w-[240px] truncate font-medium text-gray-900">
                {recipient || "Not entered"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">Amount</span>

              <span className="font-semibold text-gray-900">
                {currency || "—"}{" "}
                {currency
                  ? formatAmount(
                      currency,
                      Number.isFinite(parsedAmount) ? parsedAmount : 0
                    )
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
              disabled={loading || !validSend}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />

              {loading ? "Sending..." : "Review and Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}