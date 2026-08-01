"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Crown,
  Eye,
  Globe2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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
  privacy: string;
  start_date: string | null;
  started: boolean;
  completed: boolean;
};

type CircleMembership = {
  circle_id: string;
};

type CircleRole = "owner" | "member";

export default function MyCirclesPage() {
  const router = useRouter();

  const [ownedCircles, setOwnedCircles] = useState<
    Circle[]
  >([]);
  const [joinedCircles, setJoinedCircles] = useState<
    Circle[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [circleToDelete, setCircleToDelete] =
    useState<Circle | null>(null);
  const [deleteLoading, setDeleteLoading] =
    useState(false);
  const [deleteMessage, setDeleteMessage] =
    useState("");

  const loadCircles = useCallback(async () => {
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

      const { data: ownedData, error: ownedError } =
        await supabase
          .from("circles")
          .select(
            `
              id,
              owner_id,
              name,
              description,
              contribution_amount,
              currency,
              contribution_frequency,
              max_members,
              privacy,
              start_date,
              started,
              completed
            `
          )
          .eq("owner_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (ownedError) {
        throw ownedError;
      }

      const normalizedOwnedCircles = (
        (ownedData as Circle[]) ?? []
      ).map(normalizeCircle);

      setOwnedCircles(normalizedOwnedCircles);

      const {
        data: membershipData,
        error: membershipError,
      } = await supabase
        .from("circle_members")
        .select("circle_id")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (membershipError) {
        throw membershipError;
      }

      const memberships =
        (membershipData as CircleMembership[]) ?? [];

      const ownedCircleIds = new Set(
        normalizedOwnedCircles.map(
          (circle) => circle.id
        )
      );

      const joinedCircleIds = Array.from(
        new Set(
          memberships
            .map(
              (membership) =>
                membership.circle_id
            )
            .filter(
              (circleId) =>
                !ownedCircleIds.has(circleId)
            )
        )
      );

      if (joinedCircleIds.length === 0) {
        setJoinedCircles([]);
        return;
      }

      const { data: joinedData, error: joinedError } =
        await supabase
          .from("circles")
          .select(
            `
              id,
              owner_id,
              name,
              description,
              contribution_amount,
              currency,
              contribution_frequency,
              max_members,
              privacy,
              start_date,
              started,
              completed
            `
          )
          .in("id", joinedCircleIds)
          .order("created_at", {
            ascending: false,
          });

      if (joinedError) {
        throw joinedError;
      }

      setJoinedCircles(
        ((joinedData as Circle[]) ?? []).map(
          normalizeCircle
        )
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your savings circles."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  function openDeleteModal(circle: Circle) {
    setCircleToDelete(circle);
    setDeleteMessage("");
    setSuccessMessage("");
  }

  function closeDeleteModal() {
    if (deleteLoading) return;

    setCircleToDelete(null);
    setDeleteMessage("");
  }

  async function handleDeleteCircle() {
    if (!circleToDelete) return;

    setDeleteLoading(true);
    setDeleteMessage("");
    setMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.rpc(
        "delete_circle",
        {
          p_circle_id: circleToDelete.id,
        }
      );

      if (error) {
        setDeleteMessage(
          error.message ||
            "Unable to delete this circle."
        );
        return;
      }

      const deletedCircleName =
        circleToDelete.name;

      setOwnedCircles((currentCircles) =>
        currentCircles.filter(
          (circle) =>
            circle.id !== circleToDelete.id
        )
      );

      setCircleToDelete(null);

      setSuccessMessage(
        `${deletedCircleName} was deleted successfully.`
      );
    } catch (error) {
      setDeleteMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete this circle."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const hasCircles =
    ownedCircles.length > 0 ||
    joinedCircles.length > 0;

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <section className="p-6 lg:p-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-green-700 to-lime-500 p-8 text-white shadow-2xl">

  <div className="absolute inset-0 opacity-20">
    <svg
      className="h-full w-full"
      viewBox="0 0 1200 320"
    >
      <path
        d="M0 220 C180 150 320 260 520 210 S820 120 1200 220V320H0Z"
        fill="#DCFCE7"
      />
    </svg>
  </div>

  <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">

    <div>

      <p className="text-sm uppercase tracking-[0.25em] text-green-100">
        ChainSave Workspace
      </p>

      <h1 className="mt-3 text-4xl font-bold">
        My Savings Circles
      </h1>

      <p className="mt-3 max-w-2xl text-green-50">
        Manage every savings circle you've created or joined,
        monitor progress and access each circle quickly.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

        <HeroStat
          label="Owned"
          value={ownedCircles.length}
        />

        <HeroStat
          label="Joined"
          value={joinedCircles.length}
        />

        <HeroStat
          label="Total"
          value={
            ownedCircles.length +
            joinedCircles.length
          }
        />

        <HeroStat
          label="Active"
          value={
            ownedCircles.filter(
              circle => !circle.completed
            ).length +
            joinedCircles.filter(
              circle => !circle.completed
            ).length
          }
        />

      </div>

    </div>

    <div>

      <Button
        onClick={() =>
          router.push("/create-circle")
        }
        className="rounded-2xl bg-emerald-700 px-8 py-4 text-white hover:bg-white hover:text-emerald-700 transition-colors"
      >
        <Plus className="mr-2 h-5 w-5" />
        Create Circle
      </Button>

    </div>

  </div>

</div>

            {loading && (
              <p className="mt-8 text-gray-600">
                Loading circles...
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
              !message &&
              !hasCircles && (
                <Card className="mt-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Users className="h-8 w-8" />
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-gray-900">
                    No savings circles yet
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-gray-500">
                    Create your first savings circle
                    or accept an invitation from
                    another ChainSave member.
                  </p>

                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                      onClick={() =>
                        router.push(
                          "/create-circle"
                        )
                      }
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Create Your First Circle
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        router.push(
                          "/invitations"
                        )
                      }
                    >
                      View Invitations
                    </Button>
                  </div>
                </Card>
              )}

            {!loading &&
              !message &&
              hasCircles && (
                <div className="mt-10 space-y-12">
                  <CircleSection
                    title="Owned Circles"
                    description="Savings circles you created and manage."
                    count={ownedCircles.length}
                    emptyMessage="You have not created any savings circles yet."
                  >
                    {ownedCircles.map(
                      (circle) => (
                        <CircleCard
                          key={circle.id}
                          circle={circle}
                          role="owner"
                          onOpen={() =>
                            router.push(
                              `/circles/${circle.id}`
                            )
                          }
                          onEdit={() =>
                            router.push(
                              `/edit-circle/${circle.id}`
                            )
                          }
                          onDelete={() =>
                            openDeleteModal(circle)
                          }
                        />
                      )
                    )}
                  </CircleSection>

                  <CircleSection
                    title="Joined Circles"
                    description="Circles where you are an accepted member."
                    count={joinedCircles.length}
                    emptyMessage="You have not joined any other savings circles yet."
                  >
                    {joinedCircles.map(
                      (circle) => (
                        <CircleCard
                          key={circle.id}
                          circle={circle}
                          role="member"
                          onOpen={() =>
                            router.push(
                              `/circles/${circle.id}`
                            )
                          }
                        />
                      )
                    )}
                  </CircleSection>
                </div>
              )}
          </section>
        </div>
      </div>

      {circleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-gray-900">
                  Delete Circle
                </h2>

                <p className="mt-2 text-gray-600">
                  Are you sure you want to
                  permanently delete{" "}
                  <strong>
                    {circleToDelete.name}
                  </strong>
                  ?
                </p>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close delete confirmation"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {circleToDelete.started ? (
              <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                <p className="font-medium text-yellow-800">
                  This circle has already
                  started and cannot be deleted.
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                  Financial records must be
                  preserved after contributions
                  and payouts begin.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="font-medium text-red-700">
                  This action cannot be undone.
                </p>

                <p className="mt-1 text-sm text-red-600">
                  Members, invitations, payout
                  drafts, and other related test
                  records will be removed.
                </p>
              </div>
            )}

            {deleteMessage && (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {deleteMessage}
              </p>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </Button>

              {!circleToDelete.started && (
                <Button
                  type="button"
                  onClick={handleDeleteCircle}
                  disabled={deleteLoading}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="mr-2 h-5 w-5" />

                  {deleteLoading
                    ? "Deleting..."
                    : "Delete Circle"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

function normalizeCircle(
  circle: Circle
): Circle {
  return {
    ...circle,
    contribution_amount: Number(
      circle.contribution_amount
    ),
    max_members: Number(
      circle.max_members
    ),
    started: Boolean(circle.started),
    completed: Boolean(circle.completed),
  };
}

type CircleSectionProps = {
  title: string;
  description: string;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
};

function CircleSection({
  title,
  description,
  count,
  emptyMessage,
  children,
}: CircleSectionProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              {title}
            </h2>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              {count}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {count === 0 ? (
        <Card className="mt-5 border-dashed text-center">
          <p className="text-gray-500">
            {emptyMessage}
          </p>
        </Card>
      ) : (
        <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {children}
        </div>
      )}
    </section>
  );
}

type CircleCardProps = {
  circle: Circle;
  role: CircleRole;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

function CircleCard({
  circle,
  role,
  onOpen,
  onEdit,
  onDelete,
}: CircleCardProps) {
  const RoleIcon =
    role === "owner" ? Crown : UserRound;

  const statusLabel = circle.completed
    ? "Completed"
    : circle.started
      ? "In Progress"
      : "Not Started";

  const statusClasses = circle.completed
    ? "bg-blue-100 text-blue-700"
    : circle.started
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <Card className="flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                role === "owner"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              <RoleIcon className="h-3.5 w-3.5" />

              {role === "owner"
                ? "Owner"
                : "Member"}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                circle.privacy === "public"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {circle.privacy === "public" ? (
                <Globe2 className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}

              {circle.privacy === "public"
                ? "Public"
                : "Private"}
            </span>
          </div>

          <h3 className="mt-4 truncate text-xl font-bold text-gray-900">
            {circle.name}
          </h3>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-6 text-gray-600">
        {circle.description ||
          "No description provided."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <CircleDetail
          icon={WalletCards}
          label="Contribution"
          value={`${circle.currency} ${formatAmount(
            circle.contribution_amount
          )}`}
        />

        <CircleDetail
          icon={CalendarDays}
          label="Frequency"
          value={circle.contribution_frequency}
        />

        <CircleDetail
          icon={Users}
          label="Maximum Members"
          value={`${circle.max_members}`}
        />

        <CircleDetail
          icon={CalendarDays}
          label="Start Date"
          value={formatDate(circle.start_date)}
        />
      </div>

      <div className="mt-auto pt-7">
        {role === "owner" &&
        onEdit &&
        onDelete ? (
          <div className="grid grid-cols-[1fr_auto_auto] gap-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={onOpen}
            >
              <Eye className="mr-2 h-5 w-5" />
              View
            </Button>

            <button
  type="button"
  onClick={onEdit}
  disabled={circle.started}
  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-60"
  aria-label={`Edit ${circle.name}`}
  title={
    circle.started
      ? "Started circles cannot be edited"
      : "Edit circle"
  }
>
  <Pencil className="h-5 w-5" />
</button>

            <button
              type="button"
              onClick={onDelete}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700"
              aria-label={`Delete ${circle.name}`}
              title={
                circle.started
                  ? "Started circles cannot be deleted"
                  : "Delete circle"
              }
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <Button
            variant="secondary"
            className="w-full"
            onClick={onOpen}
          >
            <Eye className="mr-2 h-5 w-5" />
            View Circle
          </Button>
        )}
      </div>
    </Card>
  );
}

type CircleDetailProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
};

function CircleDetail({
  icon: Icon,
  label,
  value,
}: CircleDetailProps) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" />

        <p className="text-xs font-medium">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

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

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function HeroStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
      <p className="text-xs uppercase tracking-wide text-green-100">
        {label}
      </p>

      <h3 className="mt-2 text-3xl font-bold">
        {value}
      </h3>
    </div>
  );
}