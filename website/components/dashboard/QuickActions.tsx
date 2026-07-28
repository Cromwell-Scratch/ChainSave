"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  PlusCircle,
  Users,
  Wallet,
  ArrowUpCircle,
} from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900">
        Quick Actions
      </h2>

      <p className="mt-2 text-gray-500">
        Choose what you want to do next.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <Button
          onClick={() => router.push("/create-circle")}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Circle
        </Button>

        <Button
        variant="secondary"
        onClick={() => router.push("/join-circle")}
        >
        <Users className="mr-2 h-5 w-5" />
         Join Circle
        </Button>

        <Button
          variant="secondary"
          onClick={() => router.push("/wallet")}
        >
          <Wallet className="mr-2 h-5 w-5" />
          Deposit Funds
        </Button>

        <Button
          variant="secondary"
          onClick={() => router.push("/wallet")}
        >
          <ArrowUpCircle className="mr-2 h-5 w-5" />
          Withdraw
        </Button>
      </div>
    </Card>
  );
}