"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Search,
  Users,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

type PublicCircle = {
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

type MembershipRow = {
  circle_id: string;
  status: string;
};

export default function JoinCirclePage() {
  const router = useRouter();

  const [circles, setCircles] = useState<PublicCircle[]>([]);
  const [membershipByCircle, setMembershipByCircle] = useState<
    Record<string, string>
  >({});
  const [memberCounts, setMemberCounts] = useState<
    Record<string, number>
  >({});

  const [searchTerm, setSearchTerm] = useState("");
  const [joiningCircleId, setJoiningCircleId] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadCircles = useCallback(async () => {
    setLoading(true);
    setMessage("");

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

    const { data: circleData, error: circleError } = await supabase
      .from("circles")
      .select(
        "id, owner_id, name, description, contribution_amount, currency, contribution_frequency, max_members, start_date, privacy, created_at"
      )
      .eq("privacy", "public")
      .neq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (circleError) {
      setMessage(circleError.message);
      setLoading(false);
      return;
    }

    const loadedCircles = (circleData as PublicCircle[]) ?? [];
    setCircles(loadedCircles);

    if (loadedCircles.length === 0) {
      setMembershipByCircle({});
      setMemberCounts({});
      setLoading(false);
      return;
    }

    const circleIds = loadedCircles.map((circle) => circle.id);

    const { data: membershipData, error: membershipError } =
      await supabase
        .from("circle_members")
        .select("circle_id, status")
        .eq("user_id", user.id)
        .in("circle_id", circleIds);

    if (membershipError) {
      setMessage(membershipError.message);
      setLoading(false);
      return;
    }

    const memberships = (
      (membershipData as MembershipRow[]) ?? []
    ).reduce<Record<string, string>>((result, membership) => {
      result[membership.circle_id] = membership.status;
      return result;
    }, {});

    setMembershipByCircle(memberships);

    const counts = await Promise.all(
      circleIds.map(async (circleId) => {
        const { count } = await supabase
          .from("circle_members")
          .select("*", { count: "exact", head: true })
          .eq("circle_id", circleId)
          .eq("status", "accepted");

        return [circleId, count ?? 0] as const;
      })
    );

    setMemberCounts(Object.fromEntries(counts));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  async function handleJoinCircle(circle: PublicCircle) {
    setJoiningCircleId(circle.id);
    setMessage("");
    setSuccessMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setMessage(userError.message);
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      if (!user.email) {
        setMessage("Your account does not have an email address.");
        return;
      }

      if (membershipByCircle[circle.id]) {
        setMessage("You have already joined this circle.");
        return;
      }

      const currentMemberCount = memberCounts[circle.id] ?? 0;

      if (currentMemberCount >= circle.max_members) {
        setMessage("This circle has reached its maximum membership.");
        return;
      }

      const { error } = await supabase.from("circle_members").insert({
        circle_id: circle.id,
        user_id: user.id,
        email: user.email.trim().toLowerCase(),
        role: "member",
        status: "accepted",
        joined_at: new Date().toISOString(),
        invited_by: null,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMembershipByCircle((current) => ({
        ...current,
        [circle.id]: "accepted",
      }));

      setMemberCounts((current) => ({
        ...current,
        [circle.id]: (current[circle.id] ?? 0) + 1,
      }));

      setSuccessMessage(`You joined ${circle.name} successfully.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to join the circle."
      );
    } finally {
      setJoiningCircleId(null);
    }
  }

  const filteredCircles = circles.filter((circle) => {
    const searchableText =
      `${circle.name} ${circle.description ?? ""}`.toLowerCase();

    return searchableText.includes(searchTerm.trim().toLowerCase());
  });

  function formatAmount(amount: number) {
    return Number(amount).toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="p-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Join a Circle
              </h1>

              <p className="mt-2 text-gray-600">
                Discover public savings circles and become a member.
              </p>
            </div>

            <div className="relative mt-8 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <Input
                type="search"
                placeholder="Search by circle name or description"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-12"
              />
            </div>

            {message && (
              <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-700">
                {message}
              </p>
            )}

            {successMessage && (
              <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 font-medium text-green-700">
                {successMessage}
              </p>
            )}

            {loading ? (
              <p className="mt-8 text-gray-600">
                Loading public circles...
              </p>
            ) : filteredCircles.length === 0 ? (
              <Card className="mt-8 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  No public circles found
                </h2>

                <p className="mt-2 text-gray-500">
                  Try a different search or check again later.
                </p>
              </Card>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredCircles.map((circle) => {
                  const currentMembers = memberCounts[circle.id] ?? 0;
                  const membershipStatus =
                    membershipByCircle[circle.id];
                  const isFull =
                    currentMembers >= circle.max_members;
                  const isJoining = joiningCircleId === circle.id;

                  return (
                    <Card key={circle.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {circle.name}
                          </h2>

                          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                            {circle.description ||
                              "No description provided."}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Public
                        </span>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Contribution
                          </p>

                          <p className="mt-1 text-xl font-bold text-green-700">
                            {circle.currency}{" "}
                            {formatAmount(circle.contribution_amount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <CalendarDays className="h-5 w-5 text-gray-400" />

                          <span className="capitalize">
                            {circle.contribution_frequency}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Users className="h-5 w-5 text-gray-400" />

                          <span>
                            {currentMembers} of {circle.max_members} members
                          </span>
                        </div>
                      </div>

                      <Button
                        className="mt-6 w-full"
                        disabled={
                          Boolean(membershipStatus) ||
                          isFull ||
                          isJoining
                        }
                        onClick={() => handleJoinCircle(circle)}
                      >
                        {membershipStatus === "accepted" ? (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Joined
                          </>
                        ) : isFull ? (
                          "Circle Full"
                        ) : isJoining ? (
                          "Joining..."
                        ) : (
                          "Join Circle"
                        )}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}