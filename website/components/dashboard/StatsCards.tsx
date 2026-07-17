import Card from "@/components/ui/Card";

const stats = [
  {
    label: "Total Savings",
    value: "₵0.00",
    valueClass: "text-green-700",
  },
  {
    label: "Wallet Balance",
    value: "₵0.00",
    valueClass: "text-gray-900",
  },
  {
    label: "Active Circles",
    value: "0",
    valueClass: "text-gray-900",
  },
  {
    label: "Next Contribution",
    value: "None",
    valueClass: "text-gray-900",
  },
];

export default function StatsCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <p className="text-sm font-medium text-gray-500">
            {stat.label}
          </p>

          <h2 className={`mt-3 text-3xl font-bold ${stat.valueClass}`}>
            {stat.value}
          </h2>
        </Card>
      ))}
    </div>
  );
}