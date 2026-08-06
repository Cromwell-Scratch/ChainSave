import Link from "next/link";
import {
  Users,
  ArrowRight,
  Lock,
  Globe,
} from "lucide-react";

const circles = [
  {
    id: 1,
    name: "Family Circle",
    frequency: "Weekly",
    members: 10,
    amount: "GHS 8,000",
    progress: 80,
    private: false,
  },
  {
    id: 2,
    name: "Church Savings",
    frequency: "Monthly",
    members: 18,
    amount: "GHS 20,500",
    progress: 65,
    private: false,
  },
  {
    id: 3,
    name: "Business Women",
    frequency: "Bi-weekly",
    members: 12,
    amount: "GHS 12,300",
    progress: 55,
    private: true,
  },
];

export default function CommunityCircles() {
  return (
    <section
      id="circles"
      className="bg-gradient-to-b from-green-50 to-white py-16 sm:py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center sm:mb-14">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
            Community Savings Circles
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:mt-5 sm:text-xl">
            Join trusted Bitcoin-powered savings
            circles across Africa.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {circles.map((circle) => (
            <div
              key={circle.id}
              className="min-w-0 rounded-3xl border border-gray-100 bg-white p-5 shadow-lg transition duration-300 hover:shadow-2xl sm:p-7 lg:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="min-w-0 text-xl font-bold text-gray-900 sm:text-2xl">
                  {circle.name}
                </h3>

                {circle.private ? (
                  <Lock className="h-6 w-6 shrink-0 text-gray-500" />
                ) : (
                  <Globe className="h-6 w-6 shrink-0 text-green-600" />
                )}
              </div>

              <p className="mt-3 text-sm text-gray-500 sm:text-base">
                {circle.frequency} Contributions
              </p>

              <div className="mt-6 flex items-center gap-2">
                <Users className="h-5 w-5 shrink-0 text-green-600" />

                <span className="text-gray-700">
                  {circle.members} Members
                </span>
              </div>

              <div className="mt-6">
                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-green-600"
                    style={{
                      width: `${circle.progress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  {circle.progress}% funded
                </p>
              </div>

              <div className="mt-8">
                <p className="text-sm text-gray-500 sm:text-base">
                  Total Saved
                </p>

                <h2 className="mt-1 break-words text-2xl font-bold text-green-700 sm:text-3xl">
                  {circle.amount}
                </h2>
              </div>

              <Link
                href="/join-circle"
                className="mt-8 inline-flex items-center gap-2 font-semibold text-green-700 hover:text-green-800"
              >
                Join Circle
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
