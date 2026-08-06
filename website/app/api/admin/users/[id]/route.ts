import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type UpdateUserBody = {
  status?: "active" | "suspended";
  role?: "user" | "admin";
};

async function getAuthenticatedAdmin(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  const token =
    authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } =
    await supabaseAdmin
      .from("profiles")
      .select("id, role, status")
      .eq("id", user.id)
      .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin" ||
    profile.status !== "active"
  ) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const admin =
      await getAuthenticatedAdmin(request);

    const { id: targetUserId } =
      await context.params;

    const body =
      (await request.json()) as UpdateUserBody;

    const update: UpdateUserBody = {};

    if (body.status) {
      if (
        body.status !== "active" &&
        body.status !== "suspended"
      ) {
        return NextResponse.json(
          {
            error:
              "Status must be active or suspended.",
          },
          { status: 400 }
        );
      }

      update.status = body.status;
    }

    if (body.role) {
      if (
        body.role !== "user" &&
        body.role !== "admin"
      ) {
        return NextResponse.json(
          {
            error:
              "Role must be user or admin.",
          },
          { status: 400 }
        );
      }

      update.role = body.role;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        {
          error:
            "Provide a status or role update.",
        },
        { status: 400 }
      );
    }

    if (admin.id === targetUserId) {
      if (
        update.status === "suspended" ||
        update.role === "user"
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot suspend or demote your own admin account.",
          },
          { status: 400 }
        );
      }
    }

    const {
      data: targetProfile,
      error: targetError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, status")
      .eq("id", targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        { status: 404 }
      );
    }

    const { error: updateError } =
      await supabaseAdmin
        .from("profiles")
        .update({
          ...update,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", targetUserId);

    if (updateError) {
      throw updateError;
    }

    /*
     * Keep wallet access aligned with the user
     * profile whenever account status changes.
     */
    if (update.status) {
      const walletStatus =
        update.status === "suspended"
          ? "frozen"
          : "active";

      const walletUpdate: Record<
        string,
        string | null
      > = {
        status: walletStatus,
        updated_at:
          new Date().toISOString(),
      };

      if (walletStatus === "frozen") {
        walletUpdate.frozen_at =
          new Date().toISOString();
      } else {
        walletUpdate.frozen_at = null;
      }

      const { error: walletError } =
        await supabaseAdmin
          .from("wallets")
          .update(walletUpdate)
          .eq("user_id", targetUserId);

      if (walletError) {
        console.error(
          "Profile updated but wallet synchronization failed:",
          walletError
        );
      }
    }

    /*
     * Audit logging is best-effort so a missing or
     * differently shaped audit table does not block
     * a critical account-management action.
     */
    try {
      await supabaseAdmin
        .from("admin_audit_logs")
        .insert({
          admin_id: admin.id,
          action: "user_updated",
          entity_type: "profile",
          entity_id: targetUserId,
          metadata: {
            before: {
              role: targetProfile.role,
              status: targetProfile.status,
            },
            after: update,
          },
        });
    } catch (auditError) {
      console.warn(
        "Unable to record admin audit log:",
        auditError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        update.status === "suspended"
          ? "User suspended and wallet frozen."
          : update.status === "active"
            ? "User activated and wallet restored."
            : update.role === "admin"
              ? "User promoted to admin."
              : "Admin role removed.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update the user.";

    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : 500;

    console.error(
      "Admin user update failed:",
      error
    );

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
