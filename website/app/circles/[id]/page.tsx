"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

type Circle = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  currency: string;
  contribution_frequency: string;
  max_members: number;
  start_date: string | null;
  privacy: string;
  created_at: string;
};

type CircleMember = {
  id: string;
  user_id: string | null;
  email: string;
  role: string;
  status: string;
  joined_at: string | null;
};

type Contribution = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string;
  member_id: string;
};

export default function CircleDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  const [showContributionModal, setShowContributionModal] =
    useState(false);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionLoading, setContributionLoading] =
    useState(false);
  const [contributionMessage, setContributionMessage] = useState("");

  useEffect(() => {
    async function loadCircle() {
      setLoading(true);
      setMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          setMessage(userError.message);
          setLoading(false);
          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: circleData, error: circleError } =
          await supabase
            .from("circles")
            .select(
              "id, owner_id, name, description, contribution_amount, currency, contribution_frequency, max_members, start_date, privacy, created_at"
            )
            .eq("id", params.id)
            .single();

        if (circleError) {
          setMessage(circleError.message);
          setLoading(false);
          return;
        }

        setCircle(circleData as Circle);

        const { data: membersData, error: membersError } =
          await supabase
            .from("circle_members")
            .select("id, user_id, email, role, status, joined_at")
            .eq("circle_id", params.id)
            .order("created_at", { ascending: true });

        if (membersError) {
          setMessage(membersError.message);
        } else {
          setMembers((membersData as CircleMember[]) ?? []);
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the circle."
        );
      } finally {
        const { data: contributionData, error: contributionError } =
  await supabase
    .from("contributions")
    .select(
      "id, amount, currency, status, paid_at, member_id"
    )
    .eq("circle_id", params.id)
    .order("paid_at", { ascending: false });

if (contributionError) {
  setMessage(contributionError.message);
} else {
  setContributions(contributionData ?? []);
}
        setLoading(false);
      }
    }

    loadCircle();
  }, [params.id, router]);

  async function handleInviteMember(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setInviteLoading(true);
    setInviteMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setInviteMessage(userError.message);
        return;
      }

      if (!user) {
        setInviteMessage("You must be logged in.");
        return;
      }

      const normalizedEmail = inviteEmail.trim().toLowerCase();

      if (!normalizedEmail) {
        setInviteMessage("Enter an email address.");
        return;
      }

      const existingMember = members.find(
        (member) =>
          member.email.toLowerCase() === normalizedEmail
      );

      if (existingMember) {
        setInviteMessage(
          "This person is already a member or has a pending invitation."
        );
        return;
      }

      if (circle && members.length >= circle.max_members) {
        setInviteMessage(
          "This circle has reached its maximum number of members."
        );
        return;
      }

      const { data: newMember, error } = await supabase
        .from("circle_members")
        .insert({
          circle_id: params.id,
          user_id: null,
          email: normalizedEmail,
          role: "member",
          status: "pending",
          joined_at: null,
          invited_by: user.id,
        })
        .select(
          "id, user_id, email, role, status, joined_at"
        )
        .single();

      if (error) {
        setInviteMessage(error.message);
        return;
      }

      setMembers((currentMembers) => [
        ...currentMembers,
        newMember as CircleMember,
        
      ]);

      setInviteEmail("");
      setInviteMessage("");
      setShowInviteModal(false);
    } catch (error) {
      setInviteMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the invitation."
      );
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleContribution(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setContributionLoading(true);
    setContributionMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setContributionMessage(userError.message);
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const amount = Number(contributionAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        setContributionMessage(
          "Enter a valid contribution amount."
        );
        return;
      }

      const currentMember = members.find(
        (member) =>
          member.user_id === user.id &&
          member.status === "accepted"
      );

      if (!currentMember) {
        setContributionMessage(
          "You must be an accepted member to contribute."
        );
        return;
      }

      const { error } = await supabase
        .from("contributions")
        .insert({
          circle_id: params.id,
          member_id: currentMember.id,
          amount,
          currency: circle?.currency ?? "GHS",
          payment_method: "wallet",
          status: "completed",
          paid_at: new Date().toISOString(),
        });

      if (error) {
        setContributionMessage(error.message);
        return;
      }

      const { data, error: refreshError } = await supabase
  .from("contributions")
  .select(
    "id, amount, currency, status, paid_at, member_id"
  )
  .eq("circle_id", params.id)
  .order("paid_at", { ascending: false });

if (refreshError) {
  setContributionMessage(refreshError.message);
  return;
}

setContributions(data ?? []);

setContributionAmount("");
setContributionMessage("");
setShowContributionModal(false);
    } catch (error) {
      setContributionMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the contribution."
      );
    } finally {
      setContributionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1">
          <Topbar />

          <section className="p-8">
            {loading && (
              <p className="text-gray-600">
                Loading circle...
              </p>
            )}

            {message && (
              <p className="font-medium text-red-600">
                {message}
              </p>
            )}

            {!loading && circle && (
              <>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">
                      {circle.name}
                    </h1>

                    <p className="mt-2 text-gray-600">
                      {circle.description ||
                        "No description provided."}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                    {circle.privacy === "private"
                      ? "Private Circle"
                      : "Public Circle"}
                  </span>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <Card>
                    <p className="text-sm text-gray-500">
                      Contribution
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-green-700">
                      {circle.currency}{" "}
                      {circle.contribution_amount}
                    </h2>
                  </Card>

                  <Card>
                    <p className="text-sm text-gray-500">
                      Frequency
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {circle.contribution_frequency}
                    </h2>
                  </Card>

                  <Card>
                    <p className="text-sm text-gray-500">
                      Maximum Members
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {circle.max_members}
                    </h2>
                  </Card>

                  <Card>
                    <p className="text-sm text-gray-500">
                      Start Date
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {circle.start_date || "Not set"}
                    </h2>
                  </Card>
                </div>

                <div className="mt-8 grid gap-8 xl:grid-cols-2">
                  <Card>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Members
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {members.length} of{" "}
                        {circle.max_members} members
                      </p>
                    </div>

                    <div className="mt-6 space-y-4">
                      {members.length === 0 ? (
                        <p className="text-gray-500">
                          No members yet.
                        </p>
                      ) : (
                        members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 font-semibold text-green-700">
                                {member.email
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-900">
                                  {member.email}
                                </p>

                                <p className="text-sm capitalize text-gray-500">
                                  {member.role}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
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

                    <Button
                      className="mt-6"
                      onClick={() => {
                        setInviteMessage("");
                        setShowInviteModal(true);
                      }}
                    >
                      Invite Member
                    </Button>
                  </Card>

                  <Card>
  <h2 className="text-xl font-bold text-gray-900">
    Recent Contributions
  </h2>

  <div className="mt-5 space-y-4">
    {contributions.length === 0 ? (
      <p className="text-gray-500">
        No contributions yet.
      </p>
    ) : (
      contributions.map((contribution) => (
        <div
          key={contribution.id}
          className="flex items-center justify-between border-b pb-3"
        >
          <div>
            <p className="font-semibold text-gray-900">
              {contribution.currency} {contribution.amount}
            </p>

            <p className="text-sm text-gray-500">
              {new Date(
                contribution.paid_at
              ).toLocaleDateString()}
            </p>
          </div>

          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            {contribution.status}
          </span>
        </div>
      ))
    )}
  </div>

  <Button
    className="mt-6"
    onClick={() => {
      setContributionMessage("");
      setContributionAmount(
        String(circle.contribution_amount)
      );
      setShowContributionModal(true);
    }}
  >
    Make Contribution
  </Button>
</Card>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Invite Member
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Invite someone to join this savings circle.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
                aria-label="Close invite form"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleInviteMember}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email Address
                </label>

                <Input
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(event) =>
                    setInviteEmail(event.target.value)
                  }
                  required
                />
              </div>

              {inviteMessage && (
                <p className="text-sm font-medium text-red-600">
                  {inviteMessage}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={inviteLoading}
                >
                  {inviteLoading
                    ? "Sending..."
                    : "Send Invitation"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showContributionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Make Contribution
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add money to {circle?.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowContributionModal(false)
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
                aria-label="Close contribution form"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleContribution}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Amount
                </label>

                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder={String(
                    circle?.contribution_amount ?? 500
                  )}
                  value={contributionAmount}
                  onChange={(event) =>
                    setContributionAmount(
                      event.target.value
                    )
                  }
                  required
                />

                <p className="mt-2 text-xs text-gray-500">
                  Expected contribution: {circle?.currency}{" "}
                  {circle?.contribution_amount}
                </p>
              </div>

              {contributionMessage && (
                <p className="text-sm font-medium text-red-600">
                  {contributionMessage}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setShowContributionModal(false)
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={contributionLoading}
                >
                  {contributionLoading
                    ? "Processing..."
                    : "Submit Contribution"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}