import { supabase } from "@/lib/supabase";

export type NotificationType =
  | "invite"
  | "invite_accepted"
  | "invite_declined"
  | "contribution"
  | "payout"
  | "wallet"
  | "circle_started"
  | "round_completed"
  | "circle_completed"
  | "system";

export async function getNotifications(
  userId: string,
  limit?: number
) {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

export async function getUnreadCount(
  userId: string
) {
  return supabase
    .from("notifications")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .eq("is_read", false);
}

export async function markNotificationRead(
  id: string
) {
  return supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", id);
}

export async function markAllNotificationsRead(
  userId: string
) {
  return supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", userId)
    .eq("is_read", false);
}