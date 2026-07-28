"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  UserRound,
  UserX,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: string;
  created_at: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            email,
            role,
            status,
            created_at
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setUsers((data as Profile[]) ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const searchableText = [
        user.full_name ?? "",
        user.email ?? "",
        user.role,
        user.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [search, users]);

  function formatDate(date: string | null) {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleDateString(
      "en-GH",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getInitials(user: Profile) {
    const source =
      user.full_name?.trim() ||
      user.email?.trim() ||
      "User";

    return source
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <section className="p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold text-gray-950">
          Users
        </h1>

        <p className="mt-2 text-gray-600">
          View and manage all registered ChainSave users.
        </p>
      </div>

      {message && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
          {message}
        </p>
      )}

      <Card className="mt-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <Input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, email, role or status"
              className="pl-12 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 px-4 py-2">
              <p className="text-sm font-semibold text-green-800">
                {filteredUsers.length} user
                {filteredUsers.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-gray-600">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <UserX className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-950">
              No users found
            </h2>

            <p className="mt-2 text-gray-500">
              Try changing your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">
                          {getInitials(user)}
                        </div>

                        <div>
                          <p className="font-bold text-gray-950">
                            {user.full_name ||
                              "No name provided"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-medium text-gray-900">
                        {user.email ||
                          "No email available"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UserRound className="h-3.5 w-3.5" />
                        )}

                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : user.status ===
                                "suspended"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-medium text-gray-900">
                        {formatDate(user.created_at)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}