"use client";

import {
  CalendarClock,
  CircleCheck,
  Lightbulb,
  Mail,
  Target,
  TrendingUp,
} from "lucide-react";

type SmartInsightsProps = {
  totalSavings: number;
  savingsGoal: number;
  pendingInvites: number;
  nextContribution: string;
  upcomingPayout: string;
  activeCircles: number;
};

type Insight = {
  title: string;
  description: string;
  icon: typeof Target;
  iconClassName: string;
  iconBackground: string;
};

export default function SmartInsights({
  totalSavings,
  savingsGoal,
  pendingInvites,
  nextContribution,
  upcomingPayout,
  activeCircles,
}: SmartInsightsProps) {
  const progress =
    savingsGoal > 0
      ? Math.min(
          Math.round(
            (totalSavings / savingsGoal) * 100
          ),
          100
        )
      : 0;

  const insights: Insight[] = [];

  if (savingsGoal > 0) {
    insights.push({
      title: `${progress}% of your goal reached`,
      description:
        progress >= 80
          ? "You are very close to reaching your savings target."
          : progress >= 50
            ? "You are more than halfway toward your savings goal."
            : "Keep contributing consistently to build momentum.",
      icon: Target,
      iconClassName: "text-emerald-600",
      iconBackground: "bg-emerald-50",
    });
  }

  if (
    nextContribution !==
    "No upcoming payment"
  ) {
    insights.push({
      title: "Contribution reminder",
      description: `Your next contribution is due ${nextContribution.toLowerCase()}.`,
      icon: CalendarClock,
      iconClassName: "text-blue-600",
      iconBackground: "bg-blue-50",
    });
  }

  if (pendingInvites > 0) {
    insights.push({
      title: `${pendingInvites} pending ${
        pendingInvites === 1
          ? "invitation"
          : "invitations"
      }`,
      description:
        "Review your invitations and respond when you are ready.",
      icon: Mail,
      iconClassName: "text-orange-600",
      iconBackground: "bg-orange-50",
    });
  }

  if (
    upcomingPayout !== "Not scheduled"
  ) {
    insights.push({
      title: "Upcoming payout",
      description: upcomingPayout,
      icon: TrendingUp,
      iconClassName: "text-purple-600",
      iconBackground: "bg-purple-50",
    });
  }

  if (activeCircles > 0) {
    insights.push({
      title: `${activeCircles} active ${
        activeCircles === 1
          ? "circle"
          : "circles"
      }`,
      description:
        "Your savings circles are active and contributing toward your goals.",
      icon: CircleCheck,
      iconClassName: "text-teal-600",
      iconBackground: "bg-teal-50",
    });
  }

  const visibleInsights = insights.slice(
    0,
    4
  );

  return (
    <section className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-50 p-3">
          <Lightbulb className="h-6 w-6 text-amber-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Smart Insights
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Helpful updates based on your
            savings activity.
          </p>
        </div>
      </div>

      {visibleInsights.length > 0 ? (
        <div className="mt-6 space-y-4">
          {visibleInsights.map(
            (insight) => {
              const Icon = insight.icon;

              return (
                <article
                  key={`${insight.title}-${insight.description}`}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${insight.iconBackground}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${insight.iconClassName}`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">
                      {insight.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {insight.description}
                    </p>
                  </div>
                </article>
              );
            }
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <CircleCheck className="mx-auto h-8 w-8 text-emerald-600" />

          <h3 className="mt-3 font-semibold text-slate-800">
            You are all caught up
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            New insights will appear as you
            save and join circles.
          </p>
        </div>
      )}
    </section>
  );
}