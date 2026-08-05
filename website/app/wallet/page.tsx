"use client";

import { useRootstockWallet } from "@/hooks/useRootstockWallet";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
  WalletCards,
} from "lucide-react";



import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import WalletAddressCard from "@/components/wallet/WalletAddressCard";
import LedgerActivity, {
  type LedgerEntry,
} from "@/components/wallet/LedgerActivity";
import ConvertCurrencyModal from "@/components/wallet/ConvertCurrencyModal";
import SendMoneyModal from "@/components/wallet/SendMoneyModal";
import DepositModal from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";

import { supabase } from "@/lib/supabase";
import {
  convert,
  getBalances,
  getLedger,
  getUserPreferences,
  getWallet,
  getWalletAddress,
  sendInternal,
  type Wallet,
  type WalletAddress,
  type WalletBalance,
  type WalletLedgerEntry,
  type UserPreference,
} from "@/lib/services/walletService";
import { findWalletByEmail } from "@/lib/services/userService";

type ActiveModal =
  | null
  | "deposit"
  | "withdraw"
  | "convert"
  | "send";

type ExchangeRateRow = {
  base_currency: string;
  quote_currency: string;
  rate: number | string;
};

const SUPPORTED_CURRENCIES = ["GHS", "NGN", "KES", "RBTC"] as const;

const currencyMeta: Record<
  string,
  { name: string; symbol: string; decimals: number }
> = {
  GHS: { name: "Ghana Cedi", symbol: "GH₵", decimals: 2 },
  NGN: { name: "Nigerian Naira", symbol: "₦", decimals: 2 },
  KES: { name: "Kenyan Shilling", symbol: "KSh", decimals: 2 },
  RBTC: { name: "Rootstock Bitcoin", symbol: "₿", decimals: 8 },
};

function formatAmount(currency: string, amount: number) {
  const decimals = currencyMeta[currency]?.decimals ?? 2;

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const value = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string | number;
      shortMessage?: string;
    };

    return [
      value.shortMessage,
      value.message,
      value.details,
      value.hint,
      value.code
        ? `Error code: ${value.code}`
        : undefined,
    ]
      .filter(Boolean)
      .join(" — ");
  }

  return String(error || "Unknown error");
}

