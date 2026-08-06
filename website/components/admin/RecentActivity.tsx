"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Users,
  Layers3,
  CircleDollarSign,
} from "lucide-react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  type:
    | "deposit"
    | "withdraw"
    | "contribution"
    | "payout"
    | "user"
    | "circle";
  title: string;
  subtitle: string;
  created_at: string;
  amount?: number;
};

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    setLoading(true);
    setMessage("");

    try {
      const [
        transactionsResult,
        contributionsResult,
        profilesResult,
        circlesResult,
      ] = await Promise.all([
        supabase
          .from("wallet_transactions")
          .select(
            "id, amount, transaction_type, created_at"
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("contributions")
          .select("id, amount, created_at")
          .order("created_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("profiles")
          .select(
            "id, full_name, email, created_at"
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("circles")
          .select("id, name, created_at")
          .order("created_at", {
            ascending: false,
          })
          .limit(5),
      ]);

      const items: Activity[] = [];

      transactionsResult.data?.forEach((t: any) => {
        items.push({
          id: t.id,
          type:
            t.transaction_type === "deposit"
              ? "deposit"
              : t.transaction_type === "withdraw"
              ? "withdraw"
              : "payout",
          title:
            t.transaction_type.charAt(0).toUpperCase() +
            t.transaction_type.slice(1),
          subtitle: `GHS ${Number(
            t.amount
          ).toLocaleString()}`,
          amount: Number(t.amount),
          created_at: t.created_at,
        });
      });

      contributionsResult.data?.forEach((c: any) => {
        items.push({
          id: c.id,
          type: "contribution",
          title: "Contribution",
          subtitle: `GHS ${Number(
            c.amount
          ).toLocaleString()}`,
          amount: Number(c.amount),
          created_at: c.created_at,
        });
      });

      profilesResult.data?.forEach((p: any) => {
        items.push({
          id: p.id,
          type: "user",
          title: "New User",
          subtitle:
            p.full_name ||
            p.email ||
            "New registration",
          created_at: p.created_at,
        });
      });

      circlesResult.data?.forEach((c: any) => {
        items.push({
          id: c.id,
          type: "circle",
          title: "New Circle",
          subtitle: c.name,
          created_at: c.created_at,
        });
      });

      items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      setActivities(items.slice(0, 10));
    } catch (error) {
      console.error(
        "Unable to load recent admin activity:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load recent activity."
      );
    } finally {
      setLoading(false);
    }
  }

  function icon(type: Activity["type"]) {
    switch (type) {
      case "deposit":
        return (
          <ArrowDownCircle className="h-6 w-6 text-green-600" />
        );

      case "withdraw":
        return (
          <ArrowUpCircle className="h-6 w-6 text-red-600" />
        );

      case "contribution":
        return (
          <PiggyBank className="h-6 w-6 text-purple-600" />
        );

      case "user":
        return (
          <Users className="h-6 w-6 text-blue-600" />
        );

      case "circle":
        return (
          <Layers3 className="h-6 w-6 text-indigo-600" />
        );

      default:
        return (
          <CircleDollarSign className="h-6 w-6 text-orange-600" />
        );
    }
  }

  function timeAgo(date: string) {
    const seconds =
      Math.floor(
        (Date.now() -
          new Date(date).getTime()) /
          1000
      );

    if (seconds < 60)
      return `${seconds}s ago`;

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60)
      return `${minutes}m ago`;

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24)
      return `${hours}h ago`;

    const days =
      Math.floor(hours / 24);

    return `${days}d ago`;
  }

  return (
    <Card className="mt-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Recent Activity
          </h2>

          <p className="text-sm text-gray-500">
            Latest activity across ChainSave
          </p>
        </div>
      </div>

      {message ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : loading ? (
        <div className="py-10 text-center text-gray-500">
          Loading...
        </div>
      ) : activities.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          No recent activity found.
        </div>
      ) : (
        <div className="mt-6 divide-y">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                {icon(activity.type)}

                <div>
                  <p className="font-semibold text-gray-900">
                    {activity.title}
                  </p>

                  <p className="text-sm text-gray-500">
                    {activity.subtitle}
                  </p>
                </div>
              </div>

              <span className="text-sm text-gray-400">
                {timeAgo(activity.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}