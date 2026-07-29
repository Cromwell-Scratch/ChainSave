"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import ActivityList from "@/components/dashboard/ActivityList";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import QuickActions from "@/components/dashboard/QuickActions";
import SavingsProgressCard from "@/components/dashboard/SavingsProgressCard";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import UpcomingContributions from "@/components/dashboard/UpcomingContributions";
import { supabase } from "@/lib/supabase";

type MembershipRow = {
  id: string;
  circle_id: string;
};

type CircleRow = {
  id: string;
  name: string;
  contribution_amount: number | string;
  status: string | null;
  completed: boolean | null;
  current_round: number | string | null;
  next_contribution_date: string | null;
  next_payout_member: string | null;
  currency: string | null;
  started: boolean | null;
  current_payout_order: number | string | null;
};

type AcceptedMemberRow = {
  circle_id: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [userName, setUserName] =
    useState("Member");

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [totalSavings, setTotalSavings] =
    useState(0);

  const [savingsGoal, setSavingsGoal] =
    useState(0);

  const [activeCircles, setActiveCircles] =
    useState(0);

  const [
    completedCircles,
    setCompletedCircles,
  ] = useState(0);

  const [pendingInvites, setPendingInvites] =
    useState(0);

  const [
    nextContribution,
    setNextContribution,
  ] = useState("No upcoming payment");

  const [
    upcomingPayout,
    setUpcomingPayout,
  ] = useState("Not scheduled");

  const [dashboardError, setDashboardError] =
    useState("");

  const [circles, setCircles] =
    useState<CircleRow[]>([]);

  const [dashboardRefreshKey, setDashboardRefreshKey] =
    useState(0);

  useEffect(() => {
    async function loadDashboard() {
      setDashboardError("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.push("/login");
          return;
        }

        const user = session.user;

        const userEmail =
          user.email?.trim().toLowerCase();

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Unable to load profile:",
            profileError
          );
        }

        setUserName(
          profile?.full_name?.trim() ||
            user.user_metadata?.full_name?.trim() ||
            user.email?.split("@")[0] ||
            "Member"
        );

        const {
          data: wallet,
          error: walletError,
        } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletError) {
          console.error(
            "Unable to load wallet:",
            walletError
          );
        }

        setWalletBalance(
          Number(wallet?.balance ?? 0)
        );

        if (userEmail) {
          const {
            count,
            error: invitationError,
          } = await supabase
            .from("circle_members")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("email", userEmail)
            .eq("status", "pending");

          if (invitationError) {
            console.error(
              "Unable to load invitations:",
              invitationError
            );
          }

          setPendingInvites(count ?? 0);
        }

        const {
          data: membershipsData,
          error: membershipsError,
        } = await supabase
          .from("circle_members")
          .select("id, circle_id")
          .eq("user_id", user.id)
          .eq("status", "accepted");

        if (membershipsError) {
          throw membershipsError;
        }

        const memberships =
          (membershipsData ??
            []) as MembershipRow[];

        const memberIds = memberships.map(
          (membership) => membership.id
        );

        const circleIds = Array.from(
          new Set(
            memberships.map(
              (membership) =>
                membership.circle_id
            )
          )
        );

        if (memberIds.length > 0) {
          const {
            data: contributionData,
            error: contributionError,
          } = await supabase
            .from("contributions")
            .select("amount")
            .in("member_id", memberIds)
            .eq("status", "completed");

          if (contributionError) {
            throw contributionError;
          }

          const total =
            contributionData?.reduce(
              (
                sum,
                contribution
              ) =>
                sum +
                Number(
                  contribution.amount
                ),
              0
            ) ?? 0;

          setTotalSavings(total);
        } else {
          setTotalSavings(0);
        }

        if (circleIds.length === 0) {
          resetCircleSummary();
          return;
        }

        const {
          data: circlesData,
          error: circlesError,
        } = await supabase
          .from("circles")
          .select(`
            id,
            name,
            contribution_amount,
            status,
            completed,
            current_round,
            next_contribution_date,
            next_payout_member,
            currency,
            started,
            current_payout_order
          `)
          .in("id", circleIds);

        if (circlesError) {
          throw circlesError;
        }

        const circles =
          ((circlesData ??
            []) as CircleRow[]).map(
            (circle) => ({
              ...circle,
              contribution_amount: Number(
                circle.contribution_amount
              ),
              current_round: Number(
                circle.current_round ?? 1
              ),
              completed: Boolean(
                circle.completed
              ),
            })
          );

        const activeCircleRows =
          circles.filter(
            (circle) =>
              !circle.completed &&
              circle.status !== "completed"
          );

        setCircles(activeCircleRows);

        const completedCircleRows =
          circles.filter(
            (circle) =>
              circle.completed ||
              circle.status === "completed"
          );

        setActiveCircles(
          activeCircleRows.length
        );

        setCompletedCircles(
          completedCircleRows.length
        );

        const {
          data: acceptedMembersData,
          error: acceptedMembersError,
        } = await supabase
          .from("circle_members")
          .select("circle_id")
          .in("circle_id", circleIds)
          .eq("status", "accepted");

        if (acceptedMembersError) {
          throw acceptedMembersError;
        }

        const acceptedMembers =
          (acceptedMembersData ??
            []) as AcceptedMemberRow[];

        const memberCountByCircle =
          acceptedMembers.reduce<
            Record<string, number>
          >((counts, member) => {
            counts[member.circle_id] =
              (counts[
                member.circle_id
              ] ?? 0) + 1;

            return counts;
          }, {});

        const calculatedGoal =
          circles.reduce(
            (total, circle) => {
              const acceptedMemberCount =
                memberCountByCircle[
                  circle.id
                ] ?? 0;

              /*
               * Each member contributes once per
               * round, and the number of rounds
               * equals the number of accepted
               * members.
               *
               * The signed-in user's personal goal
               * is therefore contribution amount
               * multiplied by the total rounds.
               */
              return (
                total +
                Number(
                  circle.contribution_amount
                ) *
                  acceptedMemberCount
              );
            },
            0
          );

        setSavingsGoal(calculatedGoal);

        const contributionCircle =
          activeCircleRows
            .filter(
              (circle) =>
                circle.next_contribution_date
            )
            .sort(
              (first, second) =>
                parseDate(
                  first.next_contribution_date
                ).getTime() -
                parseDate(
                  second.next_contribution_date
                ).getTime()
            )[0];

        setNextContribution(
          contributionCircle
            ? formatRelativeDate(
                contributionCircle
                  .next_contribution_date
              )
            : "No upcoming payment"
        );

        const userPayoutCircle =
          activeCircleRows.find(
            (circle) =>
              circle.next_payout_member ===
              user.id
          );

        if (userPayoutCircle) {
          setUpcomingPayout(
            `You are next · ${userPayoutCircle.name}`
          );
        } else {
          const scheduledCircle =
            activeCircleRows.find(
              (circle) =>
                circle.next_payout_member
            );

          setUpcomingPayout(
            scheduledCircle
              ? `${scheduledCircle.name} · Round ${Number(
                  scheduledCircle.current_round ??
                    1
                )}`
              : "Not scheduled"
          );
        }
      } catch (error) {
        console.error(
          "Unable to load dashboard:",
          error
        );

        setDashboardError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard."
        );
      } finally {
        setCheckingSession(false);
      }
    }

    function resetCircleSummary() {
      setCircles([]);
      setActiveCircles(0);
      setCompletedCircles(0);
      setSavingsGoal(0);
      setNextContribution(
        "No upcoming payment"
      );
      setUpcomingPayout(
        "Not scheduled"
      );
    }

    loadDashboard();
  }, [router, dashboardRefreshKey]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="p-6 lg:p-8">
            {dashboardError && (
              <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
                {dashboardError}
              </p>
            )}

            <DashboardHeader
              userName={userName}
              walletBalance={
                walletBalance
              }
              activeCircles={
                activeCircles
              }
              nextContribution={
                nextContribution
              }
              upcomingPayout={
                upcomingPayout
              }
            />

            <div className="mt-8">
              <SavingsProgressCard
                totalSavings={
                  totalSavings
                }
                savingsGoal={
                  savingsGoal
                }
                completedCircles={
                  completedCircles
                }
                pendingInvites={
                  pendingInvites
                }
              />
            </div>

            <div className="mt-8">
              <QuickActions />
            </div>

            <div className="mt-8">
              <UpcomingContributions
                circles={circles}
                onContributionComplete={() =>
                  setDashboardRefreshKey(
                    (currentValue) =>
                      currentValue + 1
                  )
                }
              />
            </div>

            <div className="mt-8">
              <ActivityList />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function parseDate(
  value: string | null
) {
  if (!value) {
    return new Date(0);
  }

  return value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00`);
}

function formatRelativeDate(
  value: string | null
) {
  if (!value) {
    return "No upcoming payment";
  }

  const date = parseDate(value);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const differenceInDays = Math.round(
    (targetDate.getTime() -
      today.getTime()) /
      86_400_000
  );

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Tomorrow";
  }

  if (differenceInDays === -1) {
    return "Yesterday";
  }

  if (differenceInDays < 0) {
    return `${Math.abs(
      differenceInDays
    )} days overdue`;
  }

  if (differenceInDays <= 7) {
    return `In ${differenceInDays} days`;
  }

  return targetDate.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}