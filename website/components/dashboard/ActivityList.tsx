"use client";

import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  CircleDollarSign,
  Clock3,
  Loader2,
  PiggyBank,
  RefreshCw,
  Users,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Card from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type WalletRow = {
  id: string;
  currency: string | null;
};

type WalletTransactionRow = {
  id: string;
  amount: number | string | null;
  transaction_type: string;
  description: string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  created_at: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  amount: string | null;
  amountClass: string;
  icon: ComponentType<{ className?: string }>;
  iconClass: string;
  iconBgClass: string;
  createdAt: string;
};

type ActivityGroup = {
  label: string;
  items: ActivityItem[];
};

const MAX_ITEMS = 12;
const DUPLICATE_NOTIFICATION_TYPES = new Set([
  "deposit",
  "withdraw",
  "withdrawal",
  "contribution",
  "payout",
]);

export default function ActivityList() {
  const [activities, setActivities] =
    useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [message, setMessage] = useState("");
  const refreshTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadActivities = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        const { data: walletData, error: walletError } =
          await supabase
            .from("wallets")
            .select("id, currency")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (walletError) throw walletError;

        const wallet = walletData as WalletRow | null;

        const transactionQuery = wallet
          ? supabase
              .from("wallet_transactions")
              .select(`
                id,
                amount,
                transaction_type,
                description,
                created_at
              `)
              .eq("wallet_id", wallet.id)
              .order("created_at", { ascending: false })
              .limit(MAX_ITEMS)
          : Promise.resolve({
              data: [] as WalletTransactionRow[],
              error: null,
            });

        const notificationQuery = supabase
          .from("notifications")
          .select(`
            id,
            title,
            message,
            type,
            created_at
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(MAX_ITEMS);

        const [transactionResult, notificationResult] =
          await Promise.all([
            transactionQuery,
            notificationQuery,
          ]);

        if (transactionResult.error) {
          throw transactionResult.error;
        }

        if (notificationResult.error) {
          throw notificationResult.error;
        }

        const currency =
          wallet?.currency?.toUpperCase() || "GHS";

        const transactionItems = (
          (transactionResult.data ?? []) as WalletTransactionRow[]
        ).map((transaction) =>
          mapTransaction(transaction, currency)
        );

        const notificationItems = (
          (notificationResult.data ?? []) as NotificationRow[]
        )
          .filter(
            (notification) =>
              !DUPLICATE_NOTIFICATION_TYPES.has(
                (notification.type ?? "").toLowerCase()
              )
          )
          .map(mapNotification);

        setActivities(
          [...transactionItems, ...notificationItems]
            .filter((item) => isValidDate(item.createdAt))
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, MAX_ITEMS)
        );
      } catch (error) {
        console.error("Unable to load recent activity:", error);
        setActivities([]);
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load recent activity."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadActivities();

    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      refreshTimer.current = setTimeout(() => {
        void loadActivities(true);
      }, 350);
    };

    const channel = supabase
      .channel("dashboard-live-activity")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallet_transactions",
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [loadActivities]);

  const groups = useMemo(
    () => groupActivities(activities),
    [activities]
  );

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-950">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Your latest wallet and savings updates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadActivities(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {message && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <ActivitySkeleton />
      ) : activities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 space-y-7">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="mb-3 flex items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                  {group.label}
                </p>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="divide-y divide-gray-100">
                {group.items.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivityRow({
  activity,
}: {
  activity: ActivityItem;
}) {
  const Icon = activity.icon;

  return (
    <article className="flex flex-col gap-4 rounded-xl px-2 py-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${activity.iconBgClass}`}
        >
          <Icon className={`h-5 w-5 ${activity.iconClass}`} />
        </div>

        <div className="min-w-0">
          <p className="font-bold text-gray-900">
            {activity.title}
          </p>
          <p className="mt-1 break-words text-sm leading-5 text-gray-500">
            {activity.description}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <Clock3 className="h-3.5 w-3.5" />
            <time
              dateTime={activity.createdAt}
              title={formatFullDate(activity.createdAt)}
            >
              {formatRelativeTime(activity.createdAt)}
            </time>
          </div>
        </div>
      </div>

      {activity.amount && (
        <p
          className={`shrink-0 pl-[3.75rem] text-sm font-bold sm:pl-0 ${activity.amountClass}`}
        >
          {activity.amount}
        </p>
      )}
    </article>
  );
}

