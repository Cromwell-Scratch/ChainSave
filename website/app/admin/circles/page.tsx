"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Eye,
  Layers3,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type CircleStatus =
  | "upcoming"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | string;

type StatusFilter =
  | "all"
  | "upcoming"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

type PrivacyFilter =
  | "all"
  | "private"
  | "public";

type CircleRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  contribution_amount: number | string;
  currency: string;
  contribution_frequency: string;
  max_members: number | string;
  privacy: string;
  started: boolean | null;
  completed: boolean | null;
  status: CircleStatus | null;
  total_saved: number | string | null;
  current_round: number | string | null;
  contract_address: string | null;
  creation_tx_hash: string | null;
  blockchain_status: string | null;
  blockchain_network: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type MemberRow = {
  circle_id: string;
  status: string;
};

type CircleView = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  name: string;
  description: string | null;
  contributionAmount: number;
  currency: string;
  frequency: string;
  maxMembers: number;
  acceptedMembers: number;
  privacy: string;
  status: CircleStatus;
  totalSaved: number;
  currentRound: number;
  contractAddress: string | null;
  creationTxHash: string | null;
  blockchainStatus: string | null;
  blockchainNetwork: string | null;
  createdAt: string | null;
};

const ROOTSTOCK_EXPLORER =
  process.env.NEXT_PUBLIC_ROOTSTOCK_EXPLORER_URL ??
  "https://explorer.testnet.rootstock.io";

