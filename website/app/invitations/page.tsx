"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  Mail,
  Users,
  X,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

type InvitationCircle = {
  name: string;
  description: string | null;
  contribution_amount: number;
  currency: string;
  contribution_frequency: string;
  max_members: number;
  start_date: string | null;
  privacy: string;
};

type Invitation = {
  id: string;
  circle_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  circles: InvitationCircle | null;
};

type InvitationAction = "accepted" | "declined";

type AcceptInvitationResult = {
  success: boolean;
  circle_id: string;
};

export default function InvitationsPage() {
  const router = useRouter();

  const [invitations, setInvitations] = useState<
    Invitation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");
  const [processingId, setProcessingId] = useState<
    string | null
  >(null);

  const loadInvitations = useCallback(async () => {
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

      const userEmail = user.email
        ?.trim()
        .toLowerCase();

      if (!userEmail) {
        setMessage(
          "Your account does not have an email address."
        );
        return;
      }

      const { data, error } = await supabase
        .from("circle_members")
        .select(`
          id,
          circle_id,
          email,
          role,
          status,
          created_at,
          circles (
            name,
            description,
            contribution_amount,
            currency,
            contribution_frequency,
            max_members,
            start_date,
            privacy
          )
        `)
        .eq("email", userEmail)
        .eq("status", "pending")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const normalizedInvitations = (
        (data as unknown as Invitation[]) ?? []
      ).map((invitation) => ({
        ...invitation,
        circles: invitation.circles
          ? {
              ...invitation.circles,
              contribution_amount: Number(
                invitation.circles
                  .contribution_amount
              ),
              max_members: Number(
                invitation.circles.max_members
              ),
            }
          : null,
      }));

      setInvitations(normalizedInvitations);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load invitations."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  async function handleInvitation(
    invitation: Invitation,
    newStatus: InvitationAction
  ) {
    setMessage("");
    setSuccessMessage("");
    setProcessingId(invitation.id);

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

      const userEmail = user.email
        ?.trim()
        .toLowerCase();

      if (!userEmail) {
        setMessage(
          "Your account does not have an email address."
        );
        return;
      }

      /*
       * Accepting uses the secure database RPC.
       * It accepts the invitation and creates a
       * notification for the circle owner.
       */
      if (newStatus === "accepted") {
        const {
          data,
          error: acceptError,
        } = await supabase.rpc(
          "accept_circle_invitation",
          {
            p_invitation_id: invitation.id,
          }
        );

        if (acceptError) {
          throw acceptError;
        }

        const result =
          data as AcceptInvitationResult | null;

        setInvitations(
          (currentInvitations) =>
            currentInvitations.filter(
              (currentInvitation) =>
                currentInvitation.id !==
                invitation.id
            )
        );

        const circleId =
          result?.circle_id ??
          invitation.circle_id;

        router.push(`/circles/${circleId}`);
        return;
      }

      /*
       * Declining still updates the pending
       * invitation directly.
       */
      const { data: declinedInvitation, error } =
        await supabase
          .from("circle_members")
          .update({
            status: "declined",
            user_id: user.id,
            joined_at: null,
          })
          .eq("id", invitation.id)
          .eq("email", userEmail)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!declinedInvitation) {
        throw new Error(
          "This invitation could not be declined. It may have already been handled."
        );
      }

      setInvitations(
        (currentInvitations) =>
          currentInvitations.filter(
            (currentInvitation) =>
              currentInvitation.id !==
              invitation.id
          )
      );

      setSuccessMessage(
        `Invitation to ${
          invitation.circles?.name ??
          "the savings circle"
        } was declined.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the invitation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  function formatAmount(
    amount: number | undefined
  ) {
    return Number(amount ?? 0).toLocaleString(
      "en-GH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatDate(
    date: string | null | undefined
  ) {
    if (!date) {
      return "Not set";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="p-6 lg:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                Savings circles
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Invitations
              </h1>

              <p className="mt-2 text-gray-600">
                Review invitations sent to your
                ChainSave account.
              </p>
            </div>

            {loading && (
              <p className="mt-8 text-gray-600">
                Loading invitations...
              </p>
            )}

            {message && (
              <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
                {message}
              </p>
            )}

            {successMessage && (
              <p className="mt-8 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
                {successMessage}
              </p>
            )}

            {!loading &&
              invitations.length === 0 && (
                <Card className="mt-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Mail className="h-7 w-7" />
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-gray-900">
                    No pending invitations
                  </h2>

                  <p className="mt-2 text-gray-500">
                    New savings-circle invitations
                    will appear here.
                  </p>
                </Card>
              )}

            {!loading &&
              invitations.length > 0 && (
                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                  {invitations.map(
                    (invitation) => {
                      const circle =
                        invitation.circles;

                      const isProcessing =
                        processingId ===
                        invitation.id;

                      return (
                        <Card
                          key={invitation.id}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                  Pending invitation
                                </span>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                    circle?.privacy ===
                                    "public"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {circle?.privacy ??
                                    "private"}{" "}
                                  circle
                                </span>
                              </div>

                              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                                {circle?.name ??
                                  "Savings Circle"}
                              </h2>

                              <p className="mt-2 max-w-xl leading-7 text-gray-600">
                                {circle?.description ||
                                  "You have been invited to join this savings circle."}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                              <Users className="h-6 w-6" />
                            </div>
                          </div>

                          <div className="mt-7 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl bg-green-50 p-4">
                              <div className="flex items-center gap-3">
                                <CircleDollarSign className="h-5 w-5 text-green-700" />

                                <div>
                                  <p className="text-xs font-medium text-gray-500">
                                    Contribution
                                  </p>

                                  <p className="mt-1 font-bold text-gray-900">
                                    {circle?.currency ??
                                      "GHS"}{" "}
                                    {formatAmount(
                                      circle?.contribution_amount
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs font-medium text-gray-500">
                                Frequency
                              </p>

                              <p className="mt-1 font-bold text-gray-900">
                                {circle?.contribution_frequency ??
                                  "Not set"}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 p-4">
                              <div className="flex items-center gap-3">
                                <CalendarDays className="h-5 w-5 text-gray-700" />

                                <div>
                                  <p className="text-xs font-medium text-gray-500">
                                    Start Date
                                  </p>

                                  <p className="mt-1 font-bold text-gray-900">
                                    {formatDate(
                                      circle?.start_date
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs font-medium text-gray-500">
                                Maximum Members
                              </p>

                              <p className="mt-1 font-bold text-gray-900">
                                {circle?.max_members ??
                                  "Not set"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Button
                              onClick={() =>
                                handleInvitation(
                                  invitation,
                                  "accepted"
                                )
                              }
                              disabled={isProcessing}
                            >
                              <Check className="mr-2 h-5 w-5" />

                              {isProcessing
                                ? "Processing..."
                                : "Accept Invitation"}
                            </Button>

                            <Button
                              variant="secondary"
                              onClick={() =>
                                handleInvitation(
                                  invitation,
                                  "declined"
                                )
                              }
                              disabled={isProcessing}
                            >
                              <X className="mr-2 h-5 w-5" />
                              Decline
                            </Button>
                          </div>
                        </Card>
                      );
                    }
                  )}
                </div>
              )}
          </section>
        </div>
      </div>
    </main>
  );
}