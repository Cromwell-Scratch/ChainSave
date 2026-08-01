import { supabase } from "@/lib/supabase";

export async function findWalletByEmail(
  email: string
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.rpc(
    "resolve_recipient_wallet",
    {
      p_email: normalizedEmail,
    }
  );

  if (error) {
    console.error("Recipient lookup error:", error);

    if (
      error.message.includes("send money to yourself")
    ) {
      throw new Error(
        "You cannot send money to yourself."
      );
    }

    if (
      error.message.includes("wallet not found")
    ) {
      throw new Error(
        "The recipient does not have an active wallet."
      );
    }

    throw new Error("Recipient not found.");
  }

  if (!data) {
    throw new Error("Recipient not found.");
  }

  return data as string;
}