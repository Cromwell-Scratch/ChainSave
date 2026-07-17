"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateCirclePage() {
    const router = useRouter();

const [circleName, setCircleName] = useState("");
const [description, setDescription] = useState("");
const [contributionAmount, setContributionAmount] = useState("");
const [currency, setCurrency] = useState("GHS");
const [frequency, setFrequency] = useState("Weekly");
const [maxMembers, setMaxMembers] = useState("10");
const [startDate, setStartDate] = useState("");
const [privacy, setPrivacy] = useState("private");

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

async function handleCreateCircle(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setLoading(true);
  setMessage("");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setMessage("You must be logged in to create a circle.");
    setLoading(false);
    return;
  }

 const { data: newCircle, error: circleError } = await supabase
  .from("circles")
  .insert({
    owner_id: user.id,
    name: circleName,
    description,
    contribution_amount: Number(contributionAmount),
    currency,
    contribution_frequency: frequency,
    max_members: Number(maxMembers),
    start_date: startDate || null,
    privacy,
  })
  .select("id")
  .single();

if (circleError) {
  setMessage(circleError.message);
  setLoading(false);
  return;
}

const { error: memberError } = await supabase
  .from("circle_members")
  .insert({
    circle_id: newCircle.id,
    user_id: user.id,
    email: user.email ?? "",
    role: "owner",
    status: "accepted",
    joined_at: new Date().toISOString(),
    invited_by: user.id,
  });

if (memberError) {
  setMessage(
    `Circle created, but adding the owner failed: ${memberError.message}`
  );
  setLoading(false);
  return;
}

router.push(`/circles/${newCircle.id}`);
}
  return (
    <main className="min-h-screen bg-gray-100 flex">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <div className="p-8">
  <div className="max-w-3xl">
    <h1 className="text-4xl font-bold text-gray-900">
      Create Savings Circle
    </h1>

    <p className="mt-2 text-gray-600">
      Start a new savings circle and invite your friends.
    </p>

    <Card className="mt-8">
      <form onSubmit={handleCreateCircle} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Circle Name
          </label>

          <Input
              type="text"
              placeholder="Family Savings Circle"
              value={circleName}
              onChange={(event) => setCircleName(event.target.value)}
            />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Description
          </label>

          <textarea
                placeholder="Describe the purpose of this savings circle"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-32 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Contribution Amount
            </label>

            <Input
                type="number"
                placeholder="500"
                value={contributionAmount}
                onChange={(event) => setContributionAmount(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Currency
            </label>

            <select 
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
             >
              <option value="GHS">GHS — Ghana Cedi</option>
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="KES">KES — Kenyan Shilling</option>
            </select>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
  <div>
    <label className="mb-2 block text-sm font-semibold text-gray-700">
      Contribution Frequency
    </label>

    <select
      value={frequency}
      onChange={(event) => setFrequency(event.target.value)}
     className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600">
      <option>Daily</option>
      <option>Weekly</option>
      <option>Bi-Weekly</option>
      <option>Monthly</option>
    </select>

    <p className="mt-1 text-xs text-gray-500">
      Choose how often members contribute.
    </p>
  </div>

  <div>
    <label className="mb-2 block text-sm font-semibold text-gray-700">
      Maximum Members
    </label>

    <Input
  type="number"
  placeholder="10"
  value={maxMembers}
  onChange={(event) => setMaxMembers(event.target.value)}
/>

    <p className="mt-1 text-xs text-gray-500">
      Maximum of 100 members.
    </p>
  </div>
</div>
<div className="grid gap-6 md:grid-cols-2">
  <div>
    <label className="mb-2 block text-sm font-semibold text-gray-700">
      Start Date
    </label>

    <Input
  type="date"
  value={startDate}
  onChange={(event) => setStartDate(event.target.value)}
/>
  </div>

  <div>
    <label className="mb-2 block text-sm font-semibold text-gray-700">
      Privacy
    </label>

    <select className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600">
      <option value="private">Private (Invite Only) </option>
      <option value="public">Public </option>
    </select>

    <p className="mt-1 text-xs text-gray-500">
      Private circles are only accessible by invitation.
    </p>
  </div>
</div>
        </div>

        <Button
  type="submit"
  disabled={loading}
  className="w-full"
>
  {loading ? "Creating Circle..." : "Create Circle"}
</Button>
      </form>
      {message && (
  <p className="mt-4 text-center text-sm font-medium text-red-600">
    {message}
  </p>
)}
    </Card>
  </div>
</div>
      </div>
    </main>
  );
}