import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const { data: rounds, error } = await supabase
      .from("circle_rounds")
      .select(`
        *,
        circles (
          id,
          name,
          contribution_amount,
          status
        )
      `)
      .eq("status", "active");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      activeRounds: rounds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}