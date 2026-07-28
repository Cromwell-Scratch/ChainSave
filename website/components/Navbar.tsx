"use client";

import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* Logo */}
        <Link href="#home" className="flex items-center">
          <Image
            src="/brand/chainsave-logo1.png"
            alt="ChainSave"
            width={190}
            height={60}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-10 md:flex">
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
            className="rounded-xl bg-green-600 px-7 py-3 font-semibold text-white transition duration-300 hover:bg-green-700 hover:shadow-lg"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-gray-800 bg-black md:hidden">
          <div className="flex flex-col px-6 py-6 space-y-5">

            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-white transition hover:text-green-400"
              >
                {link.name}
              </a>
            ))}

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-white transition hover:text-green-400"
            >
              Login
            </Link>

            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Get Started
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}