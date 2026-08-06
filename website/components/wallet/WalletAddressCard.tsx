"use client";

import { Check, Copy, ExternalLink, Link2, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface WalletAddressCardProps {
  address?: string | null;
  network?: string | null;
  provider?: string | null;
  isActive?: boolean;
  explorerUrl?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

function shortenAddress(address: string) {
  if (address.length <= 16) return address;

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function WalletAddressCard({
  address,
  network = "ROOTSTOCK",
  provider,
  isActive = false,
  explorerUrl,
  onConnect,
  onDisconnect,
}: WalletAddressCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Unable to copy wallet address:", error);
    }
  }

  const connected = Boolean(address && isActive);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <Link2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Blockchain Wallet
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  Optional
                </span>
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Connect only if you want direct Rootstock access.
              </p>
            </div>
          </div>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            connected
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-gray-400"
            }`}
          />

          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      {connected && address ? (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Network
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {network}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Provider
              </p>

              <p className="mt-2 font-semibold capitalize text-gray-900">
                {provider ?? "External wallet"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Wallet Address
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className="break-all font-mono text-sm text-gray-900"
                title={address}
              >
                {shortenAddress(address)}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyAddress}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}

                  {copied ? "Copied" : "Copy"}
                </button>

                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Explorer
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl bg-green-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />

            <p className="text-sm leading-6 text-green-800">
              ChainSave stores only your public wallet address. Never share or
              store your private key or recovery phrase inside the application.
            </p>
          </div>

          {onDisconnect && (
            <button
              type="button"
              onClick={onDisconnect}
              className="mt-5 rounded-xl border border-red-200 px-4 py-3 font-medium text-red-600 transition hover:bg-red-50"
            >
              Disconnect Wallet
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-700">
            <Link2 className="h-6 w-6" />
          </div>

          <h3 className="mt-4 font-semibold text-gray-900">
            Connect a Rootstock wallet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            This is optional. Your ChainSave Wallet works without a blockchain wallet.
            Connect an external wallet only for direct Rootstock access, explorer
            verification and future RBTC features.
          </p>

          <button
            type="button"
            onClick={onConnect}
            disabled={!onConnect}
            className="mt-5 rounded-xl bg-orange-600 px-5 py-3 font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </section>
  );
}