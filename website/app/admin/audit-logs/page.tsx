"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Download,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type AuditLog = {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type AuditLogView = AuditLog & {
  admin_name: string;
  admin_email: string;
};

type DateFilter =
  | "all"
  | "today"
  | "last_7_days"
  | "last_30_days";

const PAGE_SIZE = 10;

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] =
    useState<AuditLogView | null>(null);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [
        logsResult,
        profilesResult,
      ] = await Promise.all([
        supabase
          .from("audit_logs")
          .select(`
            id,
            admin_id,
            action,
            entity_type,
            entity_id,
            description,
            metadata,
            ip_address,
            user_agent,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email
          `),
      ]);

      if (logsResult.error) {
        throw logsResult.error;
      }

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      const auditRows =
        (logsResult.data as AuditLog[] | null) ?? [];

      const profileRows =
        (profilesResult.data as Profile[] | null) ?? [];

      const profileMap = new Map(
        profileRows.map((profile) => [
          profile.id,
          profile,
        ])
      );

      const rows: AuditLogView[] = auditRows.map(
        (log) => {
          const profile = log.admin_id
            ? profileMap.get(log.admin_id)
            : undefined;

          return {
            ...log,
            admin_name:
  profile?.full_name?.trim() ||
  profile?.email?.split("@")[0] ||
  "Unknown admin",
            admin_email:
              profile?.email?.trim() ||
              "No email available",
          };
        }
      );

      setLogs(rows);
    } catch (error) {
      console.error(
        "Unable to load audit logs:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, dateFilter]);

  const actionOptions = useMemo(() => {
    return Array.from(
      new Set(logs.map((log) => log.action))
    ).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !query ||
        [
          log.admin_name,
          log.admin_email,
          log.action,
          log.entity_type,
          log.entity_id ?? "",
          log.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesAction =
        actionFilter === "all" ||
        log.action === actionFilter;

      const matchesDate =
        matchesDateFilter(
          log.created_at,
          dateFilter
        );

      return (
        matchesSearch &&
        matchesAction &&
        matchesDate
      );
    });
  }, [actionFilter, dateFilter, logs, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / PAGE_SIZE)
  );

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredLogs.slice(
      start,
      start + PAGE_SIZE
    );
  }, [currentPage, filteredLogs]);

  const todayCount = useMemo(
    () =>
      logs.filter((log) =>
        matchesDateFilter(
          log.created_at,
          "today"
        )
      ).length,
    [logs]
  );

  const uniqueAdmins = useMemo(
    () =>
      new Set(
        logs
          .map((log) => log.admin_id)
          .filter(Boolean)
      ).size,
    [logs]
  );

  const uniqueActions = useMemo(
    () =>
      new Set(logs.map((log) => log.action))
        .size,
    [logs]
  );

  function exportCsv() {
    if (filteredLogs.length === 0) {
      setMessage(
        "There are no audit logs to export."
      );
      return;
    }

    const headers = [
      "Log ID",
      "Admin Name",
      "Admin Email",
      "Action",
      "Entity Type",
      "Entity ID",
      "Description",
      "IP Address",
      "User Agent",
      "Created At",
      "Metadata",
    ];

    const rows = filteredLogs.map((log) => [
      log.id,
      log.admin_name,
      log.admin_email,
      log.action,
      log.entity_type,
      log.entity_id ?? "",
      log.description,
      log.ip_address ?? "",
      log.user_agent ?? "",
      new Date(log.created_at).toISOString(),
      JSON.stringify(log.metadata ?? {}),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            escapeCsvValue(String(value))
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `chainsave-audit-logs-${getFileDateStamp()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <section className="p-6 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            System
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-950">
            Audit Logs
          </h1>

          <p className="mt-2 text-gray-600">
            Review administrative actions and
            platform changes across ChainSave.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportCsv}
            disabled={
              loading || filteredLogs.length === 0
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={loadAuditLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {message}
        </p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Logs"
          value={loading ? "..." : logs.length}
          icon={Activity}
          iconClasses="bg-blue-100 text-blue-700"
        />

        <SummaryCard
          title="Today's Activity"
          value={loading ? "..." : todayCount}
          icon={CalendarDays}
          iconClasses="bg-green-100 text-green-700"
        />

        <SummaryCard
          title="Unique Admins"
          value={loading ? "..." : uniqueAdmins}
          icon={UserRound}
          iconClasses="bg-purple-100 text-purple-700"
        />

        <SummaryCard
          title="Action Types"
          value={loading ? "..." : uniqueActions}
          icon={ShieldCheck}
          iconClasses="bg-orange-100 text-orange-700"
        />
      </div>

      <Card className="mt-8">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search admin, action, entity or description..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(event.target.value)
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
          >
            <option value="all">
              All Actions
            </option>

            {actionOptions.map((action) => (
              <option
                key={action}
                value={action}
              >
                {formatLabel(action)}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value as DateFilter
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
          >
            <option value="all">
              All Dates
            </option>
            <option value="today">
              Today
            </option>
            <option value="last_7_days">
              Last 7 Days
            </option>
            <option value="last_30_days">
              Last 30 Days
            </option>
          </select>
        </div>

        <p className="mt-4 text-sm font-semibold text-gray-600">
          {filteredLogs.length} result
          {filteredLogs.length === 1 ? "" : "s"}
        </p>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-gray-600">
            Loading audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" />

            <h2 className="mt-4 text-lg font-bold text-gray-900">
              No audit logs found
            </h2>

            <p className="mt-2 text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <TableHeader>
                      Admin
                    </TableHeader>
                    <TableHeader>
                      Action
                    </TableHeader>
                    <TableHeader>
                      Entity
                    </TableHeader>
                    <TableHeader>
                      Description
                    </TableHeader>
                    <TableHeader>
                      Date
                    </TableHeader>
                    <TableHeader align="right">
                      Action
                    </TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition hover:bg-green-50/40"
                    >
                      <td className="px-6 py-5 align-top">
                        <p className="font-bold text-gray-950">
                          {log.admin_name}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {log.admin_email}
                        </p>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {formatLabel(log.action)}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <p className="font-semibold text-gray-900">
                          {formatLabel(
                            log.entity_type
                          )}
                        </p>

                        <p className="mt-1 max-w-48 truncate font-mono text-xs text-gray-500">
                          {log.entity_id ||
                            "Not available"}
                        </p>
                      </td>

                      <td className="max-w-md px-6 py-5 align-top">
                        <p className="text-sm leading-6 text-gray-700">
                          {log.description}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 align-top text-sm font-medium text-gray-700">
                        {formatDate(log.created_at)}
                      </td>

                      <td className="px-6 py-5 text-right align-top">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLog(log)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-green-600 hover:bg-green-50 hover:text-green-700"
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

            <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                    )
                  }
                  disabled={
                    currentPage === totalPages
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
                  Audit Details
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-950">
                  {formatLabel(
                    selectedLog.action
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(null)
                }
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <DetailItem
                label="Admin"
                value={selectedLog.admin_name}
              />

              <DetailItem
                label="Admin Email"
                value={selectedLog.admin_email}
              />

              <DetailItem
                label="Entity Type"
                value={formatLabel(
                  selectedLog.entity_type
                )}
              />

              <DetailItem
                label="Entity ID"
                value={
                  selectedLog.entity_id ||
                  "Not available"
                }
                mono
              />

              <DetailItem
                label="IP Address"
                value={
                  selectedLog.ip_address ||
                  "Not available"
                }
              />

              <DetailItem
                label="Created"
                value={formatDateTime(
                  selectedLog.created_at
                )}
              />

              <div className="md:col-span-2">
                <DetailItem
                  label="Description"
                  value={selectedLog.description}
                />
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-600">
                  User Agent
                </p>

                <p className="mt-2 break-words rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
                  {selectedLog.user_agent ||
                    "Not available"}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-600">
                  Metadata
                </p>

                <pre className="mt-2 overflow-x-auto rounded-xl bg-gray-950 p-4 text-sm text-green-300">
                  {JSON.stringify(
                    selectedLog.metadata ?? {},
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type SummaryCardProps = {
  title: string;
  value: number | string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  iconClasses: string;
};

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClasses,
}: SummaryCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-600">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold text-gray-950">
            {value}
          </h2>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClasses}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-600">
        {label}
      </p>

      <p
        className={`mt-2 break-words font-medium text-gray-950 ${
          mono ? "font-mono text-sm" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function matchesDateFilter(
  dateValue: string,
  filter: DateFilter
) {
  if (filter === "all") {
    return true;
  }

  const date = new Date(dateValue);
  const now = new Date();

  if (filter === "today") {
    return (
      date.getFullYear() ===
        now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  const days =
    filter === "last_7_days" ? 7 : 30;

  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return date.getTime() >= start.getTime();
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function getFileDateStamp() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}