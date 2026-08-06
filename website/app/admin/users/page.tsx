"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  UserX,
  WalletCards,
  X,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

type UserRole = "user" | "admin";
type UserStatus = "active" | "suspended" | string;
type RoleFilter = "all" | "user" | "admin";
type StatusFilter = "all" | "active" | "suspended";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole | string;
  status: UserStatus;
  created_at: string | null;
};

type WalletRow = {
  id: string;
  user_id: string;
  status: string | null;
};

type WalletBalanceRow = {
  wallet_id: string;
  currency: string;
  available_balance: number | string | null;
  locked_balance: number | string | null;
};

type CircleRow = {
  id: string;
  owner_id: string;
  status: string | null;
};

type UserView = Profile & {
  walletId: string | null;
  walletStatus: string | null;
  walletBalance: number;
  walletCurrency: string;
  circleCount: number;
};

type SelectedUserSummary = {
  transactions: number;
  activeCircles: number;
  totalCircles: number;
};

const EMPTY_SUMMARY: SelectedUserSummary = {
  transactions: 0,
  activeCircles: 0,
  totalCircles: 0,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("all");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [selectedUser, setSelectedUser] =
    useState<UserView | null>(null);

  const [selectedSummary, setSelectedSummary] =
    useState<SelectedUserSummary>(EMPTY_SUMMARY);

  const [drawerLoading, setDrawerLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [currentAdminId, setCurrentAdminId] =
    useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setCurrentAdminId(currentUser?.id ?? null);

      const [
        profilesResult,
        walletsResult,
        balancesResult,
        circlesResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              email,
              phone,
              avatar_url,
              role,
              status,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("wallets")
          .select("id, user_id, status"),

        supabase
          .from("wallet_balances")
          .select(
            `
              wallet_id,
              currency,
              available_balance,
              locked_balance
            `
          )
          .eq("currency", "GHS"),

        supabase
          .from("circles")
          .select("id, owner_id, status"),
      ]);

      const firstError =
        profilesResult.error ||
        walletsResult.error ||
        balancesResult.error ||
        circlesResult.error;

      if (firstError) {
        throw firstError;
      }

      const profiles =
        (profilesResult.data as Profile[] | null) ??
        [];

      const wallets =
        (walletsResult.data as WalletRow[] | null) ??
        [];

      const balances =
        (balancesResult.data as
          | WalletBalanceRow[]
          | null) ?? [];

      const circles =
        (circlesResult.data as CircleRow[] | null) ??
        [];

      const walletsByUser = new Map(
        wallets.map((wallet) => [
          wallet.user_id,
          wallet,
        ])
      );

      const balancesByWallet = new Map(
        balances.map((balance) => [
          balance.wallet_id,
          balance,
        ])
      );

      const circleCounts = new Map<string, number>();

      for (const circle of circles) {
        circleCounts.set(
          circle.owner_id,
          (circleCounts.get(circle.owner_id) ?? 0) +
            1
        );
      }

      setUsers(
        profiles.map((profile) => {
          const wallet = walletsByUser.get(
            profile.id
          );

          const balance = wallet
            ? balancesByWallet.get(wallet.id)
            : null;

          return {
            ...profile,
            walletId: wallet?.id ?? null,
            walletStatus:
              wallet?.status ?? null,
            walletBalance:
              Number(
                balance?.available_balance ?? 0
              ) +
              Number(
                balance?.locked_balance ?? 0
              ),
            walletCurrency:
              balance?.currency ?? "GHS",
            circleCount:
              circleCounts.get(profile.id) ?? 0,
          };
        })
      );
    } catch (error) {
      console.error(
        "Unable to load admin users:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: users.length,
      active: users.filter(
        (user) => user.status === "active"
      ).length,
      suspended: users.filter(
        (user) => user.status === "suspended"
      ).length,
      admins: users.filter(
        (user) => user.role === "admin"
      ).length,
      newToday: users.filter((user) => {
        if (!user.created_at) {
          return false;
        }

        return (
          new Date(user.created_at).getTime() >=
          today.getTime()
        );
      }).length,
      verified: users.filter(
        (user) =>
          user.status === "active" &&
          Boolean(user.email)
      ).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        user.status === statusFilter;

      if (!matchesRole || !matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        user.full_name ?? "",
        user.email ?? "",
        user.phone ?? "",
        user.id,
        user.walletId ?? "",
        user.role,
        user.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    roleFilter,
    search,
    statusFilter,
    users,
  ]);

  async function openUserDrawer(user: UserView) {
    setSelectedUser(user);
    setSelectedSummary(EMPTY_SUMMARY);
    setDrawerLoading(true);

    try {
      const [
        transactionsResult,
        circlesResult,
      ] = await Promise.all([
        user.walletId
          ? supabase
              .from("wallet_transactions")
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq("wallet_id", user.walletId)
          : Promise.resolve({
              count: 0,
              error: null,
            }),

        supabase
          .from("circles")
          .select("id, status")
          .eq("owner_id", user.id),
      ]);

      if (transactionsResult.error) {
        throw transactionsResult.error;
      }

      if (circlesResult.error) {
        throw circlesResult.error;
      }

      const circles =
        (circlesResult.data as
          | Array<{
              id: string;
              status: string | null;
            }>
          | null) ?? [];

      setSelectedSummary({
        transactions:
          transactionsResult.count ?? 0,
        totalCircles: circles.length,
        activeCircles: circles.filter(
          (circle) =>
            circle.status === "active"
        ).length,
      });
    } catch (error) {
      console.error(
        "Unable to load user summary:",
        error
      );
    } finally {
      setDrawerLoading(false);
    }
  }

  async function updateUser(
    user: UserView,
    update: {
      status?: "active" | "suspended";
      role?: "user" | "admin";
    }
  ) {
    setMessage("");
    setSuccess("");
    setActionLoading(user.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your admin session has expired."
        );
      }

      const response = await fetch(
        `/api/admin/users/${user.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(update),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update the user."
        );
      }

      setSuccess(
        result.message ||
          "User updated successfully."
      );

      await loadUsers();

      setSelectedUser((current) =>
        current?.id === user.id
          ? {
              ...current,
              ...update,
            }
          : current
      );
    } catch (error) {
      console.error(
        "Unable to update user:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the user."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function sendPasswordReset(
    user: UserView
  ) {
    if (!user.email) {
      setMessage(
        "This user does not have an email address."
      );
      return;
    }

    setMessage("");
    setSuccess("");
    setActionLoading(`reset-${user.id}`);

    try {
      const redirectTo =
        `${window.location.origin}/login`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          user.email,
          { redirectTo }
        );

      if (error) {
        throw error;
      }

      setSuccess(
        `Password reset email sent to ${user.email}.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the reset email."
      );
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6 lg:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-4xl">
            User Management
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            Search accounts, review balances and
            manage access across ChainSave.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {message && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {message}
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-800">
          <CheckCircle2 className="h-5 w-5" />
          {success}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Total Users"
          value={stats.total}
          icon={Users}
          classes="bg-blue-100 text-blue-700"
        />

        <StatCard
          label="Active"
          value={stats.active}
          icon={UserCheck}
          classes="bg-green-100 text-green-700"
        />

        <StatCard
          label="Suspended"
          value={stats.suspended}
          icon={UserX}
          classes="bg-red-100 text-red-700"
        />

        <StatCard
          label="Admins"
          value={stats.admins}
          icon={ShieldCheck}
          classes="bg-purple-100 text-purple-700"
        />

        <StatCard
          label="New Today"
          value={stats.newToday}
          icon={UserRound}
          classes="bg-orange-100 text-orange-700"
        />

        <StatCard
          label="Verified"
          value={stats.verified}
          icon={CheckCircle2}
          classes="bg-emerald-100 text-emerald-700"
        />
      </div>

      <Card className="mt-8">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <Input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, email, phone, wallet ID or user ID"
              className="pl-12 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value as RoleFilter
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
          >
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
          >
            <option value="all">
              All statuses
            </option>
            <option value="active">Active</option>
            <option value="suspended">
              Suspended
            </option>
          </select>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Showing {filteredUsers.length} of{" "}
          {users.length} users
        </p>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl bg-gray-100"
                />
              )
            )}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UserX className="mx-auto h-9 w-9 text-gray-400" />

            <h2 className="mt-4 text-xl font-bold text-gray-950">
              No users found
            </h2>

            <p className="mt-2 text-gray-500">
              Change the search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      "User",
                      "Role",
                      "Status",
                      "Balance",
                      "Circles",
                      "Joined",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 last:text-right"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-5">
                        <UserIdentity user={user} />
                      </td>

                      <td className="px-6 py-5">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge
                          status={user.status}
                        />
                      </td>

                      <td className="px-6 py-5 font-bold text-gray-950">
                        {formatMoney(
                          user.walletBalance,
                          user.walletCurrency
                        )}
                      </td>

                      <td className="px-6 py-5 font-semibold text-gray-900">
                        {user.circleCount}
                      </td>

                      <td className="px-6 py-5 text-gray-700">
                        {formatDate(
                          user.created_at
                        )}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            void openUserDrawer(user)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-200 lg:hidden">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() =>
                    void openUserDrawer(user)
                  }
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <UserIdentity user={user} />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <RoleBadge role={user.role} />
                      <StatusBadge
                        status={user.status}
                      />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-gray-800">
                      {formatMoney(
                        user.walletBalance,
                        user.walletCurrency
                      )}{" "}
                      · {user.circleCount} circles
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {selectedUser && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close user details"
            onClick={() =>
              setSelectedUser(null)
            }
            className="absolute inset-0 bg-black/45"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-sm font-semibold text-green-700">
                  User Profile
                </p>

                <h2 className="text-xl font-bold text-gray-950">
                  Account Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedUser(null)
                }
                className="rounded-xl border border-gray-200 p-2 text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <Card>
                <UserIdentity
                  user={selectedUser}
                  large
                />

                <div className="mt-5 flex flex-wrap gap-2">
                  <RoleBadge
                    role={selectedUser.role}
                  />
                  <StatusBadge
                    status={selectedUser.status}
                  />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Detail
                    label="Phone"
                    value={
                      selectedUser.phone ||
                      "Not provided"
                    }
                  />

                  <Detail
                    label="Joined"
                    value={formatDate(
                      selectedUser.created_at
                    )}
                  />

                  <Detail
                    label="User ID"
                    value={selectedUser.id}
                  />

                  <Detail
                    label="Wallet ID"
                    value={
                      selectedUser.walletId ||
                      "No wallet"
                    }
                  />
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryCard
                  label="Wallet Balance"
                  value={formatMoney(
                    selectedUser.walletBalance,
                    selectedUser.walletCurrency
                  )}
                />

                <SummaryCard
                  label="Circles"
                  value={
                    drawerLoading
                      ? "..."
                      : `${selectedSummary.activeCircles}/${selectedSummary.totalCircles}`
                  }
                />

                <SummaryCard
                  label="Transactions"
                  value={
                    drawerLoading
                      ? "..."
                      : String(
                          selectedSummary.transactions
                        )
                  }
                />
              </div>

              <Card>
                <h3 className="text-xl font-bold text-gray-950">
                  Quick Actions
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {selectedUser.walletId && (
                    <Link
                      href={`/admin/wallets/${selectedUser.walletId}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
                    >
                      <WalletCards className="h-5 w-5" />
                      View Wallet
                    </Link>
                  )}

                  <Link
                    href={`/admin/notifications/create?user=${selectedUser.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    <Bell className="h-5 w-5" />
                    Notify User
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      void sendPasswordReset(
                        selectedUser
                      )
                    }
                    disabled={
                      actionLoading ===
                      `reset-${selectedUser.id}`
                    }
                    className="rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    {actionLoading ===
                    `reset-${selectedUser.id}`
                      ? "Sending..."
                      : "Send Password Reset"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void updateUser(
                        selectedUser,
                        {
                          status:
                            selectedUser.status ===
                            "active"
                              ? "suspended"
                              : "active",
                        }
                      )
                    }
                    disabled={
                      actionLoading ===
                        selectedUser.id ||
                      selectedUser.id ===
                        currentAdminId
                    }
                    className={`rounded-xl px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      selectedUser.status ===
                      "active"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {selectedUser.status ===
                    "active"
                      ? "Suspend Account"
                      : "Activate Account"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void updateUser(
                        selectedUser,
                        {
                          role:
                            selectedUser.role ===
                            "admin"
                              ? "user"
                              : "admin",
                        }
                      )
                    }
                    disabled={
                      actionLoading ===
                        selectedUser.id ||
                      selectedUser.id ===
                        currentAdminId
                    }
                    className="rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                  >
                    {selectedUser.role === "admin"
                      ? "Remove Admin Role"
                      : "Promote to Admin"}
                  </button>
                </div>

                {selectedUser.id ===
                  currentAdminId && (
                  <p className="mt-4 rounded-xl bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
                    You cannot suspend or demote your
                    own active admin account.
                  </p>
                )}
              </Card>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  classes,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
  classes: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-600">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-950">
            {value.toLocaleString()}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${classes}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function UserIdentity({
  user,
  large = false,
}: {
  user: UserView;
  large?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-800 ${
          large
            ? "h-16 w-16 text-xl"
            : "h-11 w-11"
        }`}
      >
        {getInitials(user)}
      </div>

      <div className="min-w-0">
        <p
          className={`truncate font-bold text-gray-950 ${
            large ? "text-xl" : ""
          }`}
        >
          {user.full_name ||
            "No name provided"}
        </p>

        <p className="mt-1 truncate text-sm text-gray-500">
          {user.email ||
            "No email available"}
        </p>
      </div>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${
        role === "admin"
          ? "bg-purple-100 text-purple-800"
          : "bg-blue-100 text-blue-800"
      }`}
    >
      {role === "admin" ? (
        <ShieldCheck className="h-3.5 w-3.5" />
      ) : (
        <UserRound className="h-3.5 w-3.5" />
      )}

      {role}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
        status === "active"
          ? "bg-green-100 text-green-800"
          : status === "suspended"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {status}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-all font-semibold text-gray-950">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card>
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-bold text-gray-950">
        {value}
      </p>
    </Card>
  );
}

function getInitials(user: Profile) {
  const source =
    user.full_name?.trim() ||
    user.email?.trim() ||
    "User";

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: string | null) {
  if (!date) {
    return "Unavailable";
  }

  return new Date(date).toLocaleDateString(
    "en-GH",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatMoney(
  amount: number,
  currency: string
) {
  return `${currency} ${Number(
    amount || 0
  ).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
