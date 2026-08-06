"use client";

import type {
  ComponentType,
  ReactNode,
} from "react";
import {
  useEffect,
  useState,
} from "react";
import {
  Bell,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

type AdminLayoutProps = {
  children: ReactNode;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{
    className?: string;
  }>;
};

type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Wallets",
        href: "/admin/wallets",
        icon: WalletCards,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Finance",
        href: "/admin/finance",
        icon: CircleDollarSign,
      },
      {
        label: "Fee Settings",
        href: "/admin/finance/settings",
        icon: Settings,
      },
      {
        label: "Transactions",
        href: "/admin/transactions",
        icon: WalletCards,
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        label: "Reports",
        href: "/admin/reports",
        icon: ChartNoAxesCombined,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: ClipboardList,
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [adminEmail, setAdminEmail] =
    useState("");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.replace("/login");
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", user.id)
          .single();

        if (
          profileError ||
          !profile ||
          profile.role !== "admin" ||
          profile.status !== "active"
        ) {
          router.replace("/dashboard");
          return;
        }

        setAdminEmail(user.email ?? "");
        setCheckingAccess(false);
      } catch (error) {
        console.error(
          "Unable to verify admin access:",
          error
        );

        router.replace("/dashboard");
      }
    }

    void checkAdminAccess();
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isItemActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-400">
            <ShieldCheck className="h-7 w-7 animate-pulse" />
          </div>

          <p className="mt-4 font-medium text-gray-300">
            Verifying admin access...
          </p>
        </div>
      </main>
    );
  }

  const Sidebar = () => (
    <>
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold">
              ChainSave Admin
            </p>

            <p className="text-xs text-gray-400">
              Operations Console
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-7">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <p className="px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                {group.title}
              </p>

              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(
                    item.href
                  );

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() =>
                        router.push(item.href)
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                        active
                          ? "bg-green-600 text-white shadow-sm"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs text-gray-400">
            Signed in as
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-white">
            {adminEmail}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="min-h-screen lg:flex">
        <aside className="hidden w-80 shrink-0 flex-col bg-gray-950 text-white lg:flex">
          <Sidebar />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() =>
                setMobileOpen(false)
              }
              className="absolute inset-0 bg-black/50"
            />

            <aside className="relative z-10 flex h-full w-[86%] max-w-sm flex-col bg-gray-950 text-white shadow-2xl">
              <button
                type="button"
                aria-label="Close admin menu"
                onClick={() =>
                  setMobileOpen(false)
                }
                className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <Sidebar />
            </aside>
          </div>
        )}

        <div className="min-w-0 w-full flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open admin menu"
                onClick={() =>
                  setMobileOpen(true)
                }
                className="rounded-xl border border-gray-200 p-2.5 text-gray-700 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <p className="text-sm font-semibold text-green-700">
                  Admin Console
                </p>

                <p className="hidden text-sm text-gray-500 sm:block">
                  Monitor and manage ChainSave
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:px-4"
            >
              Back to App
            </button>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}
