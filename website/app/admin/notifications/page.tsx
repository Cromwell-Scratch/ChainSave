"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { Eye } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  status: string;
  created_at: string;
};

type NotificationStats = {
  total: number;
  sent: number;
  scheduled: number;
  drafts: number;
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    sent: 0,
    scheduled: 0,
    drafts: 0,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          title,
          message,
          type,
          audience,
          status,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      const rows = (data as Notification[]) ?? [];

      setNotifications(rows);

      setStats({
        total: rows.length,
        sent: rows.filter(n => n.status === "sent").length,
        scheduled: rows.filter(n => n.status === "scheduled").length,
        drafts: rows.filter(n => n.status === "draft").length,
      });

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredNotifications = useMemo(() => {
    const query = search.toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.type.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        notification.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [notifications, search, filter]);

  const filters = [
    "all",
    "system",
    "wallet",
    "savings",
    "security",
    "promotion",
  ];

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <section className="p-6 lg:p-8">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Communication
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-950">
            Notifications
          </h1>

          <p className="mt-2 text-gray-600">
            Manage announcements and user notifications.
          </p>
        </div>

        <Link
          href="/admin/notifications/create"
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          <Plus className="h-5 w-5" />
          Create Notification
        </Link>

      </div>

      {message && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {message}
        </p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <Card>
          <Bell className="h-7 w-7 text-blue-700" />
          <p className="mt-4 text-sm text-gray-500">Total</p>
          <h2 className="mt-3 text-4xl font-bold">{stats.total}</h2>
        </Card>

        <Card>
          <CheckCircle2 className="h-7 w-7 text-green-700" />
          <p className="mt-4 text-sm text-gray-500">Sent</p>
          <h2 className="mt-3 text-4xl font-bold text-green-700">
            {stats.sent}
          </h2>
        </Card>

        <Card>
          <Clock3 className="h-7 w-7 text-orange-700" />
          <p className="mt-4 text-sm text-gray-500">Scheduled</p>
          <h2 className="mt-3 text-4xl font-bold text-orange-700">
            {stats.scheduled}
          </h2>
        </Card>

        <Card>
          <FileText className="h-7 w-7 text-purple-700" />
          <p className="mt-4 text-sm text-gray-500">Drafts</p>
          <h2 className="mt-3 text-4xl font-bold text-purple-700">
            {stats.drafts}
          </h2>
        </Card>

      </div>

      <Card className="mt-8">

        <div className="relative">

          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="pl-12"
          />

        </div>

        <div className="mt-5 flex flex-wrap gap-3">

          {filters.map((type)=>(
            <button
              key={type}
              onClick={()=>setFilter(type)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter===type
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {type.charAt(0).toUpperCase()+type.slice(1)}
            </button>
          ))}

        </div>

      </Card>

      <Card className="mt-6 overflow-hidden p-0">

        {loading ? (

          <div className="p-8">
            Loading...
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Title
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Type
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Audience
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-600">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">

  {filteredNotifications.map((notification) => (

    <tr
      key={notification.id}
      className="transition hover:bg-green-50/40"
    >

      {/* TITLE */}

      <td className="px-6 py-6 align-top">

        <p className="text-lg font-bold text-gray-900">
          {notification.title}
        </p>

        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-700">
          {notification.message}
        </p>

      </td>

      {/* TYPE */}

      <td className="px-6 py-6 align-top">

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            notification.type === "system"
              ? "bg-blue-100 text-blue-700"
              : notification.type === "wallet"
              ? "bg-green-100 text-green-700"
              : notification.type === "savings"
              ? "bg-purple-100 text-purple-700"
              : notification.type === "security"
              ? "bg-red-100 text-red-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {notification.type}
        </span>

      </td>

      {/* AUDIENCE */}

      <td className="px-6 py-6 align-top">

        <span className="inline-flex rounded-full bg-gray-50 border-b border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
          {notification.audience.replace("_", " ")}
        </span>

      </td>

      {/* STATUS */}

      <td className="px-6 py-6 align-top">

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            notification.status === "sent"
              ? "bg-green-100 text-green-700"
              : notification.status === "scheduled"
              ? "bg-orange-100 text-orange-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {notification.status}
        </span>

      </td>

      {/* DATE */}

      <td className="px-6 py-6 align-top whitespace-nowrap text-sm font-medium text-gray-700">

        {formatDate(notification.created_at)}

      </td>

      {/* ACTION */}

      <td className="px-6 py-6 text-right align-top">

       <Link
  href={`/admin/notifications/${notification.id}`}
  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-green-600 hover:bg-green-50 hover:text-green-700"
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