import Card from "@/components/ui/Card";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
} from "lucide-react";

const activities = [
  {
    title: "Deposit",
    amount: "+₵500",
    date: "Today • 9:15 AM",
    color: "text-green-600",
    icon: ArrowDownCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    title: "Joined Circle",
    amount: "Family Circle",
    date: "Yesterday • 5:42 PM",
    color: "text-blue-600",
    icon: Users,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "Withdrawal",
    amount: "-₵100",
    date: "Jul 10 • 11:20 AM",
    color: "text-red-600",
    icon: ArrowUpCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-100"
  },
];

export default function ActivityList() {
  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
           Recent Activity
      </h2>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 hover:bg-gray-50 rounded-lg px-3 py-2 transition duration-200"
          >
            <div className="flex items-center gap-4">
  <activity.icon
    className={`w-7 h-7 ${activity.iconColor}`}
  />

  <div>
    <p className="font-semibold text-gray-800">
      {activity.title}
    </p>

    <p className="text-sm text-gray-500">
      {activity.date}
    </p>
  </div>
</div>

            <span className={`font-bold ${activity.color}`}>
              {activity.amount}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}