import type {
  Circle,
  CircleMember,
} from "@/components/circle/types";

export function formatAmount(
  amount: number,
  locale = "en-GH"
) {
  return Number(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(
  date: string | null,
  locale = "en-GH"
) {
  if (!date) {
    return "Not set";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    locale,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export function formatDateTime(
  date: string | null,
  locale = "en-GH"
) {
  if (!date) {
    return "Date unavailable";
  }

  return new Date(date).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCircleCode(circle: Circle) {
  const prefix = circle.name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");

  return `${prefix}-${circle.id
    .replace(/-/g, "")
    .slice(0, 4)
    .toUpperCase()}`;
}

export function getMemberLabel(
  member: CircleMember
) {
  const emailName = member.email.split("@")[0];

  return emailName
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

export function getAcceptedMembers(
  members: CircleMember[]
) {
  return members.filter(
    (member) => member.status === "accepted"
  );
}

export function getPendingMembers(
  members: CircleMember[]
) {
  return members.filter(
    (member) => member.status === "pending"
  );
}

export function calculateSavingsGoal(
  circle: Circle
) {
  return (
    Number(circle.contribution_amount) *
    Number(circle.max_members)
  );
}

export function calculateProgress(
  totalSaved: number,
  savingsGoal: number
) {
  if (savingsGoal <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((totalSaved / savingsGoal) * 100)
  );
}