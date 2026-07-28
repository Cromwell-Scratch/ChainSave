"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  Save,
  Search,
  Send,
  Users,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

type NotificationType =
  | "system"
  | "wallet"
  | "savings"
  | "security"
  | "promotion";

type NotificationAudience =
  | "all_users"
  | "admins"
  | "selected_users";

type NotificationStatus =
  | "draft"
  | "scheduled"
  | "sent";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};

export default function CreateNotificationPage() {
  const router = useRouter();

  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<
    string[]
  >([]);

  const [usersLoading, setUsersLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [type, setType] =
    useState<NotificationType>("system");

  const [audience, setAudience] =
    useState<NotificationAudience>("all_users");

  const [sendImmediately, setSendImmediately] =
    useState(true);

  const [scheduledAt, setScheduledAt] =
    useState("");

  const [userSearch, setUserSearch] =
    useState("");

  const [feedback, setFeedback] =
    useState("");

  useEffect(() => {
    async function loadUsers() {
      setUsersLoading(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            role
          `)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        setUsers((data as Profile[] | null) ?? []);
      } catch (error) {
        console.error(
          "Unable to load notification recipients:",
          error
        );

        setFeedback(
          error instanceof Error
            ? error.message
            : "Unable to load users."
        );
      } finally {
        setUsersLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = userSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const searchableText = [
        user.full_name ?? "",
        user.email ?? "",
        user.role,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [userSearch, users]);

  const allVisibleUsersSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) =>
      selectedUsers.includes(user.id)
    );

  function toggleSelectedUser(userId: string) {
    setSelectedUsers((current) => {
      if (current.includes(userId)) {
        return current.filter(
          (id) => id !== userId
        );
      }

      return [...current, userId];
    });
  }

  function toggleAllVisibleUsers() {
    const visibleIds = filteredUsers.map(
      (user) => user.id
    );

    setSelectedUsers((current) => {
      if (allVisibleUsersSelected) {
        return current.filter(
          (id) => !visibleIds.includes(id)
        );
      }

      return Array.from(
        new Set([...current, ...visibleIds])
      );
    });
  }

  function getRecipientIds() {
    if (audience === "all_users") {
      return users.map((user) => user.id);
    }

    if (audience === "admins") {
      return users
        .filter(
          (user) =>
            user.role.toLowerCase() === "admin"
        )
        .map((user) => user.id);
    }

    return selectedUsers;
  }

  function validateForm(
    status: NotificationStatus
  ) {
    if (!title.trim()) {
      return "Enter a notification title.";
    }

    if (!message.trim()) {
      return "Enter a notification message.";
    }

    if (
      status === "scheduled" &&
      !scheduledAt
    ) {
      return "Choose a date and time for the scheduled notification.";
    }

    if (
      status === "scheduled" &&
      new Date(scheduledAt).getTime() <=
        Date.now()
    ) {
      return "The scheduled date must be in the future.";
    }

    const recipients = getRecipientIds();

    if (recipients.length === 0) {
      if (audience === "selected_users") {
        return "Select at least one user.";
      }

      if (audience === "admins") {
        return "No admin accounts were found.";
      }

      return "No users were found.";
    }

    return "";
  }

  async function createNotification(
    status: NotificationStatus
  ) {
    setFeedback("");

    const validationError =
      validateForm(status);

    if (validationError) {
      setFeedback(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your admin session could not be verified."
        );
      }

      const recipientIds = getRecipientIds();

      const rows = recipientIds.map(
        (userId) => ({
          user_id: userId,
          circle_id: null,
          title: title.trim(),
          message: message.trim(),
          type,
          audience,
          status,
          is_read: false,
          created_by: user.id,

          scheduled_at:
            status === "scheduled"
              ? new Date(
                  scheduledAt
                ).toISOString()
              : null,
        })
      );

      const { error } = await supabase
        .from("notifications")
        .insert(rows);

      if (error) {
        throw error;
      }

      router.push("/admin/notifications");
      router.refresh();
    } catch (error) {
      console.error(
        "Unable to create notification:",
        error
      );

      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to create notification."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const recipientCount =
    getRecipientIds().length;

  return (
    <section className="p-6 lg:p-8">
      <Link
        href="/admin/notifications"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Notifications
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <Bell className="h-7 w-7" />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Communication
          </p>

          <h1 className="mt-1 text-4xl font-bold text-gray-950">
            Create Notification
          </h1>

          <p className="mt-2 text-gray-600">
            Send an announcement to ChainSave
            users.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">
          {feedback}
        </div>
      )}

      <Card className="mt-8">
        <div className="grid gap-6">
          <div>
            <label
              htmlFor="notification-title"
              className="text-sm font-semibold text-gray-800"
            >
              Title
            </label>

            <Input
              id="notification-title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Enter the notification title"
              className="mt-2 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="notification-message"
                className="text-sm font-semibold text-gray-800"
              >
                Message
              </label>

              <p className="text-xs text-gray-500">
                {message.length} characters
              </p>
            </div>

            <textarea
              id="notification-message"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              rows={6}
              placeholder="Write the notification message"
              className="mt-2 w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="notification-type"
                className="text-sm font-semibold text-gray-800"
              >
                Type
              </label>

              <select
                id="notification-type"
                value={type}
                onChange={(event) =>
                  setType(
                    event.target
                      .value as NotificationType
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              >
                <option value="system">
                  System
                </option>

                <option value="wallet">
                  Wallet
                </option>

                <option value="savings">
                  Savings
                </option>

                <option value="security">
                  Security
                </option>

                <option value="promotion">
                  Promotion
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="notification-audience"
                className="text-sm font-semibold text-gray-800"
              >
                Audience
              </label>

              <select
                id="notification-audience"
                value={audience}
                onChange={(event) => {
                  setAudience(
                    event.target
                      .value as NotificationAudience
                  );

                  setFeedback("");
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              >
                <option value="all_users">
                  All Users
                </option>

                <option value="admins">
                  Admins Only
                </option>

                <option value="selected_users">
                  Selected Users
                </option>
              </select>

              <p className="mt-2 text-sm text-gray-500">
                {usersLoading
                  ? "Loading recipients..."
                  : `${recipientCount} recipient${
                      recipientCount === 1
                        ? ""
                        : "s"
                    }`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {audience === "selected_users" && (
        <Card className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-700" />

                <h2 className="text-xl font-bold text-gray-950">
                  Select Users
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {selectedUsers.length} user
                {selectedUsers.length === 1
                  ? ""
                  : "s"}{" "}
                selected
              </p>
            </div>

            <button
              type="button"
              onClick={toggleAllVisibleUsers}
              disabled={
                usersLoading ||
                filteredUsers.length === 0
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allVisibleUsersSelected
                ? "Clear Visible"
                : "Select Visible"}
            </button>
          </div>

          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <Input
              type="search"
              value={userSearch}
              onChange={(event) =>
                setUserSearch(
                  event.target.value
                )
              }
              placeholder="Search by name, email or role"
              className="pl-12 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
            {usersLoading ? (
              <p className="rounded-xl bg-gray-50 p-5 text-gray-600">
                Loading users...
              </p>
            ) : filteredUsers.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-5 text-center text-gray-600">
                No users found.
              </p>
            ) : (
              filteredUsers.map((profile) => {
                const selected =
                  selectedUsers.includes(
                    profile.id
                  );

                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() =>
                      toggleSelectedUser(
                        profile.id
                      )
                    }
                    className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-950">
                        {profile.full_name?.trim() ||
                          "No name provided"}
                      </p>

                      <p className="mt-1 truncate text-sm text-gray-600">
                        {profile.email ||
                          "No email available"}
                      </p>

                      <p className="mt-1 text-xs font-semibold capitalize text-gray-500">
                        {profile.role}
                      </p>
                    </div>

                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selected && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="text-xl font-bold text-gray-950">
          Delivery
        </h2>

        <div className="mt-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={sendImmediately}
              onChange={(event) =>
                setSendImmediately(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4 accent-green-600"
            />

            <span>
              <span className="block font-semibold text-gray-900">
                Send immediately
              </span>

              <span className="mt-1 block text-sm text-gray-500">
                Turn this off to schedule the
                notification for later.
              </span>
            </span>
          </label>
        </div>

        {!sendImmediately && (
          <div className="mt-6">
            <label
              htmlFor="scheduled-at"
              className="text-sm font-semibold text-gray-800"
            >
              Schedule date and time
            </label>

            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) =>
                setScheduledAt(
                  event.target.value
                )
              }
              className="mt-2 text-gray-900"
            />
          </div>
        )}
      </Card>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() =>
            createNotification("draft")
          }
          disabled={
            submitting || usersLoading
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-5 w-5" />

          {submitting
            ? "Saving..."
            : "Save Draft"}
        </button>

        <button
          type="button"
          onClick={() =>
            createNotification(
              sendImmediately
                ? "sent"
                : "scheduled"
            )
          }
          disabled={
            submitting || usersLoading
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-5 w-5" />

          {submitting
            ? "Processing..."
            : sendImmediately
              ? "Publish"
              : "Schedule"}
        </button>
      </div>
    </section>
  );
}