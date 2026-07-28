import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type InviteRequestBody = {
  recipientEmail: string;
  inviterName: string;
  circleName: string;
  description?: string | null;
  contributionAmount: number;
  currency: string;
  frequency: string;
  privacy: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "RESEND_API_KEY is missing from the server environment.",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as InviteRequestBody;

    const recipientEmail = body.recipientEmail
      ?.trim()
      .toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !recipientEmail ||
      !emailPattern.test(recipientEmail)
    ) {
      return NextResponse.json(
        { error: "A valid recipient email is required." },
        { status: 400 }
      );
    }

    if (!body.circleName?.trim()) {
      return NextResponse.json(
        { error: "The circle name is required." },
        { status: 400 }
      );
    }

    const contributionAmount = Number(
      body.contributionAmount
    );

    if (
      !Number.isFinite(contributionAmount) ||
      contributionAmount <= 0
    ) {
      return NextResponse.json(
        { error: "A valid contribution amount is required." },
        { status: 400 }
      );
    }

    const inviterName = escapeHtml(
      body.inviterName?.trim() || "A ChainSave member"
    );

    const circleName = escapeHtml(body.circleName.trim());

    const description = escapeHtml(
      body.description?.trim() ||
        "You have been invited to join this savings circle."
    );

    const currency = escapeHtml(
      body.currency?.trim() || "GHS"
    );

    const frequency = escapeHtml(
      body.frequency?.trim() || "Not specified"
    );

    const privacy = escapeHtml(
      body.privacy?.trim() || "private"
    );

    const formattedAmount =
      contributionAmount.toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const invitationUrl = `${request.nextUrl.origin}/invitations`;

    const resend = new Resend(apiKey);

    const fromAddress =
      process.env.RESEND_FROM_EMAIL ||
      "ChainSave <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [recipientEmail],
      subject: `You're invited to join ${body.circleName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>ChainSave Invitation</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            "
          >
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="background-color: #f3f4f6; padding: 32px 16px;"
            >
              <tr>
                <td align="center">
                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                      max-width: 620px;
                      overflow: hidden;
                      background-color: #ffffff;
                      border-radius: 20px;
                      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
                    "
                  >
                    <tr>
                      <td
                        style="
                          padding: 30px;
                          background: linear-gradient(
                            135deg,
                            #047857,
                            #16a34a
                          );
                          color: #ffffff;
                        "
                      >
                        <div
                          style="
                            font-size: 25px;
                            font-weight: 800;
                            letter-spacing: -0.5px;
                          "
                        >
                          Chain<span style="color: #f7931a;">Save</span>
                        </div>

                        <div
                          style="
                            margin-top: 6px;
                            color: #d1fae5;
                            font-size: 13px;
                          "
                        >
                          Save Together. Grow Together.
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 34px 30px;">
                        <div
                          style="
                            display: inline-block;
                            border-radius: 999px;
                            background-color: #ecfdf5;
                            color: #047857;
                            padding: 7px 12px;
                            font-size: 12px;
                            font-weight: 700;
                          "
                        >
                          SAVINGS CIRCLE INVITATION
                        </div>

                        <h1
                          style="
                            margin: 22px 0 12px;
                            font-size: 28px;
                            line-height: 1.25;
                            color: #111827;
                          "
                        >
                          You have been invited
                        </h1>

                        <p
                          style="
                            margin: 0;
                            color: #4b5563;
                            font-size: 16px;
                            line-height: 1.7;
                          "
                        >
                          <strong>${inviterName}</strong> has invited
                          you to join a savings circle on ChainSave.
                        </p>

                        <div
                          style="
                            margin-top: 26px;
                            border: 1px solid #d1fae5;
                            border-radius: 16px;
                            background-color: #f0fdf4;
                            padding: 22px;
                          "
                        >
                          <h2
                            style="
                              margin: 0;
                              color: #111827;
                              font-size: 22px;
                            "
                          >
                            ${circleName}
                          </h2>

                          <p
                            style="
                              margin: 8px 0 0;
                              color: #4b5563;
                              font-size: 14px;
                              line-height: 1.6;
                            "
                          >
                            ${description}
                          </p>

                          <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            style="margin-top: 22px;"
                          >
                            <tr>
                              <td
                                style="
                                  padding: 10px 0;
                                  color: #6b7280;
                                  font-size: 14px;
                                "
                              >
                                Contribution
                              </td>

                              <td
                                align="right"
                                style="
                                  padding: 10px 0;
                                  color: #111827;
                                  font-size: 14px;
                                  font-weight: 700;
                                "
                              >
                                ${currency} ${formattedAmount}
                              </td>
                            </tr>

                            <tr>
                              <td
                                style="
                                  padding: 10px 0;
                                  border-top: 1px solid #d1fae5;
                                  color: #6b7280;
                                  font-size: 14px;
                                "
                              >
                                Frequency
                              </td>

                              <td
                                align="right"
                                style="
                                  padding: 10px 0;
                                  border-top: 1px solid #d1fae5;
                                  color: #111827;
                                  font-size: 14px;
                                  font-weight: 700;
                                "
                              >
                                ${frequency}
                              </td>
                            </tr>

                            <tr>
                              <td
                                style="
                                  padding: 10px 0;
                                  border-top: 1px solid #d1fae5;
                                  color: #6b7280;
                                  font-size: 14px;
                                "
                              >
                                Privacy
                              </td>

                              <td
                                align="right"
                                style="
                                  padding: 10px 0;
                                  border-top: 1px solid #d1fae5;
                                  color: #111827;
                                  font-size: 14px;
                                  font-weight: 700;
                                  text-transform: capitalize;
                                "
                              >
                                ${privacy}
                              </td>
                            </tr>
                          </table>
                        </div>

                        <div style="margin-top: 28px;">
                          <a
                            href="${invitationUrl}"
                            style="
                              display: inline-block;
                              border-radius: 10px;
                              background-color: #059669;
                              color: #ffffff;
                              padding: 14px 24px;
                              font-size: 15px;
                              font-weight: 700;
                              text-decoration: none;
                            "
                          >
                            Review Invitation
                          </a>
                        </div>

                        <p
                          style="
                            margin: 24px 0 0;
                            color: #6b7280;
                            font-size: 13px;
                            line-height: 1.6;
                          "
                        >
                          Sign in using the same email address that
                          received this message, then accept or decline
                          the invitation from your Invitations page.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          border-top: 1px solid #e5e7eb;
                          padding: 22px 30px;
                          color: #9ca3af;
                          font-size: 12px;
                          text-align: center;
                        "
                      >
                        This invitation was sent through ChainSave,
                        a Bitcoin-powered community savings platform.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend invitation error:", error);

      return NextResponse.json(
        {
          error:
            error.message ||
            "Resend was unable to send the invitation.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailId: data?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Invitation API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send the invitation email.",
      },
      { status: 500 }
    );
  }
}