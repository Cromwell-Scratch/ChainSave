"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Eye,
  RefreshCw,
  Search,
  Snowflake,
  WalletCards,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

type WalletRow = {
  id: string;
  user_id: string;
  balance: number | string | null;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  frozen_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type WalletView = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  frozenAt: string | null;
};

type StatusFilter = "all" | "active" | "frozen";

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const loadWallets = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: walletData,
        error: walletError,
      } = await supabase
        .from("wallets")
        .select(`
          id,
          user_id,
          balance,
          currency,
          status,
          created_at,
          updated_at,
          frozen_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (walletError) {
        throw walletError;
      }

      const walletRows =
        (walletData as WalletRow[] | null) ?? [];

      const userIds = [
        ...new Set(
          walletRows.map(
            (wallet) => wallet.user_id
          )
        ),
      ];

      let profileRows: ProfileRow[] = [];

      if (userIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email
          `)
          .in("id", userIds);

        if (profileError) {
          throw profileError;
        }

        profileRows =
          (profileData as ProfileRow[] | null) ??
          [];
      }

      const profilesById = new Map(
        profileRows.map((profile) => [
          profile.id,
          profile,
        ])
      );

      const normalizedWallets: WalletView[] =
        walletRows.map((wallet) => {
          const profile = profilesById.get(
            wallet.user_id
          );

          return {
            id: wallet.id,
            userId: wallet.user_id,

            fullName:
              profile?.full_name?.trim() ||
              "No name provided",

            email:
              profile?.email?.trim() ||
              "No email available",

            balance: Number(wallet.balance ?? 0),

            currency:
              wallet.currency || "GHS",

            status:
              wallet.status || "active",

            createdAt: wallet.created_at,
            updatedAt: wallet.updated_at,
            frozenAt: wallet.frozen_at,
          };
        });

      setWallets(normalizedWallets);
    } catch (error) {
      console.error(
        "Unable to load admin wallets:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load wallets."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const filteredWallets = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return wallets.filter((wallet) => {
      const matchesStatus =
        statusFilter === "all" ||
        wallet.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        wallet.fullName,
        wallet.email,
        wallet.id,
        wallet.userId,
        wallet.currency,
        wallet.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [search, statusFilter, wallets]);

  const totalBalance = wallets.reduce(
    (total, wallet) =>
      total + wallet.balance,
    0
  );

  const activeWallets = wallets.filter(
    (wallet) =>
      wallet.status === "active"
  ).length;

  const frozenWallets = wallets.filter(
    (wallet) =>
      wallet.status === "frozen"
  ).length;

  function formatMoney(
    amount: number,
    currency: string = "GHS"
  ) {
    return `${currency} ${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "Not available";
    }

    return new Date(
      date
    ).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getInitials(wallet: WalletView) {
    const source =
      wallet.fullName !== "No name provided"
        ? wallet.fullName
        : wallet.email;

    return source
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <section className="p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Financial Operations
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-950">
            Wallet Management
          </h1>

          <p className="mt-2 text-gray-600">
            View and manage every ChainSave wallet.
          </p>
        </div>

        <button
          type="button"
          onClick={loadWallets}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {message && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {message}
        </p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-semibold text-gray-600">
            Total Wallets
          </p>

          <p className="mt-3 text-4xl font-bold text-gray-950">
            {wallets.length.toLocaleString()}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Wallets created on ChainSave
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gray-600">
            Total Balance
          </p>

          <p className="mt-3 text-3xl font-bold text-green-800">
            {formatMoney(totalBalance)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Combined wallet balance
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gray-600">
            Active Wallets
          </p>

          <p className="mt-3 text-4xl font-bold text-emerald-700">
            {activeWallets.toLocaleString()}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Wallets currently available
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-gray-600">
            Frozen Wallets
          </p>

          <p className="mt-3 text-4xl font-bold text-blue-700">
            {frozenWallets.toLocaleString()}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Wallets under restriction
          </p>
        </Card>
      </div>

      <Card className="mt-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-lg">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <Input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, email, wallet ID or user ID"
              className="pl-12 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["active", "Active"],
                ["frozen", "Frozen"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setStatusFilter(value)
                }
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === value
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        {loading ? (
          <div className="p-10 text-center text-gray-600">
            Loading wallets...
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <WalletCards className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-950">
              No wallets found
            </h2>

            <p className="mt-2 text-gray-500">
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    Wallet ID
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    Balance
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredWallets.map((wallet) => (
                  <tr
                    key={wallet.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">
                          {getInitials(wallet)}
                        </div>

                        <div>
                          <p className="font-bold text-gray-950">
                            {wallet.fullName}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {wallet.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-mono text-sm font-medium text-gray-800">
                        {wallet.id.slice(0, 8)}...
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        User:{" "}
                        {wallet.userId.slice(
                          0,
                          8
                        )}
                        ...
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold text-gray-950">
                        {formatMoney(
                          wallet.balance,
                          wallet.currency
                        )}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          wallet.status ===
                          "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {wallet.status ===
                          "frozen" && (
                          <Snowflake className="h-3.5 w-3.5" />
                        )}

                        {wallet.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-medium text-gray-900">
                        {formatDate(
                          wallet.createdAt
                        )}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/wallets/${wallet.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}