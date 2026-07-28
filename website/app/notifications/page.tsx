"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  Filter,
  Gift,
  Mail,
  Play,
  RotateCw,
  Search,
  Trophy,
  Wallet,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import {
  getNotifications,
  markAllNotificationsRead,
} from "@/lib/notifications";

import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  user_id: string;
  circle_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

type FilterType =
  | "all"
  | "unread"
  | "invite"
  | "contribution"
  | "payout"
  | "wallet";

export default function NotificationsPage() {
  const router = useRouter();

  const [userId, setUserId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("all");

  const [message, setMessage] =
    useState("");

  const [markingAllRead, setMarkingAllRead] =
    useState(false);

    const loadNotifications = useCallback(
  async (currentUserId: string) => {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } =
        await getNotifications(currentUserId);

      if (error) {
        throw error;
      }

      setNotifications(
        (data as Notification[]) ?? []
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  },
  []
);

useEffect(() => {
  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    await loadNotifications(user.id);
  }

  loadUser();
}, [router, loadNotifications]);


const filteredNotifications =
  useMemo(() => {
    return notifications.filter(
      (notification) => {
        if (
          filter === "unread" &&
          notification.is_read
        ) {
          return false;
        }

        if (
          filter !== "all" &&
          filter !== "unread" &&
          notification.type !== filter
        ) {
          return false;
        }

        const term =
          search.toLowerCase();

        if (!term) return true;

        return (
          notification.title
            .toLowerCase()
            .includes(term) ||
          notification.message
            .toLowerCase()
            .includes(term)
        );
      }
    );
  }, [
    notifications,
    search,
    filter,
  ]);


    const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};

    filteredNotifications.forEach((notification) => {
      const groupLabel = getDateGroup(
        notification.created_at
      );

      if (!groups[groupLabel]) {
        groups[groupLabel] = [];
      }

      groups[groupLabel].push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  async function handleMarkAllRead() {
    if (!userId || unreadCount === 0) return;

    setMarkingAllRead(true);
    setMessage("");

    try {
      const { error } =
        await markAllNotificationsRead(userId);

      if (error) {
        throw error;
      }

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to mark notifications as read."
      );
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleOpenNotification(
    notification: Notification
  ) {
    setMessage("");

    try {
      if (!notification.is_read) {
        const { error } = await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("id", notification.id)
          .eq("user_id", notification.user_id);

        if (error) {
          throw error;
        }

        setNotifications((currentNotifications) =>
          currentNotifications.map(
            (currentNotification) =>
              currentNotification.id ===
              notification.id
                ? {
                    ...currentNotification,
                    is_read: true,
                  }
                : currentNotification
          )
        );
      }

      if (notification.circle_id) {
        router.push(
          `/circles/${notification.circle_id}`
        );
        return;
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to open the notification."
      );
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "invite":
      case "invite_accepted":
      case "invite_declined":
        return Mail;

      case "contribution":
        return CircleDollarSign;

      case "payout":
        return Gift;

      case "wallet":
        return Wallet;

      case "circle_started":
        return Play;

      case "round_completed":
        return RotateCw;

      case "circle_completed":
        return Trophy;

      default:
        return Bell;
    }
  }

  function getNotificationStyles(type: string) {
    switch (type) {
      case "invite":
      case "invite_accepted":
        return "bg-blue-100 text-blue-700";

      case "invite_declined":
        return "bg-red-100 text-red-700";

      case "contribution":
        return "bg-green-100 text-green-700";

      case "payout":
        return "bg-purple-100 text-purple-700";

      case "wallet":
        return "bg-cyan-100 text-cyan-700";

      case "circle_started":
        return "bg-emerald-100 text-emerald-700";

      case "round_completed":
        return "bg-orange-100 text-orange-700";

      case "circle_completed":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function formatNotificationTime(createdAt: string) {
    const date = new Date(createdAt);

    return date.toLocaleTimeString("en-GH", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getDateGroup(createdAt: string) {
  const notificationDate = new Date(createdAt);
  const today = new Date();

  const notificationDay = new Date(
    notificationDate.getFullYear(),
    notificationDate.getMonth(),
    notificationDate.getDate()
  );

  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const differenceInDays = Math.round(
    (todayDay.getTime() -
      notificationDay.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  return notificationDate.toLocaleDateString(
    "en-GH",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

  const filterOptions: Array<{
    value: FilterType;
    label: string;
  }> = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "unread",
      label: "Unread",
    },
    {
      value: "invite",
      label: "Invitations",
    },
    {
      value: "contribution",
      label: "Contributions",
    },
    {
      value: "payout",
      label: "Payouts",
    },
    {
      value: "wallet",
      label: "Wallet",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                    Account activity
                  </p>

                  <h1 className="mt-2 text-4xl font-bold text-gray-900">
                    Notifications
                  </h1>

                  <p className="mt-2 max-w-2xl text-gray-600">
                    Review important updates about your circles,
                    contributions, payouts, and wallet.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleMarkAllRead}
                  disabled={
                    unreadCount === 0 || markingAllRead
                  }
                >
                  <CheckCheck className="mr-2 h-5 w-5" />

                  {markingAllRead
                    ? "Updating..."
                    : "Mark all read"}
                </Button>
              </div>

              {message && (
                <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
                  {message}
                </p>
              )}

              <Card className="mt-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search notifications..."
                      className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Filter className="h-5 w-5" />

                    <span>
                      {filteredNotifications.length} result
                      {filteredNotifications.length === 1
                        ? ""
                        : "s"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFilter(option.value)
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        filter === option.value
                          ? "bg-green-700 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Card>

              {loading ? (
                <Card className="mt-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Bell className="h-7 w-7 animate-pulse" />
                  </div>

                  <p className="mt-4 font-medium text-gray-600">
                    Loading notifications...
                  </p>
                </Card>
              ) : filteredNotifications.length === 0 ? (
                <Card className="mt-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <Bell className="h-8 w-8" />
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-gray-900">
                    No notifications found
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-gray-500">
                    {search || filter !== "all"
                      ? "Try changing your search or selected filter."
                      : "Important updates about your ChainSave account will appear here."}
                  </p>

                  {(search || filter !== "all") && (
                    <Button
                      variant="secondary"
                      className="mt-6"
                      onClick={() => {
                        setSearch("");
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="mt-8 space-y-10">
                  {Object.entries(groupedNotifications).map(
                    ([groupName, groupNotifications]) => (
                      <section key={groupName}>
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-bold text-gray-900">
                            {groupName}
                          </h2>

                          <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                            {groupNotifications.length}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {groupNotifications.map(
                            (notification) => {
                              const NotificationIcon =
                                getNotificationIcon(
                                  notification.type
                                );

                              const iconStyles =
                                getNotificationStyles(
                                  notification.type
                                );

                              return (
                                <button
                                  key={notification.id}
                                  type="button"
                                  onClick={() =>
                                    handleOpenNotification(
                                      notification
                                    )
                                  }
                                  className={`flex w-full flex-col gap-4 rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center ${
                                    notification.is_read
                                      ? "border-gray-200 bg-white"
                                      : "border-green-200 bg-green-50/50"
                                  }`}
                                >
                                  <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconStyles}`}
                                  >
                                    <NotificationIcon className="h-6 w-6" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <div className="flex items-center gap-3">
                                          <h3 className="font-bold text-gray-900">
                                            {notification.title}
                                          </h3>

                                          {!notification.is_read && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                                          )}
                                        </div>

                                        <p className="mt-2 leading-6 text-gray-600">
                                          {notification.message}
                                        </p>
                                      </div>

                                      <p className="shrink-0 text-sm text-gray-400">
                                        {formatNotificationTime(
                                          notification.created_at
                                        )}
                                      </p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                      <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${iconStyles}`}
                                      >
                                        {formatNotificationType(
                                          notification.type
                                        )}
                                      </span>

                                      <span className="text-xs text-gray-400">
                                        {notification.is_read
                                          ? "Read"
                                          : "Unread"}
                                      </span>

                                      {notification.circle_id && (
                                        <span className="text-xs font-semibold text-green-700">
                                          Open circle
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </section>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}


function getDateGroup(createdAt: string) {
  const notificationDate = new Date(createdAt);
  const today = new Date();

  const notificationDay = new Date(
    notificationDate.getFullYear(),
    notificationDate.getMonth(),
    notificationDate.getDate()
  );

  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const differenceInDays = Math.round(
    (todayDay.getTime() -
      notificationDay.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  return notificationDate.toLocaleDateString(
    "en-GH",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatNotificationType(type: string) {
  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}