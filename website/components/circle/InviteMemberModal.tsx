"use client";

import type { FormEvent } from "react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type InviteMemberModalProps = {
  open: boolean;
  email: string;
  loading: boolean;
  message: string;

  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
};

export default function InviteMemberModal({
  open,
  email,
  loading,
  message,
  onClose,
  onSubmit,
  onEmailChange,
}: InviteMemberModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Invite Member
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Invite someone to join this savings circle.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Email Address
            </label>

            <Input
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(event) =>
                onEmailChange(event.target.value)
              }
              required
            />
          </div>

          {message && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {message}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send Invitation"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}