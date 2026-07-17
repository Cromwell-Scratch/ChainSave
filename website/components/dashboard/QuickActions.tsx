import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function QuickActions() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900">
        Quick Actions
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Choose what you want to do next.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <Button>Create Circle</Button>

        <Button variant="secondary">
          Join Circle
        </Button>

        <Button variant="secondary">
          Deposit Funds
        </Button>

        <Button variant="secondary">
          Withdraw
        </Button>
      </div>
    </Card>
  );
}