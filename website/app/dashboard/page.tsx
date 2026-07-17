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

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

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
  <StatsCards />
  <div className="mt-8">
  <QuickActions />
  <div className="mt-8">
  <ActivityList />
</div>
</div>
</div>
          </section>
        </div>
      </div>
    </main>
  );
}