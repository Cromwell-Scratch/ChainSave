"use client";

import {
  CheckCircle2,
  Clock3,
  PlayCircle,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import type {
  CircleMember,
  CirclePayout,
} from "@/components/circle/types";

import {
  formatAmount,
  getMemberLabel,
} from "@/components/circle/helpers";

type Props = {
  payouts: CirclePayout[];
  members: CircleMember[];
  currency: string;

  isOwner: boolean;

  loading: boolean;

  onStartCircle: () => void;
};

export default function PayoutQueueCard({
  payouts,
  members,
  currency,
  isOwner,
  loading,
  onStartCircle,
}: Props) {
  return (
    <Card className="mt-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Payout Queue
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            The payout order for this savings circle.
          </p>
        </div>

        {isOwner && payouts.length === 0 && (
          <Button
            onClick={onStartCircle}
            disabled={loading}
          >
            <PlayCircle className="mr-2 h-5 w-5" />

            {loading
              ? "Starting..."
              : "Start Circle"}
          </Button>
        )}
      </div>

      <div className="mt-6">
        {payouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <Clock3 className="mx-auto h-10 w-10 text-gray-400" />

            <h3 className="mt-4 text-lg font-bold text-gray-900">
              No payout queue yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Start the circle to generate the
              payout order.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => {
              const member = members.find(
                (m) =>
                  m.id === payout.member_id
              );

              return (
                <div
                  key={payout.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                      {payout.payout_order}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {member
                          ? getMemberLabel(member)
                          : "Member"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {currency}{" "}
                        {formatAmount(
                          payout.amount
                        )}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      payout.status ===
                      "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />

                    {payout.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}