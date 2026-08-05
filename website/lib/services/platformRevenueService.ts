import { supabase } from "@/lib/supabase";

export type RevenueEntryType =
  | "platform_fee"
  | "gas_reserve"
  | "withdrawal"
  | "refund"
  | "adjustment";

export type RevenueDirection =
  | "credit"
  | "debit";

export type RecordRevenueInput = {
  entryType: RevenueEntryType;
  direction: RevenueDirection;
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
};

export async function recordPlatformRevenue(
  input: RecordRevenueInput
) {
  const {
    error,
    data,
  } = await supabase
    .from("platform_revenue_ledger")
    .insert({
      entry_type: input.entryType,
      direction: input.direction,
      amount: input.amount,
      currency: input.currency ?? "GHS",
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