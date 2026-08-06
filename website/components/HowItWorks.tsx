import {
  Users,
  UserPlus,
  Wallet,
  ShieldCheck,
  Trophy,
} from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Create a Circle",
    description:
      "Start a savings circle for your family, friends, coworkers or community.",
  },
  {
    icon: UserPlus,
    title: "Invite Members",
    description:
      "Invite trusted people to join your Bitcoin-powered savings circle.",
  },
  {
    icon: Wallet,
    title: "Save Together",
    description:
      "Members contribute weekly or monthly according to the agreed schedule.",
  },
  {
    icon: ShieldCheck,
    title: "Secured by Bitcoin",
    description:
      "Every contribution is transparently secured using Rootstock smart contracts.",
  },
  {
    icon: Trophy,
    title: "Receive Your Payout",
    description:
      "Members receive their payout according to the agreed rotation with complete transparency.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-white py-16 sm:py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center sm:mb-14 lg:mb-20">
          <span className="inline-block rounded-full bg-orange-100 px-5 py-2 text-sm font-semibold text-orange-600">
            How It Works
          </span>

          <h2 className="mt-5 text-3xl font-bold text-gray-900 sm:mt-6 sm:text-4xl lg:text-5xl">
            Save Together in 5 Simple Steps
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-600 sm:mt-5 sm:text-xl">
            ChainSave combines trusted community
            savings with Bitcoin security, making
            saving together safer, simpler and
            transparent.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="group relative"
              >
                <div className="h-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-7 lg:p-6 xl:p-8">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 transition group-hover:bg-green-600 sm:h-16 sm:w-16">
                    <Icon className="h-7 w-7 text-green-700 transition group-hover:text-white sm:h-8 sm:w-8" />
                  </div>

                  <div className="mb-2 text-sm font-bold text-green-600">
                    Step {index + 1}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                    {step.title}
                  </h3>

                  <p className="mt-4 leading-7 text-gray-600">
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="absolute -right-3 top-16 hidden w-6 border-t-2 border-dashed border-green-300 lg:block xl:-right-5 xl:w-10" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
