import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CircleAction =
  | "pause"
  | "resume"
  | "cancel";

type UpdateCircleBody = {
  action?: CircleAction;
  reason?: string;
};

async function requireAdmin(
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
  } = await supabaseAdmin.auth.getUser(
    token
  );

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabaseAdmin
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
      await requireAdmin(request);

    const { id: circleId } =
      await context.params;

    const body =
      (await request.json()) as UpdateCircleBody;

    const action = body.action;

    if (
      action !== "pause" &&
      action !== "resume" &&
      action !== "cancel"
    ) {
      return NextResponse.json(
        {
          error:
            "Action must be pause, resume or cancel.",
        },
        { status: 400 }
      );
    }

    const {
      data: circle,
      error: circleError,
    } = await supabaseAdmin
      .from("circles")
      .select(
        `
          id,
          name,
          status,
          started,
          completed,
          closed_reason
        `
      )
      .eq("id", circleId)
      .single();

    if (circleError || !circle) {
      return NextResponse.json(
        { error: "Circle not found." },
        { status: 404 }
      );
    }

    if (
      circle.completed ||
      circle.status === "completed"
    ) {
      return NextResponse.json(
        {
          error:
            "A completed circle cannot be changed.",
        },
        { status: 400 }
      );
    }

    if (
      action === "cancel" &&
      circle.status === "cancelled"
    ) {
      return NextResponse.json({
        success: true,
        message:
          "The circle is already cancelled.",
      });
    }

    const now = new Date().toISOString();

    const update =
      action === "pause"
        ? {
            status: "paused",
            paused_at: now,
          }
        : action === "resume"
          ? {
              status:
                circle.started
                  ? "active"
                  : "upcoming",
              paused_at: null,
            }
          : {
              status: "cancelled",
              closed_reason:
                body.reason?.trim() ||
                "Cancelled by an administrator.",
              completed: false,
              completed_at: null,
            };

    const { error: updateError } =
      await supabaseAdmin
        .from("circles")
        .update(update)
        .eq("id", circleId);

    if (updateError) {
      throw updateError;
    }

    try {
      await supabaseAdmin
        .from("audit_logs")
        .insert({
          admin_id: admin.id,
          action: `circle_${action}`,
          entity_type: "circle",
          entity_id: circleId,
          description: `${formatLabel(
            action
          )} circle ${circle.name}.`,
          metadata: {
            before: {
              status: circle.status,
            },
            after: update,
          },
          created_at: now,
        });
    } catch (auditError) {
      console.warn(
        "Unable to record circle audit log:",
        auditError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "pause"
          ? "Circle paused successfully."
          : action === "resume"
            ? "Circle resumed successfully."
            : "Circle cancelled successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update the circle.";

    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : 500;

    console.error(
      "Admin circle update failed:",
      error
    );

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}
