import { supabase } from "@/lib/supabase";

export interface Wallet {
  id: string;
  user_id: string;
}

export interface WalletBalance {
  wallet_id: string;
  currency: string;
  available_balance: number;
  locked_balance: number;
}

export interface WalletLedgerEntry {
  id: string;
  wallet_id: string;
  currency: string;
  entry_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export type WalletAddress = {
  id: string;
  wallet_id: string;
  network: string;
  address: string;
  public_key: string | null;
  is_primary: boolean;
  is_active: boolean;
  metadata: {
    chain_id?: number;
    native_currency?: string;
    balance?: string | number;
    explorer_url?: string;
    provider?: string;
    connected_at?: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export interface UserPreference {
  display_currency: string;
  default_payment_method: string | null;
}

export async function getWallet() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("wallets")
    .select("id,user_id")
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  return data as Wallet;
}

export async function getBalances(walletId: string) {
  const { data, error } = await supabase
    .from("wallet_balances")
    .select("*")
    .eq("wallet_id", walletId)
    .order("currency");

  if (error) throw error;

  return (data ?? []) as WalletBalance[];
}

export async function getLedger(
  walletId: string,
  limit = 10
) {
  const { data, error } = await supabase
    .from("wallet_ledger")
    .select(`
      id,
      wallet_id,
      currency,
      entry_type,
      amount,
      balance_before,
      balance_after,
      description,
      created_at
    `)
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []) as WalletLedgerEntry[];
}

export async function getWalletAddress(walletId: string) {
  const { data, error } = await supabase
    .from("wallet_addresses")
    .select(`
      id,
        wallet_id,
        network,
        address,
        public_key,
        is_primary,
        is_active,
        metadata,
        created_at,
        updated_at
    `)
    .eq("wallet_id", walletId)
    .eq("is_active", true)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data as WalletAddress | null;
}

export async function getUserPreferences() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("display_currency,default_payment_method")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      display_currency: "GHS",
      default_payment_method: null,
    } satisfies UserPreference;
  }

  return data as UserPreference;
}

export async function deposit(
  currency: string,
  amount: number,
  description = "Wallet Deposit"
) {
  const wallet = await getWallet();

  const { error } = await supabase.rpc("wallet_deposit", {
    p_wallet_id: wallet.id,
    p_currency: currency,
    p_amount: amount,
    p_description: description,
  });

  if (error) throw error;
}

export async function withdraw(
  currency: string,
  amount: number,
  description = "Wallet Withdrawal"
) {
  const wallet = await getWallet();

  const { error } = await supabase.rpc("wallet_withdraw", {
    p_wallet_id: wallet.id,
    p_currency: currency,
    p_amount: amount,
    p_description: description,
  });

  if (error) throw error;
}

export async function convert(
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number,
  toAmount: number,
  description = "Currency Conversion"
) {
  const wallet = await getWallet();

  const { error } = await supabase.rpc("wallet_convert", {
    p_wallet_id: wallet.id,
    p_from_currency: fromCurrency,
    p_to_currency: toCurrency,
    p_from_amount: fromAmount,
    p_to_amount: toAmount,
    p_description: description,
  });

  if (error) throw error;
}

export async function sendInternal(
  receiverWalletId: string,
  currency: string,
  amount: number,
  description = "Internal Transfer"
) {
  const wallet = await getWallet();

  const { error } = await supabase.rpc("wallet_send_internal", {
    p_sender_wallet_id: wallet.id,
    p_receiver_wallet_id: receiverWalletId,
    p_currency: currency,
    p_amount: amount,
    p_description: description,
  });

  if (error) throw error;
}

