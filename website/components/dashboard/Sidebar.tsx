"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";

import { supabase } from "@/lib/supabase";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({
  open = false,
  onClose = () => {},
}: SidebarProps) {
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

        if (!user) return;

        setUserName(user.user_metadata?.full_name || "User");
        setUserEmail(user.email || "");
      } catch (error) {
        console.error("Unable to connect to Supabase:", error);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  async function handleLogout() {
    await supabase.auth.signOut();
    onClose();
    router.push("/login");
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[min(19rem,85vw)]
          flex-col border-r border-gray-200 bg-white p-5 shadow-xl
          transition-transform duration-300 sm:p-6
          lg:static lg:z-auto lg:min-h-screen lg:w-64
          lg:translate-x-0 lg:shadow-md
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-end lg:hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex justify-center py-2">
          <Image
            src="/brand/chainsave-logo.png"
            alt="ChainSave"
            width={220}
            height={70}
            className="h-auto w-full max-w-[220px]"
            priority
          />
        </div>

        <div className="my-2 border-b border-gray-200" />

        <nav className="mt-1 space-y-2">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" &&
                pathname.startsWith(`${link.href}/`));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`block rounded-lg px-4 py-3 font-medium transition duration-200 ${
                  active
                    ? "bg-green-700 text-white shadow-md"
                    : "text-gray-700 hover:translate-x-1 hover:bg-gray-100"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 font-semibold text-white">
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
    </>
  );
}
