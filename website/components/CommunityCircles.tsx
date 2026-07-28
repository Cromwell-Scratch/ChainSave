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
      className="py-28 bg-gradient-to-b from-green-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-14">
          <h2 className="text-5xl font-bold text-gray-900">
            Community Savings Circles
          </h2>

          <p className="mt-5 text-xl text-gray-600">
            Join trusted Bitcoin-powered savings circles across Africa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {circles.map((circle) => (

            <div
              key={circle.id}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition duration-300 border border-gray-100"
            >

              <div className="flex justify-between items-center">

                <h3 className="text-2xl font-bold">
                  {circle.name}
                </h3>

                {circle.private ? (
                  <Lock className="text-gray-500" />
                ) : (
                  <Globe className="text-green-600" />
                )}

              </div>

              <p className="text-gray-500 mt-3">
                {circle.frequency} Contributions
              </p>

              <div className="flex items-center gap-2 mt-6">

                <Users className="text-green-600 h-5 w-5" />

                <span className="text-gray-700">
                  {circle.members} Members
                </span>

              </div>

              <div className="mt-6">

                <div className="h-3 rounded-full bg-gray-200">

                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${circle.progress}%` }}
                  />

                </div>

                <p className="text-sm text-gray-500 mt-2">
                  {circle.progress}% funded
                </p>

              </div>

              <div className="mt-8">

                <p className="text-gray-500">
                  Total Saved
                </p>

                <h2 className="text-3xl font-bold text-green-700">
                  {circle.amount}
                </h2>

              </div>

              <Link
                href="/join-circle"
                className="mt-8 inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-800"
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