function WalletPageContent() {
const {
  address: connectedWalletAddress,
  normalizedAddress,
  isConnected,
  isRootstockTestnet,
  chainId,
  walletProvider,
  explorerUrl,
  connectWallet,
  disconnectWallet,
  getBalance,
} = useRootstockWallet();


  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [connectingRootstock, setConnectingRootstock] =
  useState(false);

const [rootstockBalance, setRootstockBalance] =
  useState("0");

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([]);
  const [address, setAddress] = useState<WalletAddress | null>(null);
  const [preferences, setPreferences] = useState<UserPreference>({
    display_currency: "GHS",
    default_payment_method: "wallet",
  });

  const [rates, setRates] = useState<Record<string, number>>({});
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [showOtherBalances, setShowOtherBalances] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [notice, setNotice] = useState("");
 

  const loadWallet = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      const walletData = await getWallet();

      const [
        balancesData,
        ledgerData,
        addressData,
        preferenceData,
        rateResponse,
      ] = await Promise.all([
        getBalances(walletData.id),
        getLedger(walletData.id, 12),
        getWalletAddress(walletData.id),
        getUserPreferences(),
        supabase
          .from("exchange_rates")
          .select("base_currency, quote_currency, rate"),
      ]);

      if (rateResponse.error) {
        console.error("Exchange-rate loading error:", rateResponse.error);
      }

      const rateMap: Record<string, number> = {};

      ((rateResponse.data ?? []) as ExchangeRateRow[]).forEach((row) => {
        rateMap[`${row.base_currency}_${row.quote_currency}`] = Number(row.rate);
      });

      setWallet(walletData);
      setBalances(balancesData);
      setLedger(ledgerData);
      setAddress(addressData);
const savedBalance = Number(
  addressData?.metadata?.balance ?? "0"
);

setRootstockBalance(
  addressData?.is_active && Number.isFinite(savedBalance)
    ? String(savedBalance)
    : "0"
);
      setPreferences(preferenceData);
      setRates(rateMap);
    } catch (loadError) {
      console.error("Unable to load wallet:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your wallet."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);
  

  useEffect(() => {
  const depositStatus = searchParams.get("deposit");

  if (!depositStatus) return;

  let timer: ReturnType<typeof setTimeout> | undefined;

  async function handleDepositResult() {
    if (depositStatus === "success") {
      await loadWallet(true);

      setError("");
      setNotice(
        "Deposit successful. Your ChainSave wallet has been credited."
      );
    }

    if (depositStatus === "failed") {
      setNotice("");
      setError(
        "Payment verification failed. Your wallet was not credited."
      );
    }

    timer = setTimeout(() => {
      setNotice("");
      setError("");

      router.replace("/wallet", {
        scroll: false,
      });
    }, 5000);
  }

  void handleDepositResult();

  return () => {
    if (timer) {
      clearTimeout(timer);
    }
  };
}, [loadWallet, router, searchParams]);

  const displayCurrency = preferences.display_currency || "GHS";

  const getRate = useCallback(
    (fromCurrency: string, toCurrency: string) => {
      if (fromCurrency === toCurrency) return 1;

      const direct = rates[`${fromCurrency}_${toCurrency}`];
      if (direct && direct > 0) return direct;

      const inverse = rates[`${toCurrency}_${fromCurrency}`];
      if (inverse && inverse > 0) return 1 / inverse;

      return null;
    },
    [rates]
  );

  const primaryBalance = useMemo(() => {
    return balances.find((balance) => balance.currency === displayCurrency);
  }, [balances, displayCurrency]);

  const availablePortfolio = useMemo(() => {
    return balances.reduce((total, balance) => {
      const rate = getRate(balance.currency, displayCurrency);
      if (rate === null) return total;

      return total + Number(balance.available_balance) * rate;
    }, 0);
  }, [balances, displayCurrency, getRate]);

  const lockedPortfolio = useMemo(() => {
    return balances.reduce((total, balance) => {
      const rate = getRate(balance.currency, displayCurrency);
      if (rate === null) return total;

      return total + Number(balance.locked_balance) * rate;
    }, 0);
  }, [balances, displayCurrency, getRate]);

  const totalPortfolio = availablePortfolio + lockedPortfolio;

  const rbtcEquivalent = useMemo(() => {
    if (displayCurrency === "RBTC") return totalPortfolio;

    const rate = getRate(displayCurrency, "RBTC");
    return rate === null ? null : totalPortfolio * rate;
  }, [displayCurrency, getRate, totalPortfolio]);

  const fallbackEquivalent = useMemo(() => {
    if (displayCurrency !== "RBTC") return null;

    const rate = getRate("RBTC", "GHS");
    return rate === null ? null : totalPortfolio * rate;
  }, [displayCurrency, getRate, totalPortfolio]);

  const otherBalances = useMemo(() => {
    return balances.filter((balance) => balance.currency !== displayCurrency);
  }, [balances, displayCurrency]);

  const convertibleBalances = useMemo(
    () =>
      balances.map((balance) => ({
        currency: balance.currency,
        availableBalance: Number(balance.available_balance),
      })),
    [balances]
  );

  const ledgerEntries = useMemo(
    () =>
      ledger.map((entry) => ({
        ...entry,
        amount: Number(entry.amount),
        balance_after: Number(entry.balance_after),
      })) as LedgerEntry[],
    [ledger]
  );

  async function changeDisplayCurrency(currency: string) {
    try {
      setSavingCurrency(true);
      setNotice("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("Your session has expired.");

      const { error: preferenceError } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            display_currency: currency,
          },
          { onConflict: "user_id" }
        );

      if (preferenceError) throw preferenceError;

      setPreferences((current) => ({
        ...current,
        display_currency: currency,
      }));

      setNotice(`Wallet display currency changed to ${currency}.`);
    } catch (currencyError) {
      console.error("Unable to change currency:", currencyError);
      setError(
        currencyError instanceof Error
          ? currencyError.message
          : "Unable to change wallet currency."
      );
    } finally {
      setSavingCurrency(false);
    }
  }

