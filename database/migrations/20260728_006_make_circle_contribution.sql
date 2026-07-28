create or replace function public.make_circle_contribution(
  p_circle_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();

  v_circle public.circles%rowtype;
  v_member public.circle_members%rowtype;
  v_wallet public.wallets%rowtype;
  v_cycle public.circle_cycles%rowtype;

  v_round_number integer;
  v_contribution_amount numeric;
  v_new_wallet_balance numeric;

  v_contribution_id uuid;
  v_wallet_transaction_id uuid;

  v_accepted_members integer;
  v_completed_contributions integer;

  v_expected_round_total numeric;
  v_completed_round_total numeric;
begin
  if v_user_id is null then
    raise exception
      'You must be logged in.';
  end if;

  select *
  into v_circle
  from public.circles
  where id = p_circle_id
  for update;

  if not found then
    raise exception
      'Savings circle not found.';
  end if;

  if not coalesce(
    v_circle.started,
    false
  ) then
    raise exception
      'This savings circle has not started yet.';
  end if;

  if
    coalesce(
      v_circle.completed,
      false
    )
    or
    v_circle.status = 'completed'
  then
    raise exception
      'This savings circle is already completed.';
  end if;

  if v_circle.status = 'paused' then
    raise exception
      'This savings circle is currently paused.';
  end if;

  select *
  into v_member
  from public.circle_members
  where circle_id = p_circle_id
    and user_id = v_user_id
    and status = 'accepted'
  limit 1;

  if not found then
    raise exception
      'Only accepted members can contribute to this circle.';
  end if;

  select *
  into v_cycle
  from public.circle_cycles
  where circle_id = p_circle_id
    and status = 'active'
  order by created_at desc
  limit 1
  for update;

  if found then
    v_round_number :=
      greatest(
        coalesce(
          v_cycle.current_position,
          1
        ),
        1
      );
  else
    v_round_number :=
      greatest(
        coalesce(
          v_circle.current_payout_order,
          1
        ),
        1
      );
  end if;

  v_contribution_amount :=
    coalesce(
      v_circle.contribution_amount,
      0
    );

  if v_contribution_amount <= 0 then
    raise exception
      'The contribution amount for this circle is invalid.';
  end if;

  if exists (
    select 1
    from public.contributions
    where circle_id = p_circle_id
      and member_id = v_member.id
      and round_number = v_round_number
      and status = 'completed'
  ) then
    raise exception
      'You have already contributed for this round.';
  end if;

  select *
  into v_wallet
  from public.wallets
  where user_id = v_user_id
  for update;

  if not found then
    raise exception
      'Wallet not found.';
  end if;

  if
    upper(v_wallet.currency)
    <>
    upper(v_circle.currency)
  then
    raise exception
      'Wallet currency does not match the circle currency.';
  end if;

  if
    coalesce(v_wallet.balance, 0)
    <
    v_contribution_amount
  then
    raise exception
      'Insufficient wallet balance.';
  end if;

  update public.wallets
  set balance =
    coalesce(balance, 0) -
    v_contribution_amount
  where id = v_wallet.id
  returning balance
  into v_new_wallet_balance;

  insert into public.wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    description,
    status,
    created_at
  )
  values (
    v_wallet.id,
    -v_contribution_amount,
    'contribution',
    'Round ' ||
      v_round_number ||
      ' contribution to ' ||
      v_circle.name,
    'completed',
    now()
  )
  returning id
  into v_wallet_transaction_id;

  insert into public.contributions (
    circle_id,
    member_id,
    amount,
    currency,
    payment_method,
    transaction_reference,
    status,
    paid_at,
    created_at,
    round_number
  )
  values (
    p_circle_id,
    v_member.id,
    v_contribution_amount,
    v_circle.currency,
    'wallet',
    v_wallet_transaction_id::text,
    'completed',
    now(),
    now(),
    v_round_number
  )
  returning id
  into v_contribution_id;

  insert into public.notifications (
    user_id,
    circle_id,
    title,
    message,
    type,
    is_read,
    created_at
  )
  values (
    v_user_id,
    p_circle_id,
    'Contribution completed',
    upper(v_circle.currency) ||
      ' ' ||
      to_char(
        v_contribution_amount,
        'FM999999999990.00'
      ) ||
      ' was contributed to ' ||
      v_circle.name ||
      ' for round ' ||
      v_round_number ||
      '.',
    'contribution',
    false,
    now()
  );

  select count(*)
  into v_accepted_members
  from public.circle_members
  where circle_id = p_circle_id
    and status = 'accepted';

  select count(*)
  into v_completed_contributions
  from public.contributions
  where circle_id = p_circle_id
    and round_number = v_round_number
    and status = 'completed';

  v_expected_round_total :=
    v_contribution_amount *
    v_accepted_members;

  select coalesce(
    sum(amount),
    0
  )
  into v_completed_round_total
  from public.contributions
  where circle_id = p_circle_id
    and round_number = v_round_number
    and status = 'completed';

  update public.circle_rounds
  set
    total_expected =
      v_expected_round_total,
    total_received =
      v_completed_round_total,
    status =
      case
        when
          v_completed_contributions >=
          v_accepted_members
        then 'processing'
        else 'active'
      end
  where circle_id = p_circle_id
    and round_number = v_round_number;

  update public.circles
  set total_saved =
    coalesce(total_saved, 0) +
    v_contribution_amount
  where id = p_circle_id;

  return jsonb_build_object(
    'success',
      true,

    'circle_id',
      p_circle_id,

    'member_id',
      v_member.id,

    'round_number',
      v_round_number,

    'contribution_id',
      v_contribution_id,

    'wallet_transaction_id',
      v_wallet_transaction_id,

    'amount',
      v_contribution_amount,

    'currency',
      v_circle.currency,

    'wallet_balance',
      v_new_wallet_balance,

    'accepted_members',
      v_accepted_members,

    'completed_contributions',
      v_completed_contributions,

    'expected_round_total',
      v_expected_round_total,

    'completed_round_total',
      v_completed_round_total,

    'round_complete',
      v_completed_contributions >=
      v_accepted_members
  );
end;
$function$;