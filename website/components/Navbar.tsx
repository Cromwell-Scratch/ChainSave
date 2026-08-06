"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "Circles", href: "#circles" },
  { name: "About", href: "#about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:h-24 sm:px-6 lg:px-8">
        <Link
          href="#home"
          className="flex min-w-0 items-center"
          onClick={() =>
            setMenuOpen(false)
          }
        >
          <Image
            src="/brand/chainsave-logo1.png"
            alt="ChainSave"
            width={190}
            height={60}
            className="h-auto w-[150px] sm:w-[190px]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex lg:gap-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="font-medium text-white transition duration-300 hover:text-green-400"
            >
              {link.name}
            </a>
          ))}

          <Link
            href="/login"
            className="font-medium text-white transition duration-300 hover:text-green-400"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition duration-300 hover:bg-green-700 hover:shadow-lg"
          >
            Get Started
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white transition hover:bg-white/10 md:hidden"
          onClick={() =>
            setMenuOpen(
              (current) => !current
            )
          }
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-800 bg-black md:hidden">
          <div className="mx-auto flex max-h-[calc(100vh-5rem)] max-w-7xl flex-col gap-2 overflow-y-auto px-4 py-5 sm:px-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() =>
                  setMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 font-medium text-white transition hover:bg-white/10 hover:text-green-400"
              >
                {link.name}
              </a>
            ))}

            <Link
              href="/login"
              onClick={() =>
                setMenuOpen(false)
              }
              className="rounded-xl px-4 py-3 font-medium text-white transition hover:bg-white/10 hover:text-green-400"
            >
              Login
            </Link>

            <Link
              href="/register"
              onClick={() =>
                setMenuOpen(false)
              }
              className="mt-2 rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