function ActivitySkeleton() {
  return (
    <div className="mt-6 divide-y divide-gray-100">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-center justify-between gap-4 py-4"
        >
          <div className="flex flex-1 items-center gap-4">
            <div className="h-11 w-11 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-56 max-w-full rounded bg-gray-200" />
              <div className="mt-2 h-3 w-20 rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
        <WalletCards className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-bold text-gray-950">
        No activity yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Wallet deposits, contributions, payouts, and
        notifications will appear here.
      </p>
    </div>
  );
}

function mapTransaction(
  transaction: WalletTransactionRow,
  currency: string
): ActivityItem {
  const type = transaction.transaction_type
    .trim()
    .toLowerCase();
  const amount = Math.abs(Number(transaction.amount ?? 0));
  const incoming =
    type === "deposit" ||
    type === "payout" ||
    type === "refund";

  const base = {
    id: `transaction-${transaction.id}`,
    description:
      transaction.description?.trim() ||
      fallbackDescription(type),
    amount: Number.isFinite(amount)
      ? `${incoming ? "+" : "-"}${currency} ${amount.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`
      : null,
    createdAt: transaction.created_at,
  };

  if (type === "deposit") {
    return {
      ...base,
      title: "Wallet funded",
      amountClass: "text-green-700",
      icon: ArrowDownCircle,
      iconClass: "text-green-700",
      iconBgClass: "bg-green-100",
    };
  }

  if (type === "withdraw" || type === "withdrawal") {
    return {
      ...base,
      title: "Wallet withdrawal",
      amountClass: "text-red-700",
      icon: ArrowUpCircle,
      iconClass: "text-red-700",
      iconBgClass: "bg-red-100",
    };
  }

  if (type === "payout") {
    return {
      ...base,
      title: "Circle payout received",
      amountClass: "text-green-700",
      icon: CircleDollarSign,
      iconClass: "text-orange-700",
      iconBgClass: "bg-orange-100",
    };
  }

  if (type === "contribution") {
    return {
      ...base,
      title: "Circle contribution",
      amountClass: "text-purple-700",
      icon: PiggyBank,
      iconClass: "text-purple-700",
      iconBgClass: "bg-purple-100",
    };
  }

  return {
    ...base,
    title: toTitleCase(transaction.transaction_type),
    amountClass: incoming
      ? "text-green-700"
      : "text-gray-700",
    icon: WalletCards,
    iconClass: "text-blue-700",
    iconBgClass: "bg-blue-100",
  };
}

function mapNotification(
  notification: NotificationRow
): ActivityItem {
  const type = (notification.type ?? "").toLowerCase();
  const base = {
    id: `notification-${notification.id}`,
    title: notification.title || "ChainSave update",
    description:
      notification.message?.trim() ||
      "A new ChainSave update is available.",
    amount: null,
    amountClass: "text-gray-700",
    createdAt: notification.created_at,
  };

  if (
    type.includes("invite") ||
    type.includes("member") ||
    type.includes("join")
  ) {
    return {
      ...base,
      icon: Users,
      iconClass: "text-blue-700",
      iconBgClass: "bg-blue-100",
    };
  }

  return {
    ...base,
    icon: Bell,
    iconClass: "text-orange-700",
    iconBgClass: "bg-orange-100",
  };
}

function groupActivities(
  activities: ActivityItem[]
): ActivityGroup[] {
  const groups = new Map<string, ActivityItem[]>();

  activities.forEach((activity) => {
    const label = dateGroupLabel(activity.createdAt);
    groups.set(label, [
      ...(groups.get(label) ?? []),
      activity,
    ]);
  });

  return Array.from(groups.entries()).map(
    ([label, items]) => ({ label, items })
  );
}

function dateGroupLabel(value: string) {
  const date = startOfDay(new Date(value));
  const today = startOfDay(new Date());
  const days = Math.round(
    (today.getTime() - date.getTime()) / 86_400_000
  );

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== today.getFullYear()
        ? "numeric"
        : undefined,
  });
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 45) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fallbackDescription(type: string) {
  if (type === "deposit") {
    return "Funds were added to your ChainSave wallet.";
  }
  if (type === "withdraw" || type === "withdrawal") {
    return "Funds were withdrawn from your wallet.";
  }
  if (type === "contribution") {
    return "Your savings-circle contribution was completed.";
  }
  if (type === "payout") {
    return "A savings-circle payout was added to your wallet.";
  }
  return "Your wallet balance was updated.";
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function startOfDay(value: Date) {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isValidDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}