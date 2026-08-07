"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [recoveryReady, setRecoveryReady] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        setMessage(
          "The password reset session could not be verified."
        );
      } else if (session) {
        setRecoveryReady(true);
      }

      setCheckingSession(false);
    }

    void checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "PASSWORD_RECOVERY" &&
          session
        ) {
          setRecoveryReady(true);
          setCheckingSession(false);
          setMessage("");
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password.length < 6) {
      setMessage(
        "Password should be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        "The passwords do not match."
      );
      return;
    }

    if (!recoveryReady) {
      setMessage(
        "This reset link is invalid or has expired. Request a new password reset link."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          {success ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : (
            <KeyRound className="h-7 w-7" />
          )}
        </div>

        <h1 className="mt-5 text-center text-3xl font-bold text-gray-900">
          {success
            ? "Password Updated"
            : "Create New Password"}
        </h1>

        <p className="mt-2 text-center text-gray-500">
          {success
            ? "Your password was changed successfully."
            : "Choose a strong new password for your ChainSave account."}
        </p>

        {success ? (
          <Link
            href="/login"
            className="mt-8 block w-full rounded-lg bg-green-700 py-3 text-center font-semibold text-white transition hover:bg-green-800"
          >
            Continue to Login
          </Link>
        ) : checkingSession ? (
          <p className="mt-8 text-center text-sm text-gray-600">
            Verifying your reset link...
          </p>
        ) : !recoveryReady ? (
          <div className="mt-8">
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
              This password reset link is invalid or has expired.
            </p>

            <Link
              href="/forgot-password"
              className="mt-5 block text-center font-semibold text-green-700 hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="new-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-600"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Confirm Password
              </label>

              <input
                id="confirm-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm your new password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-600"
              />
            </div>

            {message && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Updating Password..."
                : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}