export default function AdminCirclesPage() {
  const [circles, setCircles] =
    useState<CircleView[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [message, setMessage] =
    useState("");
  const [success, setSuccess] =
    useState("");
  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [privacyFilter, setPrivacyFilter] =
    useState<PrivacyFilter>("all");

  const [currencyFilter, setCurrencyFilter] =
    useState("all");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const loadCircles = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [
        circlesResult,
        profilesResult,
        membersResult,
      ] = await Promise.all([
        supabase
          .from("circles")
          .select(
            `
              id,
              owner_id,
              name,
              description,
              contribution_amount,
              currency,
              contribution_frequency,
              max_members,
              privacy,
              started,
              completed,
              status,
              total_saved,
              current_round,
              contract_address,
              creation_tx_hash,
              blockchain_status,
              blockchain_network,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("profiles")
          .select("id, full_name, email"),

        supabase
          .from("circle_members")
          .select("circle_id, status"),
      ]);

      const firstError =
        circlesResult.error ||
        profilesResult.error ||
        membersResult.error;

      if (firstError) {
        throw firstError;
      }

      const circleRows =
        (circlesResult.data as
          | CircleRow[]
          | null) ?? [];

      const profiles =
        (profilesResult.data as
          | ProfileRow[]
          | null) ?? [];

      const members =
        (membersResult.data as
          | MemberRow[]
          | null) ?? [];

      const profilesById = new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ])
      );

      const acceptedMembersByCircle =
        new Map<string, number>();

      for (const member of members) {
        if (member.status !== "accepted") {
          continue;
        }

        acceptedMembersByCircle.set(
          member.circle_id,
          (acceptedMembersByCircle.get(
            member.circle_id
          ) ?? 0) + 1
        );
      }

      const normalized: CircleView[] =
        circleRows.map((circle) => {
          const owner = profilesById.get(
            circle.owner_id
          );

          return {
            id: circle.id,
            ownerId: circle.owner_id,
            ownerName:
              owner?.full_name?.trim() ||
              owner?.email?.split("@")[0] ||
              "Unknown owner",
            ownerEmail:
              owner?.email?.trim() ||
              "No email available",
            name: circle.name,
            description: circle.description,
            contributionAmount: Number(
              circle.contribution_amount ?? 0
            ),
            currency:
              circle.currency || "GHS",
            frequency:
              circle.contribution_frequency ||
              "Not set",
            maxMembers: Number(
              circle.max_members ?? 0
            ),
            acceptedMembers:
              acceptedMembersByCircle.get(
                circle.id
              ) ?? 0,
            privacy:
              circle.privacy || "private",
            status: resolveStatus(circle),
            totalSaved: Number(
              circle.total_saved ?? 0
            ),
            currentRound: Number(
              circle.current_round ?? 1
            ),
            contractAddress:
              circle.contract_address,
            creationTxHash:
              circle.creation_tx_hash,
            blockchainStatus:
              circle.blockchain_status,
            blockchainNetwork:
              circle.blockchain_network,
            createdAt: circle.created_at,
          };
        });

      setCircles(normalized);
    } catch (error) {
      console.error(
        "Unable to load admin circles:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load circles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCircles();
  }, [loadCircles]);

  const currencies = useMemo(
    () =>
      Array.from(
        new Set(
          circles.map(
            (circle) => circle.currency
          )
        )
      ).sort(),
    [circles]
  );

  const stats = useMemo(() => {
    return {
      total: circles.length,
      active: circles.filter(
        (circle) =>
          circle.status === "active"
      ).length,
      paused: circles.filter(
        (circle) =>
          circle.status === "paused"
      ).length,
      completed: circles.filter(
        (circle) =>
          circle.status === "completed"
      ).length,
      cancelled: circles.filter(
        (circle) =>
          circle.status === "cancelled"
      ).length,
      totalValueLocked: circles.reduce(
        (total, circle) =>
          total + circle.totalSaved,
        0
      ),
    };
  }, [circles]);

  const filteredCircles = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return circles.filter((circle) => {
      const matchesStatus =
        statusFilter === "all" ||
        circle.status === statusFilter;

      const matchesPrivacy =
        privacyFilter === "all" ||
        circle.privacy === privacyFilter;

      const matchesCurrency =
        currencyFilter === "all" ||
        circle.currency === currencyFilter;

      if (
        !matchesStatus ||
        !matchesPrivacy ||
        !matchesCurrency
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        circle.name,
        circle.id,
        circle.ownerName,
        circle.ownerEmail,
        circle.contractAddress ?? "",
        circle.blockchainStatus ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    circles,
    currencyFilter,
    privacyFilter,
    search,
    statusFilter,
  ]);

  async function updateCircleStatus(
    circle: CircleView,
    action:
      | "pause"
      | "resume"
      | "cancel"
  ) {
    const confirmMessage =
      action === "cancel"
        ? `Cancel "${circle.name}"? This should only be used when the circle must be closed administratively.`
        : `${formatLabel(action)} "${circle.name}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setMessage("");
    setSuccess("");
    setActionLoading(circle.id);

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
        `/api/admin/circles/${circle.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update the circle."
        );
      }

      setSuccess(
        result.message ||
          "Circle updated successfully."
      );

      await loadCircles();
    } catch (error) {
      console.error(
        "Unable to update circle:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the circle."
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
            Savings Operations
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-4xl">
            Circle Management
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Monitor savings circles, member
            capacity, funds, lifecycle status and
            Rootstock deployment.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadCircles()
          }
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
          label="Total Circles"
          value={stats.total.toLocaleString()}
          icon={Layers3}
          classes="bg-blue-100 text-blue-700"
        />

        <StatCard
          label="Active"
          value={stats.active.toLocaleString()}
          icon={PlayCircle}
          classes="bg-green-100 text-green-700"
        />

        <StatCard
          label="Paused"
          value={stats.paused.toLocaleString()}
          icon={PauseCircle}
          classes="bg-yellow-100 text-yellow-700"
        />

        <StatCard
          label="Completed"
          value={stats.completed.toLocaleString()}
          icon={CheckCircle2}
          classes="bg-purple-100 text-purple-700"
        />

        <StatCard
          label="Cancelled"
          value={stats.cancelled.toLocaleString()}
          icon={XCircle}
          classes="bg-red-100 text-red-700"
        />

        <StatCard
          label="Total Saved"
          value={formatMoney(
            stats.totalValueLocked,
            "GHS"
          )}
          icon={CircleDollarSign}
          classes="bg-emerald-100 text-emerald-700"
        />
      </div>

      <Card className="mt-8">
        <div className="grid gap-4 xl:grid-cols-[1fr_180px_180px_180px] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search circle, owner, ID or contract address"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600"
            />
          </div>

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
            <option value="upcoming">
              Upcoming
            </option>
            <option value="active">
              Active
            </option>
            <option value="paused">
              Paused
            </option>
            <option value="completed">
              Completed
            </option>
            <option value="cancelled">
              Cancelled
            </option>
          </select>

          <select
            value={currencyFilter}
            onChange={(event) =>
              setCurrencyFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
          >
            <option value="all">
              All currencies
            </option>

            {currencies.map((currency) => (
              <option
                key={currency}
                value={currency}
              >
                {currency}
              </option>
            ))}
          </select>

          <select
            value={privacyFilter}
            onChange={(event) =>
              setPrivacyFilter(
                event.target
                  .value as PrivacyFilter
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
          >
            <option value="all">
              All privacy
            </option>
            <option value="private">
              Private
            </option>
            <option value="public">
              Public
            </option>
          </select>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Showing {filteredCircles.length} of{" "}
          {circles.length} circles
        </p>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-xl bg-gray-100"
                />
              )
            )}
          </div>
        ) : filteredCircles.length === 0 ? (
          <div className="p-12 text-center">
            <Layers3 className="mx-auto h-10 w-10 text-gray-400" />

            <h2 className="mt-4 text-xl font-bold text-gray-950">
              No circles found
            </h2>

            <p className="mt-2 text-gray-500">
              Change the search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      "Circle",
                      "Owner",
                      "Members",
                      "Contribution",
                      "Total Saved",
                      "Status",
                      "Rootstock",
                      "Actions",
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
                  {filteredCircles.map(
                    (circle) => (
                      <tr
                        key={circle.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-5">
                          <CircleIdentity
                            circle={circle}
                          />
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-gray-950">
                            {circle.ownerName}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {circle.ownerEmail}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 font-semibold text-gray-900">
                            <Users className="h-4 w-4 text-gray-400" />
                            {circle.acceptedMembers}/
                            {circle.maxMembers}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-950">
                            {formatMoney(
                              circle.contributionAmount,
                              circle.currency
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {circle.frequency}
                          </p>
                        </td>

                        <td className="px-6 py-5 font-bold text-green-700">
                          {formatMoney(
                            circle.totalSaved,
                            circle.currency
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge
                            status={circle.status}
                          />
                        </td>

                        <td className="px-6 py-5">
                          <RootstockBadge
                            circle={circle}
                          />
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/circles/${circle.id}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Link>

                            {circle.status ===
                            "paused" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void updateCircleStatus(
                                    circle,
                                    "resume"
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  circle.id
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                              >
                                Resume
                              </button>
                            ) : circle.status ===
                                "active" ||
                              circle.status ===
                                "upcoming" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void updateCircleStatus(
                                    circle,
                                    "pause"
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  circle.id
                                }
                                className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-50"
                              >
                                Pause
                              </button>
                            ) : null}

                            {![
                              "completed",
                              "cancelled",
                            ].includes(
                              circle.status
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  void updateCircleStatus(
                                    circle,
                                    "cancel"
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  circle.id
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-200 xl:hidden">
              {filteredCircles.map((circle) => (
                <div
                  key={circle.id}
                  className="p-5"
                >
                  <CircleIdentity
                    circle={circle}
                  />

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileDetail
                      label="Owner"
                      value={circle.ownerName}
                    />

                    <MobileDetail
                      label="Members"
                      value={`${circle.acceptedMembers}/${circle.maxMembers}`}
                    />

                    <MobileDetail
                      label="Contribution"
                      value={formatMoney(
                        circle.contributionAmount,
                        circle.currency
                      )}
                    />

                    <MobileDetail
                      label="Total Saved"
                      value={formatMoney(
                        circle.totalSaved,
                        circle.currency
                      )}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={circle.status}
                    />

                    <RootstockBadge
                      circle={circle}
                    />
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    <Link
                      href={`/admin/circles/${circle.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-800"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>

                    {circle.status === "paused" ? (
                      <button
                        type="button"
                        onClick={() =>
                          void updateCircleStatus(
                            circle,
                            "resume"
                          )
                        }
                        disabled={
                          actionLoading === circle.id
                        }
                        className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        Resume
                      </button>
                    ) : circle.status ===
                        "active" ||
                      circle.status ===
                        "upcoming" ? (
                      <button
                        type="button"
                        onClick={() =>
                          void updateCircleStatus(
                            circle,
                            "pause"
                          )
                        }
                        disabled={
                          actionLoading === circle.id
                        }
                        className="rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        Pause
                      </button>
                    ) : null}

                    {![
                      "completed",
                      "cancelled",
                    ].includes(circle.status) && (
                      <button
                        type="button"
                        onClick={() =>
                          void updateCircleStatus(
                            circle,
                            "cancel"
                          )
                        }
                        disabled={
                          actionLoading === circle.id
                        }
                        className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
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
  value: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  classes: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-600">
            {label}
          </p>

          <p className="mt-2 break-words text-2xl font-bold text-gray-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${classes}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function CircleIdentity({
  circle,
}: {
  circle: CircleView;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate font-bold text-gray-950">
        {circle.name}
      </p>

      <p className="mt-1 truncate text-sm text-gray-500">
        {circle.description ||
          "No description"}
      </p>

      <p className="mt-1 font-mono text-xs text-gray-400">
        {circle.id.slice(0, 8)}...
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const classes =
    status === "active"
      ? "bg-green-100 text-green-800"
      : status === "paused"
        ? "bg-yellow-100 text-yellow-800"
        : status === "completed"
          ? "bg-purple-100 text-purple-800"
          : status === "cancelled"
            ? "bg-red-100 text-red-800"
            : "bg-blue-100 text-blue-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${classes}`}
    >
      {status}
    </span>
  );
}

function RootstockBadge({
  circle,
}: {
  circle: CircleView;
}) {
  const verified =
    circle.blockchainStatus === "confirmed" &&
    Boolean(circle.contractAddress);

  const failed =
    circle.blockchainStatus === "failed";

  const content = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        verified
          ? "bg-orange-100 text-orange-800"
          : failed
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
      }`}
    >
      <ShieldCheck className="h-3.5 w-3.5" />

      {verified
        ? "Verified"
        : failed
          ? "Failed"
          : "Pending"}
    </span>
  );

  if (!circle.contractAddress) {
    return content;
  }

  return (
    <a
      href={`${ROOTSTOCK_EXPLORER}/address/${circle.contractAddress}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1"
    >
      {content}
      <ExternalLink className="h-3.5 w-3.5 text-orange-600" />
    </a>
  );
}

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-gray-950">
        {value}
      </p>
    </div>
  );
}

function resolveStatus(
  circle: CircleRow
): CircleStatus {
  if (
    circle.completed ||
    circle.status === "completed"
  ) {
    return "completed";
  }

  if (circle.status === "cancelled") {
    return "cancelled";
  }

  if (circle.status === "paused") {
    return "paused";
  }

  if (
    !circle.started ||
    circle.status === "upcoming"
  ) {
    return "upcoming";
  }

  return circle.status || "active";
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

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}
