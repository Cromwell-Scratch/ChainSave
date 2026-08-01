"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpCircle,
  PlusCircle,
  Users,
  Wallet,
} from "lucide-react";

const actions = [
  {
    title: "Create Circle",
    description: "Start a new savings circle with friends or family.",
    icon: PlusCircle,
    route: "/create-circle",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    title: "Join Circle",
    description: "Accept an invitation or join an existing circle.",
    icon: Users,
    route: "/join-circle",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    title: "Deposit Funds",
    description: "Top up your wallet for future contributions.",
    icon: Wallet,
    route: "/wallet",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "Withdraw",
    description: "Transfer available funds from your wallet.",
    icon: ArrowUpCircle,
    route: "/wallet",
    gradient: "from-purple-500 to-fuchsia-600",
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Quick Actions
        </h2>

        <p className="mt-2 text-slate-500">
          Jump straight into the most common tasks.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={() => router.push(action.route)}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div
                className={`bg-gradient-to-r ${action.gradient} p-6 text-white`}
              >
                <Icon className="h-9 w-9" />
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-800">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {action.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-600">
                    Open
                  </span>

                  <ArrowRight className="h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:translate-x-2 group-hover:text-emerald-600" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}