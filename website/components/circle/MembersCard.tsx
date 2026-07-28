"use client";

import { UserPlus } from "lucide-react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { CircleMember } from "@/components/circle/types";
import { getMemberLabel } from "@/components/circle/helpers";

type MembersCardProps = {
  members: CircleMember[];
  acceptedMembersCount: number;
  pendingMembersCount: number;
  maxMembers: number;
  isOwner: boolean;
  onInvite: () => void;
};

export default function MembersCard({
  members,
  acceptedMembersCount,
  pendingMembersCount,
  maxMembers,
  isOwner,
  onInvite,
}: MembersCardProps) {
  const remainingMemberSlots = Math.max(
    maxMembers - members.length,
    0
  );

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Members
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {acceptedMembersCount} accepted ·{" "}
            {pendingMembersCount} pending ·{" "}
            {remainingMemberSlots} spaces remaining
          </p>
        </div>

        {isOwner && (
          <Button onClick={onInvite}>
            <UserPlus className="mr-2 h-5 w-5" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="font-semibold text-gray-900">
              No members yet
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Invite people to join this savings circle.
            </p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${
                    member.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : member.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {member.email.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-900">
                    {getMemberLabel(member)}
                  </p>

                  <p className="truncate text-sm text-gray-500">
                    {member.email}
                  </p>

                  <p className="mt-1 text-xs capitalize text-gray-400">
                    {member.role}
                    {member.joined_at
                      ? ` · Joined ${new Date(
                          member.joined_at
                        ).toLocaleDateString()}`
                      : " · Invitation pending"}
                  </p>
                </div>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  member.status === "accepted"
                    ? "bg-green-100 text-green-700"
                    : member.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {member.status}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}