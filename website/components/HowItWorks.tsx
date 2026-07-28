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
      className="py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-20">

          <span className="inline-block rounded-full bg-orange-100 px-5 py-2 text-sm font-semibold text-orange-600">
            How It Works
          </span>

          <h2 className="mt-6 text-5xl font-bold text-gray-900">
            Save Together in 5 Simple Steps
          </h2>

          <p className="mt-5 text-xl text-gray-600 max-w-3xl mx-auto">
            ChainSave combines trusted community savings with Bitcoin
            security, making saving together safer, simpler and transparent.
          </p>

        </div>

        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-8">

          {steps.map((step, index) => {

            const Icon = step.icon;

            return (

              <div
                key={step.title}
                className="relative group"
              >

                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 p-8 h-full">

                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-6 group-hover:bg-green-600 transition">

                    <Icon className="w-8 h-8 text-green-700 group-hover:text-white transition" />

                  </div>

                  <div className="text-sm font-bold text-green-600 mb-2">
                    Step {index + 1}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-gray-600 leading-7">
                    {step.description}
                  </p>

                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 -right-6 w-12 border-t-2 border-dashed border-green-300"></div>
                )}

              </div>

            );
          })}

        </div>

      </div>
    </section>
  );
}