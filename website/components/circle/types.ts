export type Circle = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  currency: string;
  contribution_frequency: string;
  max_members: number;
  start_date: string | null;
  privacy: string;
  created_at: string;
  current_payout_order: number;
  completed: boolean;
};

export type CircleMember = {
  id: string;
  user_id: string | null;
  email: string;
  role: string;
  status: string;
  joined_at: string | null;
};

export type CircleContribution = {
  id: string;
  member_id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string;
};

export type CirclePayout = {
  id: string;
  circle_id: string;
  member_id: string;
  payout_order: number;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
};

export type InviteForm = {
  email: string;
};

export type ContributionForm = {
  amount: number;
};