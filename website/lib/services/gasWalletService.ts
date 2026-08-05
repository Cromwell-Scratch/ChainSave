import { supabase } from "@/lib/supabase";

export type GasWalletEntry = {
  direction: "credit" | "debit";
  localAmount: number;
  rbtcAmount: number;
  description?: string;
  reference?: string;
};

export async function recordGasWalletEntry(
  input: GasWalletEntry
) {
  const {
    error,
    data,
  } = await supabase
    .from("gas_wallet_ledger")
    .insert({
      direction: input.direction,
      local_amount: input.localAmount,
      rbtc_amount: input.rbtcAmount,
      description:
        input.description ?? null,
      reference:
        input.reference ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}