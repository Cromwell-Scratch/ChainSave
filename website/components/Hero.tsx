import Link from "next/link";
import {
  Bitcoin,
  CheckCircle2,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-white via-green-50 to-white px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:min-h-[85vh] lg:px-8"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative z-10 text-center lg:text-left">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700 sm:text-sm">
            <Bitcoin className="h-4 w-4 shrink-0" />
            <span>
              Bitcoin-powered community savings
            </span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Save Together.
            <br />
            <span className="text-green-600">
              Build Wealth with Bitcoin.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
            ChainSave helps families, friends,
            churches, cooperatives, and
            communities save together through
            transparent Bitcoin-powered savings
            circles secured by Rootstock smart
            contracts.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4 lg:justify-start">
            <Link
              href="/register"
              className="rounded-xl bg-green-600 px-6 py-3.5 text-center font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-xl sm:px-8 sm:py-4"
            >
              Start Saving
            </Link>

            <a
              href="#how-it-works"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-center font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:px-8 sm:py-4"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-7 grid gap-3 text-left text-sm font-medium text-slate-700 sm:mt-8 sm:grid-cols-3 sm:text-center lg:text-left">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 shrink-0 text-orange-500" />
              <span>Built on Bitcoin</span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <span>Powered by Rootstock</span>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 shrink-0 text-slate-700" />
              <span>
                Smart Contract Protected
              </span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-xl justify-center lg:justify-end">
          <div className="absolute -right-10 top-0 h-72 w-72 rounded-full bg-green-300 opacity-20 blur-[120px]" />

          <div className="absolute -left-8 top-8 hidden rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-lg sm:block lg:-left-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Bitcoin className="h-5 w-5 text-orange-500" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Bitcoin secured
                </p>
                <p className="font-semibold text-slate-900">
                  Transparent savings
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-[430px] rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-green-600">
                  Active savings circle
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                  Family Savings Circle
                </h3>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  10 active members
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 sm:h-12 sm:w-12">
                <Users className="h-6 w-6 text-green-700" />
              </div>
            </div>

            <div className="mt-6 flex -space-x-2">
              <div className="h-10 w-10 rounded-full border-2 border-white bg-green-600 sm:h-11 sm:w-11" />
              <div className="h-10 w-10 rounded-full border-2 border-white bg-blue-500 sm:h-11 sm:w-11" />
              <div className="h-10 w-10 rounded-full border-2 border-white bg-yellow-500 sm:h-11 sm:w-11" />
              <div className="h-10 w-10 rounded-full border-2 border-white bg-purple-500 sm:h-11 sm:w-11" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-700 sm:h-11 sm:w-11 sm:text-sm">
                +6
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-slate-50 p-4 sm:mt-8 sm:p-5">
              <p className="text-sm text-slate-500">
                Total saved
              </p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-3xl font-bold text-green-700 sm:text-4xl">
                  GHS 5,000
                </h2>

                <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  80% funded
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Goal: GHS 6,250
              </p>

              <div className="mt-5 h-3 rounded-full bg-slate-200">
                <div className="h-3 w-4/5 rounded-full bg-green-700" />
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Latest activity
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    Ama K. contributed
                  </p>

                  <p className="text-sm text-slate-500">
                    Deposit received today
                  </p>
                </div>

                <p className="font-bold text-green-700">
                  +GHS 500
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-10 right-4 hidden rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-lg sm:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-5 w-5 text-green-700" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Protected by
                </p>
                <p className="font-semibold text-slate-900">
                  Rootstock smart contracts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
