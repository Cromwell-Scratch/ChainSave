"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Globe2,
  Lock,
  MailPlus,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import HeaderStat from "@/components/circle/HeaderStat";
import StatusBadge from "@/components/circle/StatusBadge";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import PayoutQueueCard from "@/components/circle/PayoutQueueCard";
import type { CirclePayout } from "@/components/circle/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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

  started: boolean;
  completed: boolean;

  status: string | null;
  paused_at: string | null;
  completed_at: string | null;
  closed_reason: string | null;
  total_saved: number | string | null;
  current_round: number | string | null;
  next_payout_member: string | null;
  next_contribution_date: string | null;
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

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  date: string;
};

export default function CircleDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [circle, setCircle] =
    useState<Circle | null>(null);

  const [members, setMembers] =
    useState<CircleMember[]>([]);

  const [contributions, setContributions] =
    useState<Contribution[]>([]);

  const [payouts, setPayouts] =
    useState<CirclePayout[]>([]);

  const [startingCircle, setStartingCircle] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [showInviteModal, setShowInviteModal] =
    useState(false);

  const [inviteEmail, setInviteEmail] =
    useState("");

  const [inviteLoading, setInviteLoading] =
    useState(false);

  const [inviteMessage, setInviteMessage] =
    useState("");

  const [
    showContributionModal,
    setShowContributionModal,
  ] = useState(false);

  const [
    contributionAmount,
    setContributionAmount,
  ] = useState("");

  const [
    contributionLoading,
    setContributionLoading,
  ] = useState(false);

  const [
    contributionMessage,
    setContributionMessage,
  ] = useState("");

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [walletLoading, setWalletLoading] =
    useState(false);

  const loadContributions =
    useCallback(async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select(
          "id, amount, currency, status, paid_at, member_id"
        )
        .eq("circle_id", params.id)
        .order("paid_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setContributions(
        (
          (data as Contribution[] | null) ?? []
        ).map((contribution) => ({
          ...contribution,
          amount: Number(contribution.amount),
        }))
      );
    }, [params.id]);

  const loadCircle = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const {
        data: circleData,
        error: circleError,
      } = await supabase
        .from("circles")
        .select(`
          id,
          owner_id,
          name,
          description,
          contribution_amount,
          currency,
          contribution_frequency,
          max_members,
          start_date,
          privacy,
          created_at,
          started,
          completed,
          status,
          paused_at,
          completed_at,
          closed_reason,
          total_saved,
          current_round,
          next_payout_member,
          next_contribution_date
        `)
        .eq("id", params.id)
        .single();

      if (circleError) {
        throw circleError;
      }

      setCircle({
        ...(circleData as Circle),
        contribution_amount: Number(
          circleData.contribution_amount
        ),
        max_members: Number(
          circleData.max_members
        ),
        started: Boolean(circleData.started),
        completed: Boolean(circleData.completed),
        total_saved: Number(
          circleData.total_saved ?? 0
        ),
        current_round: Number(
          circleData.current_round ?? 1
        ),
      });

      const {
        data: membersData,
        error: membersError,
      } = await supabase
        .from("circle_members")
        .select(
          "id, user_id, email, role, status, joined_at"
        )
        .eq("circle_id", params.id)
        .order("created_at", {
          ascending: true,
        });

      if (membersError) {
        throw membersError;
      }

      setMembers(
        (membersData as CircleMember[] | null) ??
          []
      );

      await loadContributions();

      const {
        data: payoutData,
        error: payoutError,
      } = await supabase
        .from("circle_payouts")
        .select(`
          id,
          circle_id,
          member_id,
          payout_order,
          amount,
          status,
          paid_at,
          created_at
        `)
        .eq("circle_id", params.id)
        .order("payout_order");

      if (payoutError) {
        throw payoutError;
      }

      setPayouts(
        (
          (payoutData as CirclePayout[] | null) ??
          []
        ).map((payout) => ({
          ...payout,
          amount: Number(payout.amount),
          payout_order: Number(
            payout.payout_order
          ),
        }))
      );
    } catch (error) {
      console.error(
        "Unable to load circle:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load this circle."
      );
    } finally {
      setLoading(false);
    }
  }, [loadContributions, params.id, router]);

  useEffect(() => {
    loadCircle();
  }, [loadCircle]);

  const acceptedMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          member.status === "accepted"
      ),
    [members]
  );

  const pendingMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          member.status === "pending"
      ),
    [members]
  );

  const totalSaved = useMemo(
    () =>
      contributions
        .filter(
          (contribution) =>
            contribution.status === "completed"
        )
        .reduce(
          (total, contribution) =>
            total +
            Number(contribution.amount),
          0
        ),
    [contributions]
  );

  const totalPaidOut = useMemo(
    () =>
      payouts
        .filter(
          (payout) =>
            payout.status === "completed" ||
            payout.status === "paid"
        )
        .reduce(
          (total, payout) =>
            total + Number(payout.amount),
          0
        ),
    [payouts]
  );

  const currentPool = Math.max(
    totalSaved - totalPaidOut,
    0
  );

  const savingsGoal = useMemo(() => {
    if (!circle) {
      return 0;
    }

    return (
      Number(circle.contribution_amount) *
      Math.max(acceptedMembers.length, 1)
    );
  }, [acceptedMembers.length, circle]);

  const progressPercentage =
    savingsGoal > 0
      ? Math.min(
          100,
          Math.round(
            (currentPool / savingsGoal) * 100
          )
        )
      : 0;

  const remainingMemberSlots = circle
    ? Math.max(
        circle.max_members - members.length,
        0
      )
    : 0;

  const isOwner =
    Boolean(circle) &&
    circle?.owner_id === currentUserId;

  const currentMember = members.find(
    (member) =>
      member.user_id === currentUserId &&
      member.status === "accepted"
  );

  const numericContributionAmount = Number(
    contributionAmount || 0
  );

  const balanceAfterPayment =
    walletBalance -
    numericContributionAmount;

  const effectiveStatus = useMemo(() => {
    if (!circle) {
      return "active";
    }

    if (
      circle.completed ||
      circle.status === "completed"
    ) {
      return "completed";
    }

    if (circle.status === "paused") {
      return "paused";
    }

    if (
      !circle.started ||
      circle.status === "upcoming"
    ) {
      return "upcoming";
    }

    return circle.status || "active";
  }, [circle]);

  const nextPayout = useMemo(
    () =>
      payouts.find(
        (payout) =>
          payout.status !== "completed" &&
          payout.status !== "paid"
      ),
    [payouts]
  );

  const nextPayoutMember = useMemo(() => {
    if (!nextPayout) {
      return null;
    }

    return members.find(
      (member) =>
        member.id === nextPayout.member_id
    );
  }, [members, nextPayout]);

  const activityItems =
    useMemo<ActivityItem[]>(() => {
      if (!circle) {
        return [];
      }

      const items: ActivityItem[] = [
        {
          id: `circle-${circle.id}`,
          title: "Circle created",
          description: `${circle.name} was created.`,
          date: circle.created_at,
        },
      ];

      members.forEach((member) => {
        if (member.joined_at) {
          items.push({
            id: `member-${member.id}`,
            title: "Member joined",
            description: `${getMemberLabel(
              member
            )} joined the circle.`,
            date: member.joined_at,
          });
        }
      });

      contributions.forEach(
        (contribution) => {
          const member = members.find(
            (item) =>
              item.id ===
              contribution.member_id
          );

          items.push({
            id: `contribution-${contribution.id}`,
            title: "Contribution received",
            description: `${
              member
                ? getMemberLabel(member)
                : "A member"
            } contributed ${
              contribution.currency
            } ${formatAmount(
              contribution.amount
            )}.`,
            date: contribution.paid_at,
          });
        }
      );

      return items
        .sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        )
        .slice(0, 8);
    }, [circle, contributions, members]);

  function formatAmount(amount: number) {
    return Number(amount).toLocaleString(
      "en-GH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "Not set";
    }

    const parsedDate = date.includes("T")
      ? new Date(date)
      : new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString(
      "en-GH",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getMemberLabel(
    member: CircleMember
  ) {
    const emailName =
      member.email.split("@")[0];

    return emailName
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );
  }

  function getCircleCode() {
    if (!circle) {
      return "";
    }

    const prefix = circle.name
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase()
      .padEnd(4, "X");

    return `${prefix}-${circle.id
      .replace(/-/g, "")
      .slice(0, 4)
      .toUpperCase()}`;
  }

  async function copyCircleCode() {
    try {
      await navigator.clipboard.writeText(
        getCircleCode()
      );

      setSuccessMessage(
        "Circle code copied successfully."
      );
    } catch {
      setMessage(
        "Unable to copy the circle code."
      );
    }
  }

  async function loadWalletBalance() {
    setWalletLoading(true);
    setContributionMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return false;
      }

      const {
        data: walletData,
        error: walletError,
      } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (walletError) {
        throw walletError;
      }

      setWalletBalance(
        Number(walletData.balance)
      );

      return true;
    } catch (error) {
      setContributionMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your wallet balance."
      );

      return false;
    } finally {
      setWalletLoading(false);
    }
  }

  async function openContributionModal() {
    if (!circle) {
      return;
    }

    setContributionMessage("");
    setSuccessMessage("");
    setContributionAmount(
      String(circle.contribution_amount)
    );

    const loaded =
      await loadWalletBalance();

    if (loaded) {
      setShowContributionModal(true);
    }
  }

  async function handleInviteMember(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setInviteLoading(true);
    setInviteMessage("");
    setSuccessMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setInviteMessage(
          "You must be logged in."
        );
        return;
      }

      if (!isOwner) {
        setInviteMessage(
          "Only the circle owner can invite members."
        );
        return;
      }

      const normalizedEmail = inviteEmail
        .trim()
        .toLowerCase();

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          normalizedEmail
        )
      ) {
        setInviteMessage(
          "Enter a valid email address."
        );
        return;
      }

      const existingMember = members.find(
        (member) =>
          member.email.toLowerCase() ===
          normalizedEmail
      );

      if (existingMember) {
        setInviteMessage(
          "This person is already a member or has a pending invitation."
        );
        return;
      }

      if (
        circle &&
        members.length >= circle.max_members
      ) {
        setInviteMessage(
          "This circle has reached its maximum number of members."
        );
        return;
      }

      const {
        data: newMember,
        error,
      } = await supabase
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
        throw error;
      }

      setMembers((currentMembers) => [
        ...currentMembers,
        newMember as CircleMember,
      ]);

      const emailResponse = await fetch(
        "/api/invite",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            recipientEmail:
              normalizedEmail,
            inviterName:
              user.user_metadata
                ?.full_name ||
              user.email ||
              "A ChainSave member",
            circleName:
              circle?.name ??
              "Savings Circle",
            description:
              circle?.description,
            contributionAmount:
              circle?.contribution_amount ??
              0,
            currency:
              circle?.currency ?? "GHS",
            frequency:
              circle
                ?.contribution_frequency ??
              "Not specified",
            privacy:
              circle?.privacy ?? "private",
          }),
        }
      );

      let emailResult: {
        success?: boolean;
        error?: string;
      } = {};

      try {
        emailResult =
          await emailResponse.json();
      } catch {
        emailResult = {
          error:
            "The email service returned an invalid response.",
        };
      }

      setInviteEmail("");
      setShowInviteModal(false);

      if (!emailResponse.ok) {
        setSuccessMessage(
          `The in-app invitation was created for ${normalizedEmail}, but the email could not be sent: ${
            emailResult.error ??
            "Unknown email error"
          }`
        );

        return;
      }

      setSuccessMessage(
        `Invitation created and emailed to ${normalizedEmail}.`
      );
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

  async function handleStartCircle() {
    if (!circle) {
      return;
    }

    setStartingCircle(true);
    setMessage("");
    setSuccessMessage("");

    try {
      const { error } =
        await supabase.rpc(
          "start_circle_payouts",
          {
            p_circle_id: circle.id,
          }
        );

      if (error) {
        throw error;
      }

      await loadCircle();

      setSuccessMessage(
        "Savings circle started successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start the circle."
      );
    } finally {
      setStartingCircle(false);
    }
  }

  async function handleStatusChange() {
    if (!circle || !isOwner) {
      return;
    }

    const nextStatus =
      effectiveStatus === "paused"
        ? "active"
        : "paused";

    setUpdatingStatus(true);
    setMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("circles")
        .update({
          status: nextStatus,
          paused_at:
            nextStatus === "paused"
              ? new Date().toISOString()
              : null,
        })
        .eq("id", circle.id);

      if (error) {
        throw error;
      }

      await loadCircle();

      setSuccessMessage(
        nextStatus === "paused"
          ? "Circle paused successfully."
          : "Circle resumed successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the circle status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleContribution(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setContributionLoading(true);
    setContributionMessage("");
    setSuccessMessage("");

    try {
      const circleId = String(params.id);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "/api/contributions/pay",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            circleId,
          }),
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Unable to complete the contribution."
        );
      }

      setWalletBalance(
        Number(result.walletBalance)
      );

      setSuccessMessage(
        `${result.currency} ${Number(
          result.amount
        ).toLocaleString("en-GH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} was contributed successfully for round ${
          result.roundNumber
        }.`
      );

      setShowContributionModal(false);
      setContributionAmount("");

      await loadCircle();
    } catch (error) {
      console.error(
        "Contribution error:",
        error
      );

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

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="p-6 lg:p-8">
            {loading && (
              <p className="text-gray-600">
                Loading circle...
              </p>
            )}

            {message && (
              <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700">
                {message}
              </p>
            )}

            {successMessage && (
              <p className="mb-6 rounded-xl bg-green-50 px-4 py-3 font-medium text-green-700">
                {successMessage}
              </p>
            )}

            {!loading &&
              !message &&
              circle && (
                <>
                  <Card className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white">
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
                    <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/5" />

                    <div className="relative">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                              Savings Circle
                            </span>

                            <StatusBadge
                              status={
                                effectiveStatus
                              }
                            />

                            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                              {circle.privacy ===
                              "private" ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Globe2 className="h-4 w-4" />
                              )}

                              {circle.privacy ===
                              "private"
                                ? "Private"
                                : "Public"}
                            </span>
                          </div>

                          <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
                            {circle.name}
                          </h1>

                          <p className="mt-3 max-w-2xl text-green-100">
                            {circle.description ||
                              "No description provided."}
                          </p>

                          {isOwner && (
                            <div className="mt-6 flex flex-wrap gap-3">
                              <Button
                                onClick={() => {
                                  setInviteMessage(
                                    ""
                                  );
                                  setShowInviteModal(
                                    true
                                  );
                                }}
                              >
                                <UserPlus className="mr-2 h-5 w-5" />
                                Invite Member
                              </Button>

                              <button
                                type="button"
                                onClick={
                                  handleStatusChange
                                }
                                disabled={
                                  updatingStatus ||
                                  effectiveStatus ===
                                    "completed"
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {effectiveStatus ===
                                "paused" ? (
                                  <PlayCircle className="h-5 w-5" />
                                ) : (
                                  <PauseCircle className="h-5 w-5" />
                                )}

                                {updatingStatus
                                  ? "Updating..."
                                  : effectiveStatus ===
                                      "paused"
                                    ? "Resume Circle"
                                    : "Pause Circle"}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl bg-white/15 p-5 backdrop-blur-sm">
                          <p className="text-xs uppercase tracking-wider text-green-100">
                            Circle Code
                          </p>

                          <div className="mt-2 flex items-center gap-3">
                            <p className="text-xl font-bold tracking-wider">
                              {getCircleCode()}
                            </p>

                            <button
                              type="button"
                              onClick={
                                copyCircleCode
                              }
                              className="rounded-lg p-2 transition hover:bg-white/15"
                              aria-label="Copy circle code"
                            >
                              <Copy className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-sm text-green-100">
                              Current pool
                            </p>

                            <p className="mt-1 text-3xl font-bold">
                              {circle.currency}{" "}
                              {formatAmount(
                                currentPool
                              )}
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-green-100">
                            {
                              progressPercentage
                            }
                            % of{" "}
                            {circle.currency}{" "}
                            {formatAmount(
                              savingsGoal
                            )}
                          </p>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-500"
                            style={{
                              width: `${progressPercentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <HeaderStat
                          label="Current Round"
                          value={`${Number(
                            circle.current_round ??
                              1
                          )} of ${Math.max(
                            acceptedMembers.length,
                            1
                          )}`}
                        />

                        <HeaderStat
                          label="Contribution"
                          value={`${
                            circle.currency
                          } ${formatAmount(
                            circle.contribution_amount
                          )}`}
                        />

                        <HeaderStat
                          label="Next Payout"
                          value={
                            nextPayoutMember
                              ? getMemberLabel(
                                  nextPayoutMember
                                )
                              : "Not assigned"
                          }
                        />

                        <HeaderStat
                          label="Next Contribution"
                          value={formatDate(
                            circle.next_contribution_date
                          )}
                        />
                      </div>
                    </div>
                  </Card>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                      icon={WalletCards}
                      label="Total Saved"
                      value={`${
                        circle.currency
                      } ${formatAmount(
                        totalSaved
                      )}`}
                      accent="green"
                    />

                    <SummaryCard
                      icon={TrendingUp}
                      label="Total Paid Out"
                      value={`${
                        circle.currency
                      } ${formatAmount(
                        totalPaidOut
                      )}`}
                      accent="blue"
                    />

                    <SummaryCard
                      icon={Users}
                      label="Accepted Members"
                      value={`${acceptedMembers.length}`}
                      accent="purple"
                    />

                    <SummaryCard
                      icon={Clock3}
                      label="Pending Invitations"
                      value={`${pendingMembers.length}`}
                      accent="orange"
                    />
                  </div>

                  <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Members
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            {
                              acceptedMembers.length
                            }{" "}
                            accepted ·{" "}
                            {
                              pendingMembers.length
                            }{" "}
                            pending ·{" "}
                            {
                              remainingMemberSlots
                            }{" "}
                            spaces remaining
                          </p>
                        </div>

                        {isOwner && (
                          <Button
                            onClick={() => {
                              setInviteMessage(
                                ""
                              );
                              setShowInviteModal(
                                true
                              );
                            }}
                          >
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
                          </div>
                        ) : (
                          members.map(
                            (member) => (
                              <div
                                key={
                                  member.id
                                }
                                className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-center gap-4">
                                  <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${
                                      member.status ===
                                      "accepted"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {member.email
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-gray-900">
                                      {getMemberLabel(
                                        member
                                      )}
                                    </p>

                                    <p className="truncate text-sm text-gray-500">
                                      {
                                        member.email
                                      }
                                    </p>

                                    <p className="mt-1 text-xs capitalize text-gray-400">
                                      {
                                        member.role
                                      }
                                      {member.joined_at
                                        ? ` · Joined ${formatDate(
                                            member.joined_at
                                          )}`
                                        : " · Invitation pending"}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                    member.status ===
                                    "accepted"
                                      ? "bg-green-100 text-green-700"
                                      : member.status ===
                                          "pending"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {
                                    member.status
                                  }
                                </span>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Contributions
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            Latest payments made
                            to this circle
                          </p>
                        </div>

                        <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                          <WalletCards className="h-6 w-6" />
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl bg-green-50 p-5">
                        <p className="text-sm font-medium text-green-800">
                          Expected
                          contribution
                        </p>

                        <p className="mt-2 text-3xl font-bold text-green-900">
                          {circle.currency}{" "}
                          {formatAmount(
                            circle.contribution_amount
                          )}
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-sm text-green-800">
                          <CalendarDays className="h-5 w-5" />

                          <span>
                            {
                              circle.contribution_frequency
                            }{" "}
                            · Starts{" "}
                            {formatDate(
                              circle.start_date
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        {contributions.length ===
                        0 ? (
                          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                            <p className="font-semibold text-gray-900">
                              No contributions
                              yet
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                              Completed
                              contributions will
                              appear here.
                            </p>
                          </div>
                        ) : (
                          contributions
                            .slice(0, 5)
                            .map(
                              (
                                contribution
                              ) => {
                                const member =
                                  members.find(
                                    (
                                      item
                                    ) =>
                                      item.id ===
                                      contribution.member_id
                                  );

                                return (
                                  <div
                                    key={
                                      contribution.id
                                    }
                                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4"
                                  >
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {member
                                          ? getMemberLabel(
                                              member
                                            )
                                          : "Circle member"}
                                      </p>

                                      <p className="mt-1 text-sm text-gray-500">
                                        {new Date(
                                          contribution.paid_at
                                        ).toLocaleString()}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p className="font-bold text-green-700">
                                        +
                                        {
                                          contribution.currency
                                        }{" "}
                                        {formatAmount(
                                          contribution.amount
                                        )}
                                      </p>

                                      <span className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                                        {
                                          contribution.status
                                        }
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            )
                        )}
                      </div>

                      <Button
                        className="mt-6 w-full"
                        onClick={
                          openContributionModal
                        }
                        disabled={
                          !currentMember ||
                          walletLoading ||
                          contributionLoading ||
                          effectiveStatus ===
                            "paused" ||
                          effectiveStatus ===
                            "completed"
                        }
                      >
                        {walletLoading
                          ? "Loading Wallet..."
                          : effectiveStatus ===
                              "paused"
                            ? "Circle Paused"
                            : effectiveStatus ===
                                "completed"
                              ? "Circle Completed"
                              : "Make Contribution"}
                      </Button>

                      {!currentMember && (
                        <p className="mt-3 text-center text-xs text-gray-500">
                          Only accepted members
                          can contribute.
                        </p>
                      )}
                    </Card>
                  </div>

                  <PayoutQueueCard
                    payouts={payouts}
                    members={members}
                    currency={
                      circle.currency
                    }
                    isOwner={isOwner}
                    loading={
                      startingCircle
                    }
                    onStartCircle={
                      handleStartCircle
                    }
                  />

                  <div className="mt-8 grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
                    <Card>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Financial Summary
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Current financial
                        position of this circle
                      </p>

                      <div className="mt-6 space-y-4">
                        <FinancialRow
                          label="Total Saved"
                          value={`${
                            circle.currency
                          } ${formatAmount(
                            totalSaved
                          )}`}
                        />

                        <FinancialRow
                          label="Total Paid Out"
                          value={`${
                            circle.currency
                          } ${formatAmount(
                            totalPaidOut
                          )}`}
                        />

                        <FinancialRow
                          label="Current Pool"
                          value={`${
                            circle.currency
                          } ${formatAmount(
                            currentPool
                          )}`}
                          strong
                        />
                      </div>
                    </Card>

                    <Card>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Recent Activity
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Latest events from this
                        savings circle
                      </p>

                      <div className="mt-6 space-y-5">
                        {activityItems.length ===
                        0 ? (
                          <p className="text-sm text-gray-500">
                            No activity yet.
                          </p>
                        ) : (
                          activityItems.map(
                            (
                              activity,
                              index
                            ) => (
                              <div
                                key={
                                  activity.id
                                }
                                className="flex gap-4"
                              >
                                <div className="relative flex flex-col items-center">
                                  <div className="h-3 w-3 rounded-full bg-green-600 ring-4 ring-green-100" />

                                  {index <
                                    activityItems.length -
                                      1 && (
                                    <div className="mt-2 h-full w-px bg-gray-200" />
                                  )}
                                </div>

                                <div className="pb-4">
                                  <p className="font-bold text-gray-900">
                                    {
                                      activity.title
                                    }
                                  </p>

                                  <p className="mt-1 text-sm text-gray-600">
                                    {
                                      activity.description
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    {formatDate(
                                      activity.date
                                    )}
                                  </p>
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </Card>
                  </div>
                </>
              )}
          </section>
        </div>
      </div>

      {showInviteModal && (
        <ModalOverlay>
          <Card className="w-full max-w-md shadow-2xl">
            <ModalHeader
              title="Invite Member"
              description="Invite someone to join this savings circle."
              onClose={() =>
                setShowInviteModal(false)
              }
            />

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
                    setInviteEmail(
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              {inviteMessage && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {inviteMessage}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setShowInviteModal(
                      false
                    )
                  }
                  disabled={
                    inviteLoading
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    inviteLoading
                  }
                >
                  <MailPlus className="mr-2 h-5 w-5" />

                  {inviteLoading
                    ? "Sending..."
                    : "Send Invitation"}
                </Button>
              </div>
            </form>
          </Card>
        </ModalOverlay>
      )}

      {showContributionModal &&
        circle && (
          <ModalOverlay>
            <Card className="w-full max-w-lg shadow-2xl">
              <ModalHeader
                title="Confirm Contribution"
                description={`Review your payment to ${circle.name}.`}
                onClose={() => {
                  if (
                    !contributionLoading
                  ) {
                    setShowContributionModal(
                      false
                    );
                  }
                }}
              />

              <form
                onSubmit={
                  handleContribution
                }
                className="mt-6 space-y-5"
              >
                <div className="rounded-2xl bg-green-50 p-5">
                  <p className="text-sm font-medium text-green-800">
                    Savings circle
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-900">
                    {circle.name}
                  </p>
                </div>

                <div className="space-y-4 rounded-2xl border border-gray-200 p-5">
                  <PaymentSummaryRow
                    label="Contribution Amount"
                    value={`${
                      circle.currency
                    } ${formatAmount(
                      numericContributionAmount
                    )}`}
                  />

                  <PaymentSummaryRow
                    label="Wallet Balance"
                    value={`${
                      circle.currency
                    } ${formatAmount(
                      walletBalance
                    )}`}
                  />

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-gray-700">
                        Balance After
                        Payment
                      </p>

                      <p
                        className={`text-lg font-bold ${
                          balanceAfterPayment <
                          0
                            ? "text-red-600"
                            : "text-green-700"
                        }`}
                      >
                        {circle.currency}{" "}
                        {formatAmount(
                          balanceAfterPayment
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Contribution Amount
                  </label>

                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      contributionAmount
                    }
                    onChange={(event) =>
                      setContributionAmount(
                        event.target
                          .value
                      )
                    }
                    required
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Expected contribution:{" "}
                    {circle.currency}{" "}
                    {formatAmount(
                      circle.contribution_amount
                    )}
                  </p>
                </div>

                {balanceAfterPayment <
                  0 && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    Your wallet balance is
                    not enough for this
                    contribution.
                  </p>
                )}

                {contributionMessage && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {
                      contributionMessage
                    }
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setShowContributionModal(
                        false
                      )
                    }
                    disabled={
                      contributionLoading
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      contributionLoading ||
                      balanceAfterPayment <
                        0 ||
                      numericContributionAmount <=
                        0
                    }
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />

                    {contributionLoading
                      ? "Processing Payment..."
                      : "Confirm Payment"}
                  </Button>
                </div>
              </form>
            </Card>
          </ModalOverlay>
        )}
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  accent:
    | "green"
    | "blue"
    | "purple"
    | "orange";
}) {
  const accentClasses = {
    green:
      "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple:
      "bg-purple-100 text-purple-700",
    orange:
      "bg-orange-100 text-orange-700",
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

function FinancialRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-4">
      <p className="text-sm font-medium text-gray-600">
        {label}
      </p>

      <p
        className={
          strong
            ? "text-lg font-bold text-green-700"
            : "font-bold text-gray-900"
        }
      >
        {value}
      </p>
    </div>
  );
}

function PaymentSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function ModalOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {children}
    </div>
  );
}

function ModalHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        aria-label={`Close ${title}`}
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
}