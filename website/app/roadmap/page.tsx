"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bitcoin,
  Bug,
  CheckCircle2,
  CircleDot,
  Heart,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";

type Tone = "green" | "yellow" | "blue" | "red";

const toneStyles: Record<Tone, string> = {
  green: "border-green-200 bg-green-50 text-green-800",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

const health = [
  ["Authentication", "Operational", "green"],
  ["ChainSave Wallet", "Operational", "green"],
  ["Savings Circles", "Operational", "green"],
  ["Notifications", "Operational", "green"],
  ["Rootstock", "Testnet Live", "green"],
  ["Deposits", "Operational", "green"],
  ["Automatic Withdrawals", "Awaiting Paystack Upgrade", "yellow"],
] as const;

const completed = [
  {
    title: "Authentication",
    icon: ShieldCheck,
    progress: 100,
    items: ["Registration", "Email verification", "Login and logout", "Forgot password", "Password reset", "Protected sessions"],
  },
  {
    title: "ChainSave Wallet",
    icon: WalletCards,
    progress: 100,
    items: ["Wallet creation", "Paystack deposits", "Internal transfers", "Transaction history", "Optional Rootstock wallet", "Multi-currency structure"],
  },
  {
    title: "Savings Circles",
    icon: Users,
    progress: 100,
    items: ["Create circles", "Invite members", "Join circles", "Contributions", "Payout queue", "Progress tracking"],
  },
  {
    title: "Rootstock",
    icon: Bitcoin,
    progress: 95,
    items: ["Smart contracts", "Rootstock Testnet", "Explorer links", "Blockchain verification", "Relayer deployment", "Fee tracking"],
  },
  {
    title: "Admin Console",
    icon: Layers3,
    progress: 100,
    items: ["Dashboard", "Users", "Wallets", "Circles", "Finance", "Reports and audit logs"],
  },
];

const roadmap = [
  ["Automatic withdrawals", "Enable Paystack transfers to Mobile Money and bank accounts after business verification.", "In Progress", "yellow", "v1.1"],
  ["Rootstock Mainnet", "Move smart contracts from Rootstock Testnet to Mainnet.", "Planned", "blue", "v1.2"],
  ["Android application", "A native Android experience for users across Africa.", "Planned", "blue", "v2.0"],
  ["iPhone application", "A native iOS experience with the same wallet and circle features.", "Planned", "blue", "v2.0"],
  ["Referral rewards", "Reward users who invite trusted friends and communities.", "Under Review", "yellow", "Future"],
  ["AI savings assistant", "Personalised savings guidance, reminders and circle health insights.", "Under Review", "yellow", "Future"],
] as const;

const issues = [
  ["Currency conversion options", "Users with one funded currency may see limited conversion choices.", "Investigating", "yellow", "v1.0.1"],
  ["Automatic withdrawals", "Paystack automatic payouts are unavailable while the business remains on Starter status.", "External Dependency", "yellow", "v1.1"],
] as const;

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.16),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500 text-slate-950">
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">ChainSave</p>
                <p className="text-xs text-slate-400">Transparency Center</p>
              </div>
            </Link>

            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-green-400">
              Join Beta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          <div className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-300">
                <Sparkles className="h-4 w-4" />
                Public Beta
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
                Building the future of community savings in Africa.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Track ChainSave&apos;s development, platform health, roadmap, known issues and Rootstock progress in one public transparency center.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#roadmap" className="rounded-xl bg-white px-5 py-3 font-bold text-slate-950">View Roadmap</a>
                <a href="#known-issues" className="rounded-xl border border-white/15 px-5 py-3 font-bold text-white">Known Issues</a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">Overall Progress</p>
                  <p className="mt-3 text-5xl font-bold">96%</p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/15 text-green-300">
                  <Activity className="h-8 w-8" />
                </div>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-green-400 to-emerald-300" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <MiniStat label="Current Stage" value="Public Beta" />
                <MiniStat label="Last Updated" value="August 2026" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section title="Live service status" eyebrow="Platform Health" description="A public view of what is working today and what still depends on external approvals.">
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {health.map(([label, value, tone]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-bold">{label}</p>
                <CircleDot className={`h-5 w-5 ${tone === "green" ? "text-green-400" : "text-yellow-400"}`} />
              </div>
              <p className="mt-3 text-sm text-slate-400">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <section id="roadmap" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Heading eyebrow="Development Progress" title="What is already complete" description="Core product areas are operational in beta and ready for structured user testing." />
          <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {completed.map((module) => {
              const Icon = module.icon;
              return (
                <div key={module.title} className="rounded-3xl border border-white/10 bg-slate-900 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge label={module.progress === 100 ? "Completed" : "Nearly Complete"} tone={module.progress === 100 ? "green" : "yellow"} />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold">{module.title}</h3>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-green-400" style={{ width: `${module.progress}%` }} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-green-300">{module.progress}% complete</p>
                  <ul className="mt-5 space-y-3">
                    {module.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-16">
            <Heading eyebrow="Public Roadmap" title="What comes next" description="We are prioritising payment readiness, Rootstock Mainnet and mobile access." />
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {roadmap.map(([title, description, status, tone, version]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-slate-900 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <Badge label={status} tone={tone} />
                    <span className="text-sm font-semibold text-slate-500">{version}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section title="Recent product updates" eyebrow="Changelog" description="A clear record of what changed during the current beta release.">
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-green-300">August 2026</p>
              <h3 className="mt-1 text-2xl font-bold">v1.0 Beta</h3>
            </div>
            <Badge label="Live" tone="green" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Forgot Password and Password Reset",
              "Premium Wallet experience",
              "Premium Circle Details",
              "Super Admin Dashboard",
              "Admin User Management",
              "Admin Circle Management",
              "Reports, notifications and audit logs",
              "Rootstock verification and explorer links",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <section id="known-issues" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Heading eyebrow="Known Issues" title="What we are still improving" description="We publish known limitations openly so beta users know what to expect." />
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {issues.map(([title, description, status, tone, target]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-slate-900 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-300">
                    <Bug className="h-6 w-6" />
                  </div>
                  <Badge label={status} tone={tone} />
                </div>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                <div className="mt-5 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                  Target: <span className="font-bold text-white">{target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section title="Powered by Rootstock" eyebrow="Blockchain Status" description="ChainSave uses Rootstock smart contracts while keeping blockchain complexity optional for everyday users.">
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-orange-400/20 bg-orange-400/10 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">Current Network</p>
                <h3 className="mt-3 text-3xl font-bold">Rootstock Testnet</h3>
              </div>
              <Bitcoin className="h-10 w-10 text-orange-300" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MiniStat label="Smart Contracts" value="Verified" />
              <MiniStat label="Explorer Links" value="Available" />
              <MiniStat label="Relayer" value="Operational" />
              <MiniStat label="Mainnet" value="Planned" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">Country Rollout</p>
            <div className="mt-6 space-y-4">
              {[
                ["🇬🇭", "Ghana", "Public Beta", "green"],
                ["🇳🇬", "Nigeria", "Planned", "blue"],
                ["🇰🇪", "Kenya", "Planned", "blue"],
              ].map(([flag, name, status, tone]) => (
                <div key={name} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{flag}</span>
                    <p className="font-bold">{name}</p>
                  </div>
                  <Badge label={status} tone={tone as Tone} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <section className="border-t border-white/10 bg-gradient-to-r from-green-500/10 to-orange-500/10">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-slate-950">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-bold sm:text-4xl">Building financial trust, one savings circle at a time.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Every bug report, suggestion and test helps ChainSave become safer, clearer and more useful for communities across Africa.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-xl bg-green-500 px-5 py-3 font-bold text-slate-950">Join the Beta</Link>
            <Link href="/" className="rounded-xl border border-white/15 px-5 py-3 font-bold text-white">Back to Home</Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">Built with love on Rootstock. Secured by Bitcoin.</p>
        </div>
      </section>
    </main>
  );
}

function Section({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Heading title={title} eyebrow={eyebrow} description={description} />
      {children}
    </section>
  );
}

function Heading({ title, eyebrow, description }: { title: string; eyebrow: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mt-4 text-slate-400">{description}</p>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${toneStyles[tone]}`}>{label}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-bold">{value}</p>
    </div>
  );
}
