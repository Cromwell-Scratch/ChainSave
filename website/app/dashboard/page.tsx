"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { supabase } from "@/lib/supabase";
import StatsCards from "@/components/dashboard/StatsCards";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityList from "@/components/dashboard/ActivityList";
export default function DashboardPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [activeCircles, setActiveCircles] = useState(0);
  const [pendingInvites, setPendingInvites] = useState(0);

  useEffect(() => {
  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const user = session.user;
    const userEmail = user.email?.trim().toLowerCase();

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    setWalletBalance(Number(wallet?.balance ?? 0));

    const { count: circlesCount } = await supabase
      .from("circle_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "accepted");

    setActiveCircles(circlesCount ?? 0);

    if (userEmail) {
      const { count: inviteCount } = await supabase
        .from("circle_members")
        .select("*", { count: "exact", head: true })
        .eq("email", userEmail)
        .eq("status", "pending");

      setPendingInvites(inviteCount ?? 0);
    }

    const { data: contributions } = await supabase
      .from("contributions")
      .select("amount");

    const savings =
      contributions?.reduce(
        (sum, contribution) =>
          sum + Number(contribution.amount),
        0
      ) ?? 0;

    setTotalSavings(savings);
    setCheckingSession(false);
  }

  checkSession();
}, [router]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1">
          <Topbar />

          <section className="p-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back 👋
            </h1>

            <p className="mt-2 text-gray-600">
              Here&apos;s what&apos;s happening with your savings today.
            </p>
             <div className="mt-8">
  <div className="mt-8">
  <StatsCards
    walletBalance={walletBalance}
    totalSavings={totalSavings}
    activeCircles={activeCircles}
    pendingInvites={pendingInvites}
  />
</div>

<div className="mt-8">
  <QuickActions />
</div>

<div className="mt-8">
  <ActivityList />
</div>
</div>
          </section>
        </div>
      </div>
    </main>
  );
}