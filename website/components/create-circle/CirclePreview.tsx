import {
  CalendarDays,
  CircleDollarSign,
  Globe2,
  Lock,
  Users,
} from "lucide-react";

type CirclePreviewProps = {
  name: string;
  description: string;
  contributionAmount: string;
  currency: string;
  frequency: string;
  maxMembers: string;
  startDate: string;
  privacy: string;
  invitedMembers: string[];
};

export default function CirclePreview({
  name,
  description,
  contributionAmount,
  currency,
  frequency,
  maxMembers,
  startDate,
  privacy,
  invitedMembers,
}: CirclePreviewProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Circle Preview
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {name || "Untitled Savings Circle"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {description || "Your circle description will appear here."}
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            privacy === "public"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {privacy === "public" ? (
            <Globe2 className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}

          <span className="capitalize">
            {privacy || "private"}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-2 text-green-700">
              <CircleDollarSign className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">
                Contribution
              </p>

              <p className="mt-1 font-bold text-gray-900">
                {currency || "GHS"}{" "}
                {contributionAmount || "0.00"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-200 p-2 text-gray-700">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">
                Frequency
              </p>

              <p className="mt-1 font-bold capitalize text-gray-900">
                {frequency || "Not selected"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-200 p-2 text-gray-700">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">
                Maximum Members
              </p>

              <p className="mt-1 font-bold text-gray-900">
                {maxMembers || "0"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-200 p-2 text-gray-700">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">
                Start Date
              </p>

              <p className="mt-1 font-bold text-gray-900">
                {startDate
                  ? new Date(startDate).toLocaleDateString()
                  : "Not selected"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-5">
        <p className="text-sm font-semibold text-gray-900">
          Invited Members
        </p>

        {invitedMembers.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No members invited yet.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {invitedMembers.map((email) => (
              <span
                key={email}
                className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
              >
                {email}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}