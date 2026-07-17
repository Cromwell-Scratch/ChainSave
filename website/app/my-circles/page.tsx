"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

type Circle = {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  currency: string;
  contribution_frequency: string;
  max_members: number;
  privacy: string;
  start_date: string | null;
};

export default function MyCirclesPage() {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCircles() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("circles")
        .select(
          "id, name, description, contribution_amount, currency, contribution_frequency, max_members, privacy, start_date"
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setCircles(data ?? []);
      }

      setLoading(false);
    }

    loadCircles();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1">
          <Topbar />

          <section className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  My Circles
                </h1>

                <p className="mt-2 text-gray-600">
                  View and manage your savings circles.
                </p>
              </div>

              <Button onClick={() => router.push("/create-circle")}>
                Create Circle
              </Button>
            </div>

            {loading && (
              <p className="mt-8 text-gray-600">
                Loading circles...
              </p>
            )}

            {message && (
              <p className="mt-8 text-sm font-medium text-red-600">
                {message}
              </p>
            )}

            {!loading && !message && circles.length === 0 && (
              <Card className="mt-8 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  No circles yet
                </h2>

                <p className="mt-2 text-gray-500">
                  Create your first savings circle to get started.
                </p>

                <Button
                  className="mt-6"
                  onClick={() => router.push("/create-circle")}
                >
                  Create Your First Circle
                </Button>
              </Card>
            )}

            {!loading && circles.length > 0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {circles.map((circle) => (
                  <Card key={circle.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {circle.name}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          {circle.privacy === "private"
                            ? "Private Circle"
                            : "Public Circle"}
                        </p>
                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-gray-600">
                      {circle.description || "No description provided."}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">
                          Contribution
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {circle.currency} {circle.contribution_amount}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Frequency
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {circle.contribution_frequency}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Max Members
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {circle.max_members}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Start Date
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {circle.start_date || "Not set"}
                        </p>
                      </div>
                    </div>

                    <Button
                       variant="secondary"
                       className="mt-6 w-full"
                       onClick={() => router.push(`/circles/${circle.id}`)}
                       >
                       View Circle
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}