import {
  Clock3,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import Card from "@/components/ui/Card";

type CircleStatsProps = {
  currency: string;
  totalSaved: number;
  progressPercentage: number;
  acceptedMembersCount: number;
  pendingMembersCount: number;
};

export default function CircleStats({
  currency,
  totalSaved,
  progressPercentage,
  acceptedMembersCount,
  pendingMembersCount,
}: CircleStatsProps) {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={WalletCards}
        label="Total Saved"
        value={`${currency} ${formatAmount(totalSaved)}`}
        accent="green"
      />

      <SummaryCard
        icon={TrendingUp}
        label="Progress"
        value={`${progressPercentage}%`}
        accent="blue"
      />

      <SummaryCard
        icon={Users}
        label="Accepted Members"
        value={`${acceptedMembersCount}`}
        accent="purple"
      />

      <SummaryCard
        icon={Clock3}
        label="Pending Invitations"
        value={`${pendingMembersCount}`}
        accent="orange"
      />
    </div>
  );
}

type SummaryCardProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  accent: "green" | "blue" | "purple" | "orange";
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: SummaryCardProps) {
  const accentClasses = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-3 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 ${accentClasses[accent]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function formatAmount(amount: number) {
  return Number(amount).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}