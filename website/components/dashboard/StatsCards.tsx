import Card from "@/components/ui/Card";
import {
  Wallet,
  PiggyBank,
  Users,
  Mail,
} from "lucide-react";

type StatsCardsProps = {
  walletBalance: number;
  totalSavings: number;
  activeCircles: number;
  pendingInvites: number;
};

export default function StatsCards({
  walletBalance,
  totalSavings,
  activeCircles,
  pendingInvites,
}: StatsCardsProps) {
  const formatCurrency = (amount: number) =>
    `GHS ${amount.toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const stats = [
    {
      label: "Wallet Balance",
      value: formatCurrency(walletBalance),
      icon: Wallet,
      color: "text-green-700",
      bg: "bg-green-100",
    },
    {
      label: "Total Savings",
      value: formatCurrency(totalSavings),
      icon: PiggyBank,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    {
      label: "Active Circles",
      value: String(activeCircles),
      icon: Users,
      color: "text-purple-700",
      bg: "bg-purple-100",
    },
    {
      label: "Pending Invitations",
      value: String(pendingInvites),
      icon: Mail,
      color: "text-orange-700",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>

                <h2 className={`mt-3 text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </h2>
              </div>

              <div className={`rounded-full p-3 ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}