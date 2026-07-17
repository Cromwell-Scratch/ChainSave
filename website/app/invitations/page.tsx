"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

type Invitation = {
  id: string;
  circle_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  circles: {
    name: string;
    description: string | null;
    contribution_amount: number;
    currency: string;
    contribution_frequency: string;
  } | null;
};

export default function InvitationsPage() {
  const router = useRouter();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function handleInvitation(
  invitation: Invitation,
  newStatus: "accepted" | "declined"
) {
  setMessage("");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  const updates =
    newStatus === "accepted"
      ? {
          status: "accepted",
          user_id: user.id,
          joined_at: new Date().toISOString(),
        }
      : {
          status: "declined",
          user_id: user.id,
          joined_at: null,
        };

  const { error } = await supabase
    .from("circle_members")
    .update(updates)
    .eq("id", invitation.id)
    .eq("email", user.email?.trim().toLowerCase());

  if (error) {
    setMessage(error.message);
    return;
  }

  setInvitations((currentInvitations) =>
    currentInvitations.filter(
      (currentInvitation) =>
        currentInvitation.id !== invitation.id
    )
  );

  if (newStatus === "accepted") {
    router.push(`/circles/${invitation.circle_id}`);
  }
}
    async function loadInvitations() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const userEmail = user.email?.trim().toLowerCase();

      if (!userEmail) {
        setMessage("Your account does not have an email address.");
        setLoading(false);
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
            contribution_frequency
          )
        `)
        .eq("email", userEmail)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setInvitations((data as Invitation[]) ?? []);
      }

      setLoading(false);
    }

    loadInvitations();
  }, [router]);
  async function handleInvitation(
    invitation: Invitation,
    newStatus: "accepted" | "declined"
  ) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const userEmail = user.email?.trim().toLowerCase();

    if (!userEmail) {
      setMessage("Your account does not have an email address.");
      return;
    }

    const updates =
      newStatus === "accepted"
        ? {
            status: "accepted",
            user_id: user.id,
            joined_at: new Date().toISOString(),
          }
        : {
            status: "declined",
            user_id: user.id,
            joined_at: null,
          };

    const { error } = await supabase
      .from("circle_members")
      .update(updates)
      .eq("id", invitation.id)
      .eq("email", userEmail);

    if (error) {
      setMessage(error.message);
      return;
    }

    setInvitations((currentInvitations) =>
      currentInvitations.filter(
        (currentInvitation) =>
          currentInvitation.id !== invitation.id
      )
    );

    if (newStatus === "accepted") {
      router.push(`/circles/${invitation.circle_id}`);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1">
          <Topbar />

          <section className="p-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Invitations
            </h1>

            <p className="mt-2 text-gray-600">
              Review invitations sent to your account.
            </p>

            {loading && (
              <p className="mt-8 text-gray-600">
                Loading invitations...
              </p>
            )}

            {message && (
              <p className="mt-8 font-medium text-red-600">
                {message}
              </p>
            )}

            {!loading && !message && invitations.length === 0 && (
              <Card className="mt-8 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  No pending invitations
                </h2>

                <p className="mt-2 text-gray-500">
                  New circle invitations will appear here.
                </p>
              </Card>
            )}

            {!loading && invitations.length > 0 && (
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {invitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {invitation.circles?.name ?? "Savings Circle"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          Pending invitation
                        </p>
                      </div>

                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Pending
                      </span>
                    </div>

                    <p className="mt-4 text-gray-600">
                      {invitation.circles?.description ||
                        "You have been invited to join this savings circle."}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">
                          Contribution
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {invitation.circles?.currency}{" "}
                          {invitation.circles?.contribution_amount}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Frequency
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {invitation.circles?.contribution_frequency}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
  onClick={() =>
    handleInvitation(invitation, "accepted")
  }
>
  Accept
</Button>

<Button
  variant="secondary"
  onClick={() =>
    handleInvitation(invitation, "declined")
  }
>
  Decline
</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}