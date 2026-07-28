"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

    export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
const [userName, setUserName] = useState("User");
const [userEmail, setUserEmail] = useState("");

  const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "My Circles", href: "/my-circles" },
  { name: "Create Circle", href: "/create-circle" },
  { name: "Invitations", href: "/invitations" },
  { name: "Wallet", href: "/wallet" },
  { name: "Transactions", href: "/transactions" },
  { name: "Settings", href: "/settings" },
];
useEffect(() => {
  async function loadUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Unable to load user:", error.message);
        return;
      }

      if (!user) {
        return;
      }

      setUserName(user.user_metadata?.full_name || "User");
      setUserEmail(user.email || "");
    } catch (error) {
      console.error("Unable to connect to Supabase:", error);
    }
  }

  loadUser();
}, []);

async function handleLogout() {
  await supabase.auth.signOut();
  router.push("/login");
}
  return (
  <aside className="flex w-64 min-h-screen flex-col border-r border-gray-200 bg-white p-6 shadow-md">

    <div className="flex justify-center py-2">
  <Image
    src="/brand/chainsave-logo.png"
    alt="ChainSave"
    width={220}
    height={70}
    priority
  />
</div>

<div className="my-2 border-b border-gray-200" />

<nav className="mt-1 space-y-2">
  {links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      className={`block rounded-lg px-4 py-3 font-medium transition duration-200 ${
        pathname === link.href
          ? "bg-green-700 text-white shadow-md"
          : "text-gray-700 hover:translate-x-1 hover:bg-gray-100"
      }`}
    >
      {link.name}
    </Link>
  ))}
</nav>
      <div className="mt-auto border-t border-gray-200 pt-6">
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 font-semibold text-white">
      {userName.charAt(0).toUpperCase()}
    </div>

    <div className="min-w-0">
      <p className="truncate font-semibold text-gray-900">
        {userName}
      </p>

      <p className="truncate text-xs text-gray-500">
        {userEmail}
      </p>
    </div>
  </div>

  <button
    type="button"
    onClick={handleLogout}
    className="mt-4 w-full rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
  >
    Logout
  </button>
</div>
    </aside>
  );
}