const saveConnectedRootstockWallet = useCallback(async () => {
  try {
    if (
      !isConnected ||
      !connectedWalletAddress ||
      !walletProvider ||
      !wallet?.id
    ) {
      return;
    }

    setConnectingRootstock(true);
    setError("");
    setNotice("");

    if (!isRootstockTestnet) {
  throw new Error(
    "Please switch your connected wallet to Rootstock Testnet."
  );
}

const liveBalance = await getBalance();

if (!normalizedAddress) {
  throw new Error(
    "The connected wallet address is unavailable."
  );
}
    const {
      data: existingAddress,
      error: existingAddressError,
    } = await supabase
      .from("wallet_addresses")
      .select("id")
      .eq("wallet_id", wallet.id)
      .eq("network", "rootstock")
      .maybeSingle();

    if (existingAddressError) {
      throw existingAddressError;
    }

    const now = new Date().toISOString();

    const addressPayload = {
      wallet_id: wallet.id,
      network: "rootstock",
      address: normalizedAddress,
      is_primary: true,
      is_active: true,
      metadata: {
        chain_id: Number(chainId),
        native_currency: "tRBTC",
        balance: liveBalance,
        explorer_url: explorerUrl,
        provider: "Reown AppKit",
        connected_at: now,
      },
      updated_at: now,
    };

    if (existingAddress) {
      const { error: updateError } = await supabase
        .from("wallet_addresses")
        .update(addressPayload)
        .eq("id", existingAddress.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("wallet_addresses")
        .insert({
          ...addressPayload,
          created_at: now,
        });

      if (insertError) {
        throw insertError;
      }
    }

    setAddress((currentAddress) => ({
  ...(currentAddress ?? {}),
  ...addressPayload,
  id: existingAddress?.id ?? currentAddress?.id,
} as WalletAddress));

    setRootstockBalance(liveBalance);

    setNotice(
      `Rootstock wallet connected successfully. Balance: ${Number(
        liveBalance
      ).toFixed(8)} tRBTC.`
    );
  } catch (connectionError) {
    const message =
      getErrorMessage(connectionError) ||
      "Unable to save the connected Rootstock wallet.";

    console.log(
      "Rootstock wallet synchronization failed:",
      connectionError
    );

    setError(message);
  } finally {
    setConnectingRootstock(false);
  }
}, [
  chainId,
  connectedWalletAddress,
  explorerUrl,
  getBalance,
  isConnected,
  isRootstockTestnet,
  normalizedAddress,
  wallet,
  walletProvider,
]);
  useEffect(() => {
  if (
    !loading &&
    isConnected &&
    connectedWalletAddress &&
    walletProvider &&
    wallet?.id
  ) {
    void saveConnectedRootstockWallet();
  }
}, [
  connectedWalletAddress,
  isConnected,
  loading,
  saveConnectedRootstockWallet,
  wallet,
  walletProvider,
]);

async function handleDisconnectRootstockWallet() {
  try {
    setConnectingRootstock(true);
    setError("");
    setNotice("");

    if (!wallet?.id) {
      throw new Error(
        "Your ChainSave wallet could not be found."
      );
    }

    // Disconnect the active Reown EVM wallet session.
    await disconnectWallet();

    // Mark the saved ChainSave wallet address as inactive.
    const { error: disconnectError } = await supabase
      .from("wallet_addresses")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_id", wallet.id)
      .eq("network", "rootstock");

    if (disconnectError) {
      throw disconnectError;
    }

    setAddress((currentAddress) =>
      currentAddress
        ? {
            ...currentAddress,
            is_active: false,
          }
        : null
    );

    setRootstockBalance("0");

    setNotice(
      "Rootstock wallet disconnected from ChainSave."
    );

    await loadWallet(true);
  } catch (disconnectError) {
    console.error(
      "Unable to disconnect Rootstock wallet:",
      disconnectError
    );

    setError(
      disconnectError instanceof Error
        ? disconnectError.message
        : "Unable to disconnect the Rootstock wallet."
    );
  } finally {
    setConnectingRootstock(false);
  }
}

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <Topbar />
            <div className="flex min-h-[70vh] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
                <p className="mt-4 text-gray-600">Loading wallet...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="mx-auto max-w-7xl space-y-7 px-5 py-8 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-600">
                  Financial Hub
                </p>

                <h1 className="mt-2 text-4xl font-bold text-gray-900">
                  Wallet
                </h1>

                <p className="mt-2 text-gray-500">
                  Manage your ChainSave balance and financial activity.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadWallet(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 shadow-sm"
            >
                 <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                  !
                </div>

                   <div>
                   <p className="font-semibold">Something went wrong</p>

                   <p className="mt-1 text-sm">{error}</p>
                 </div>
               </div>
              )}

            {notice && (
               <div
                  role="status"
                  className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-800 shadow-sm"
           >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                 ✓
                </div>

           <div>
              <p className="font-semibold">Success</p>

              <p className="mt-1 text-sm">{notice}</p>
           </div>
         </div>
       )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 via-green-600 to-lime-500 p-7 text-white shadow-xl">
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />

                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-100">
                    ChainSave Wallet
                  </p>

                  <p className="mt-5 text-sm text-green-100">
                    Available portfolio balance
                  </p>

                  <h2 className="mt-2 text-4xl font-bold sm:text-5xl">
                    {formatAmount(displayCurrency, availablePortfolio)}
                  </h2>

                  <p className="mt-3 text-sm font-medium text-green-50">
                    {displayCurrency === "RBTC"
                      ? fallbackEquivalent === null
                        ? "GHS equivalent unavailable"
                        : `≈ ${formatAmount("GHS", fallbackEquivalent)}`
                      : rbtcEquivalent === null
                        ? "RBTC equivalent unavailable"
                        : `≈ ${formatAmount("RBTC", rbtcEquivalent)}`}
                  </p>

                  <div className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-green-100">Wallet ID</p>
                      <p className="mt-1 font-semibold">
                        {wallet?.id.slice(0, 8)}...
                      </p>
                    </div>

                    <div>
                      <p className="text-green-100">Currency</p>
                      <p className="mt-1 font-semibold">{displayCurrency}</p>
                    </div>

                    <div>
                      <p className="text-green-100">Status</p>
                      <p className="mt-1 font-semibold">Active</p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setActiveModal("deposit")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-green-700 transition hover:bg-green-50"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Deposit
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                        if (displayCurrency !== "GHS") {
                        setNotice(
                           "Paystack withdrawals currently use your GHS balance. Change the wallet currency to GHS before withdrawing."
                   );
                     return;
                         }

                        setActiveModal("withdraw");
                        }}
                         className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                         >
                           <ArrowUpFromLine className="h-4 w-4" />
                           Withdraw
                        </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal("convert")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      Convert
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal("send")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <WalletCards className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Wallet Currency
                    </h2>

                    <p className="text-sm text-gray-500">
                      Choose what you see across ChainSave.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Current currency
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {currencyMeta[displayCurrency]?.symbol} {displayCurrency}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {currencyMeta[displayCurrency]?.name}
                  </p>
                </div>

                <label className="mt-5 block text-sm font-semibold text-gray-700">
                  Change currency
                </label>

                <select
                  value={displayCurrency}
                  onChange={(event) =>
                    void changeDisplayCurrency(event.target.value)
                  }
                  disabled={savingCurrency}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:opacity-60"
                >
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency} — {currencyMeta[currency].name}
                    </option>
                  ))}
                </select>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Available
                    </p>
                    <p className="mt-2 font-bold text-gray-900">
                      {formatAmount(
                        displayCurrency,
                        Number(primaryBalance?.available_balance ?? 0)
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Locked
                    </p>
                    <p className="mt-2 font-bold text-gray-900">
                      {formatAmount(
                        displayCurrency,
                        Number(primaryBalance?.locked_balance ?? 0)
                      )}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                onClick={() => setShowOtherBalances((current) => !current)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Other Currency Balances
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Hidden by default to keep your wallet simple.
                  </p>
                </div>

                {showOtherBalances ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {showOtherBalances && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {otherBalances.map((balance) => (
                    <div
                      key={balance.currency}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900">
                            {balance.currency}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {currencyMeta[balance.currency]?.name}
                          </p>
                        </div>

                        <p className="font-bold text-gray-900">
                          {formatAmount(
                            balance.currency,
                            Number(balance.available_balance) +
                              Number(balance.locked_balance)
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <WalletAddressCard
  network="Rootstock Testnet"
  address={
    address?.is_active
      ? address.address
      : null
  }
  isActive={Boolean(
    address?.address && address?.is_active
  )}
  provider="Reown AppKit"
  explorerUrl={
    address?.address
      ? `https://explorer.testnet.rootstock.io/address/${address.address}`
      : undefined
  }
onConnect={() => {
  void connectWallet();
}}
onDisconnect={() => {
  if (!connectingRootstock) {
    void handleDisconnectRootstockWallet();
  }
}}
/>
{address?.is_active && (
  <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
    <p className="text-sm font-medium text-orange-700">
      Rootstock Testnet Balance
    </p>

    <p className="mt-1 text-xl font-bold text-orange-900">
      {Number(rootstockBalance).toFixed(8)} tRBTC
    </p>
  </div>
)}

            <LedgerActivity entries={ledgerEntries} />

            <ConvertCurrencyModal
              open={activeModal === "convert"}
              balances={convertibleBalances}
              rates={rates}
              onClose={() => setActiveModal(null)}
              onConvert={async (data) => {
                await convert(
                  data.fromCurrency,
                  data.toCurrency,
                  data.amount,
                  data.convertedAmount
                );

                setNotice("Currency converted successfully.");
                await loadWallet(true);
              }}
            />

            <SendMoneyModal
              open={activeModal === "send"}
              balances={convertibleBalances}
              onClose={() => setActiveModal(null)}
              onSend={async (data) => {
                if (data.recipient.startsWith("0x")) {
                  throw new Error(
                    "Rootstock address transfers are not enabled yet. Use a ChainSave email."
                  );
                }

                const receiverWalletId = await findWalletByEmail(data.recipient);

                await sendInternal(
                  receiverWalletId,
                  data.currency,
                  data.amount,
                  data.note || `Transfer to ${data.recipient}`
                );

                setNotice("Transfer completed successfully.");
                await loadWallet(true);
              }}
            />
            <DepositModal
  open={activeModal === "deposit"}
  currency={displayCurrency}
  onClose={() => setActiveModal(null)}
  onDeposit={async (amount) => {
    if (displayCurrency === "RBTC") {
      throw new Error(
        "RBTC deposits will use the Rootstock wallet, not Paystack."
      );
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.access_token
    ) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    const response = await fetch(
      "/api/paystack/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount,
          currency: displayCurrency,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ??
        "Unable to initialize Paystack payment."
      );
    }

    window.location.assign(
      result.authorizationUrl
    );
  }}
/>

             <WithdrawModal
  open={activeModal === "withdraw"}
  currency="GHS"
  availableBalance={Number(
    balances.find(
      (balance) => balance.currency === "GHS"
    )?.available_balance ?? 0
  )}
  onClose={() => setActiveModal(null)}
  onWithdraw={async (data) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.access_token
    ) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    const response = await fetch(
      "/api/paystack/withdraw",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...data,
          currency: "GHS",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ??
        "Unable to process withdrawal."
      );
    }

    setNotice(result.message);
    await loadWallet(true);
  }}
/>
          </section>
        </div>
      </div>
    </main>
  );
}
export default function WalletPage() {
  return (
    <Suspense fallback={<WalletPageFallback />}>
      <WalletPageContent />
    </Suspense>
  );
}

function WalletPageFallback() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />

              <p className="mt-4 text-gray-600">
                Loading wallet...
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}