import {
  createClient,
} from "@supabase/supabase-js";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  processContribution,
} from "@/lib/server/contributions/processContribution";

export const runtime = "nodejs";

type ContributionRequestBody = {
  circleId?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAccessToken(
  request: NextRequest
) {
  const authorizationHeader =
    request.headers.get("authorization");

  if (
    !authorizationHeader?.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  return authorizationHeader.slice(
    "Bearer ".length
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Required Supabase environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const accessToken =
      getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication is required.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as ContributionRequestBody;

    const circleId =
      body.circleId?.trim();

    if (!circleId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A circle ID is required.",
        },
        { status: 400 }
      );
    }

    if (!UUID_PATTERN.test(circleId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The circle ID is invalid.",
        },
        { status: 400 }
      );
    }

    const userClient = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        global: {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    const result =
      await processContribution({
        userClient,
        circleId,
      });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Contribution API error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to complete the contribution.";

    const isBusinessError =
      message !==
      "Unable to complete the contribution.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          isBusinessError ? 400 : 500,
      }
    );
  }
}
