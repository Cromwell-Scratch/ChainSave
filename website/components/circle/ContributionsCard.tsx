"use client";

import { CalendarDays, WalletCards } from "lucide-react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import type {
  Circle,
  CircleContribution,
  CircleMember,
} from "@/components/circle/types";

import {
  formatAmount,
  formatDate,
  formatDateTime,
  getMemberLabel,
} from "@/components/circle/helpers";

type ContributionsCardProps = {
  circle: Circle;
  contributions: CircleContribution[];
  members: CircleMember[];
  currentMember: CircleMember | undefined;
  walletLoading: boolean;
  contributionLoading: boolean;
  onMakeContribution: () => void;
};

export default function ContributionsCard({
  circle,
  contributions,
  members,
  currentMember,
  walletLoading,
  contributionLoading,
  onMakeContribution,
}: ContributionsCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Contributions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Latest payments made to this circle
          </p>
        </div>

        <div className="rounded-2xl bg-green-100 p-3 text-green-700">
          <WalletCards className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-green-50 p-5">
        <p className="text-sm font-medium text-green-800">
          Expected Contribution
        </p>

        <p className="mt-2 text-3xl font-bold text-green-900">
          {circle.currency}{" "}
          {formatAmount(circle.contribution_amount)}
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm text-green-800">
          <CalendarDays className="h-5 w-5" />

          <span>
            {circle.contribution_frequency} · Starts{" "}
            {formatDate(circle.start_date)}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {contributions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="font-semibold text-gray-900">
              No contributions yet
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Completed contributions will appear here.
            </p>
          </div>
        ) : (
          contributions
            .slice(0, 5)
            .map((contribution) => {
              const member = members.find(
                (m) =>
                  m.id === contribution.member_id
              );

              return (
                <div
                  key={contribution.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {member
                        ? getMemberLabel(member)
                        : "Circle Member"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(
                        contribution.paid_at
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-700">
                      +{contribution.currency}{" "}
                      {formatAmount(
                        contribution.amount
                      )}
                    </p>

                    <span className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                      {contribution.status}
                    </span>
                  </div>
                </div>
              );
            })
        )}
      </div>

      <Button
        className="mt-6 w-full"
        onClick={onMakeContribution}
        disabled={
          !currentMember ||
          walletLoading ||
          contributionLoading
        }
      >
        {walletLoading
          ? "Loading Wallet..."
          : "Make Contribution"}
      </Button>

      {!currentMember && (
        <p className="mt-3 text-center text-xs text-gray-500">
          Only accepted members can contribute.
        </p>
      )}
    </Card>
  );
}