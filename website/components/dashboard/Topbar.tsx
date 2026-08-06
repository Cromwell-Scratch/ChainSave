"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  Menu,
} from "lucide-react";

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

type TopbarProps = {
  onMenuClick?: () => void;
};

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [message, setMessage] = useState("");

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const loadNotifications = useCallback(
    async (currentUserId: string) => {
      setLoading(true);
      setMessage("");

      try {
        const { data, error } = await supabase
          .from("notifications")
          .select(
            `
              id,
              user_id,
              circle_id,
              title,
              message,
              type,
              is_read,
              created_at
            `
          )
          .eq("user_id", currentUserId)
          .order("created_at", {
            ascending: false,
          })
          .limit(8);

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
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const initialSource =
        user.user_metadata?.full_name ||
        user.email ||
        "U";

      setUserInitial(
        String(initialSource)
          .trim()
          .charAt(0)
          .toUpperCase()
      );

      await loadNotifications(user.id);
    }

    loadUser();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, userId]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  async function markNotificationRead(
    notification: Notification
  ) {
    if (notification.is_read) {
      openNotification(notification);
      return;
    }

    try {
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
        currentNotifications.map((currentNotification) =>
          currentNotification.id === notification.id
            ? {
                ...currentNotification,
                is_read: true,
              }
            : currentNotification
        )
      );

      openNotification({
        ...notification,
        is_read: true,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the notification."
      );
    }
  }

  async function markAllAsRead() {
    if (!userId || unreadCount === 0) return;

    setMarkingAllRead(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("user_id", userId)
        .eq("is_read", false);

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

  function openNotification(
    notification: Notification
  ) {
    setShowNotifications(false);

    if (notification.circle_id) {
      router.push(
        `/circles/${notification.circle_id}`
      );
      return;
    }

    router.push("/notifications");
  }

  function formatNotificationTime(
    createdAt: string
  ) {
    const createdDate = new Date(createdAt);
    const now = new Date();

    const difference =
      now.getTime() - createdDate.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return createdDate.toLocaleDateString(
      "en-GH",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function handleMenuClick() {
    if (onMenuClick) {
      onMenuClick();
      return;
    }

    window.dispatchEvent(
      new Event(
        "chainsave:open-mobile-menu"
      )
    );
  }

  return (
    <header className="relative flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
      <button
        type="button"
        onClick={handleMenuClick}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <div
          ref={dropdownRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() =>
              setShowNotifications((current) => !current)
            }
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
            aria-label="Open notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="fixed left-4 right-4 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[360px]">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <h2 className="font-bold text-gray-900">
                    Notifications
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {unreadCount === 0
                      ? "You are all caught up"
                      : `${unreadCount} unread notification${
                          unreadCount === 1
                            ? ""
                            : "s"
                        }`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={
                    unreadCount === 0 ||
                    markingAllRead
                  }
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {markingAllRead ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}

                  Mark all read
                </button>
              </div>

              {message && (
                <p className="m-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {message}
                </p>
              )}

              <div className="max-h-[430px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center gap-3 p-10 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <Bell className="h-6 w-6" />
                    </div>

                    <h3 className="mt-4 font-bold text-gray-900">
                      No notifications yet
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Important account and circle
                      updates will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() =>
                        markNotificationRead(
                          notification
                        )
                      }
                      className={`flex w-full gap-4 border-b border-gray-100 px-5 py-4 text-left transition hover:bg-gray-50 ${
                        notification.is_read
                          ? "bg-white"
                          : "bg-green-50/60"
                      }`}
                    >
                      <div
                        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          notification.is_read
                            ? "bg-gray-100 text-gray-500"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {notification.is_read ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-gray-900">
                            {notification.title}
                          </p>

                          {!notification.is_read && (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" />
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          {formatNotificationTime(
                            notification.created_at
                          )}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowNotifications(false);
                  router.push("/notifications");
                }}
                className="flex w-full items-center justify-center gap-2 border-t border-gray-100 px-5 py-4 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                View all notifications
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 font-semibold text-white">
          {userInitial}
        </div>
      </div>
    </header>
  );
}