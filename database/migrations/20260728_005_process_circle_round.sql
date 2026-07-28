create or replace function public.process_circle_round(
  p_circle_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_circle public.circles%rowtype;
  v_cycle public.circle_cycles%rowtype;
  v_round public.circle_rounds%rowtype;
  v_payout public.circle_payouts%rowtype;
  v_recipient_member public.circle_members%rowtype;
  v_recipient_wallet public.wallets%rowtype;

  v_round_number integer;
  v_member_count integer;
  v_completed_contributions integer;

  v_expected_total numeric;
  v_received_total numeric;
  v_next_round integer;
  v_next_payout public.circle_payouts%rowtype;

  v_wallet_transaction_id uuid;
begin
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
      'This savings circle has not started.';
  end if;

  if
    coalesce(
      v_circle.completed,
      false
    )
    or v_circle.status = 'completed'
  then
    return jsonb_build_object(
      'success',
      true,
      'processed',
      false,
      'reason',
      'circle_completed',
      'circle_id',
      p_circle_id
    );
  end if;

  if v_circle.status = 'paused' then
    return jsonb_build_object(
      'success',
      true,
      'processed',
      false,
      'reason',
      'circle_paused',
      'circle_id',
      p_circle_id
    );
  end if;

  select *
  into v_cycle
  from public.circle_cycles
  where circle_id = p_circle_id
    and status = 'active'
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception
      'No active savings cycle was found.';
  end if;

  v_round_number :=
    greatest(
      coalesce(
        v_cycle.current_position,
        1
      ),
      1
    );

  select *
  into v_round
  from public.circle_rounds
  where circle_id = p_circle_id
    and round_number =
      v_round_number
  for update;

  if not found then
    raise exception
      'The active circle round could not be found.';
  end if;

  if v_round.status = 'completed' then
    return jsonb_build_object(
      'success',
      true,
      'processed',
      false,
      'reason',
      'round_already_completed',
      'circle_id',
      p_circle_id,
      'round_number',
      v_round_number
    );
  end if;

  select count(*)
  into v_member_count
  from public.circle_members
  where circle_id = p_circle_id
    and status = 'accepted';

  if v_member_count < 2 then
    raise exception
      'At least two accepted members are required.';
  end if;

  select
    count(*),
    coalesce(
      sum(amount),
      0
    )
  into
    v_completed_contributions,
    v_received_total
  from public.contributions
  where circle_id = p_circle_id
    and round_number =
      v_round_number
    and status = 'completed';

  v_expected_total :=
    v_circle.contribution_amount
    * v_member_count;

  update public.circle_rounds
  set
    total_expected =
      v_expected_total,
    total_received =
      v_received_total,
    status =
      case
        when
          v_completed_contributions >=
          v_member_count
        then 'processing'
        else 'active'
      end
  where id = v_round.id;

  if
    v_completed_contributions <
    v_member_count
  then
    return jsonb_build_object(
      'success',
      true,
      'processed',
      false,
      'reason',
      'awaiting_contributions',
      'circle_id',
      p_circle_id,
      'round_number',
      v_round_number,
      'accepted_members',
      v_member_count,
      'completed_contributions',
      v_completed_contributions,
      'total_expected',
      v_expected_total,
      'total_received',
      v_received_total
    );
  end if;

  select *
  into v_payout
  from public.circle_payouts
  where circle_id = p_circle_id
    and payout_order =
      v_round_number
  for update;

  if not found then
    raise exception
      'The payout record for this round was not found.';
  end if;

  if v_payout.status in (
    'completed',
    'paid'
  ) then
    return jsonb_build_object(
      'success',
      true,
      'processed',
      false,
      'reason',
      'payout_already_completed',
      'circle_id',
      p_circle_id,
      'round_number',
      v_round_number
    );
  end if;

  select *
  into v_recipient_member
  from public.circle_members
  where id = v_payout.member_id
    and circle_id = p_circle_id
    and status = 'accepted';

  if not found then
    raise exception
      'The payout recipient is not an accepted member.';
  end if;

  if
    v_recipient_member.user_id
    is null
  then
    raise exception
      'The payout recipient is not linked to a registered user.';
  end if;

  select *
  into v_recipient_wallet
  from public.wallets
  where user_id =
    v_recipient_member.user_id
  for update;

  if not found then
    raise exception
      'The payout recipient does not have a wallet.';
  end if;

  if
    upper(
      v_recipient_wallet.currency
    )
    <>
    upper(
      v_circle.currency
    )
  then
    raise exception
      'The recipient wallet currency does not match the circle currency.';
  end if;

  update public.wallets
  set balance =
    coalesce(
      balance,
      0
    ) + v_expected_total
  where id =
    v_recipient_wallet.id;

  insert into
    public.wallet_transactions (
      wallet_id,
      amount,
      transaction_type,
      description,
      status,
      created_at
    )
  values (
    v_recipient_wallet.id,
    v_expected_total,
    'payout',
    'Round ' ||
      v_round_number ||
      ' payout from ' ||
      v_circle.name,
    'completed',
    now()
  )
  returning id
  into v_wallet_transaction_id;

  update public.circle_payouts
  set
    status = 'completed',
    paid_at = now()
  where id = v_payout.id;

  update public.circle_rounds
  set
    total_expected =
      v_expected_total,
    total_received =
      v_received_total,
    status = 'completed',
    completed_at = now()
  where id = v_round.id;

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
    v_recipient_member.user_id,
    p_circle_id,
    'Circle payout completed',
    upper(
      v_circle.currency
    ) ||
      ' ' ||
      to_char(
        v_expected_total,
        'FM999999999990.00'
      ) ||
      ' was paid to your wallet for round ' ||
      v_round_number ||
      ' of ' ||
      v_circle.name ||
      '.',
    'payout',
    false,
    now()
  );

  v_next_round :=
    v_round_number + 1;

  select *
  into v_next_payout
  from public.circle_payouts
  where circle_id = p_circle_id
    and payout_order =
      v_next_round
    and status = 'pending'
  limit 1;

  if not found then
    update public.circle_cycles
    set
      status = 'completed',
      current_position =
        v_round_number
    where id = v_cycle.id;

    update public.circles
    set
      completed = true,
      status = 'completed',
      current_round =
        v_round_number,
      current_payout_order =
        v_round_number,
      next_payout_member = null,
      next_contribution_date = null,
      completed_at = now()
    where id = p_circle_id;

    insert into public.notifications (
      user_id,
      circle_id,
      title,
      message,
      type,
      is_read,
      created_at
    )
    select
      member.user_id,
      p_circle_id,
      'Savings circle completed',
      v_circle.name ||
        ' has completed all savings rounds.',
      'circle_completed',
      false,
      now()
    from public.circle_members
      as member
    where
      member.circle_id =
        p_circle_id
      and member.status =
        'accepted'
      and member.user_id
        is not null;

    return jsonb_build_object(
      'success',
      true,
      'processed',
      true,
      'circle_completed',
      true,
      'circle_id',
      p_circle_id,
      'round_number',
      v_round_number,
      'payout_member_id',
      v_recipient_member.id,
      'payout_user_id',
      v_recipient_member.user_id,
      'payout_amount',
      v_expected_total,
      'wallet_transaction_id',
      v_wallet_transaction_id
    );
  end if;

  select *
  into v_recipient_member
  from public.circle_members
  where id =
    v_next_payout.member_id;

  if
    not found
    or
    v_recipient_member.user_id
    is null
  then
    raise exception
      'The next payout recipient is invalid.';
  end if;

  insert into public.circle_rounds (
    circle_id,
    round_number,
    payout_member_id,
    total_expected,
    total_received,
    status,
    started_at,
    completed_at
  )
  values (
    p_circle_id,
    v_next_round,
    v_next_payout.member_id,
    v_expected_total,
    0,
    'active',
    now(),
    null
  )
  on conflict (
    circle_id,
    round_number
  )
  do update
  set
    payout_member_id =
      excluded.payout_member_id,
    total_expected =
      excluded.total_expected,
    total_received = 0,
    status = 'active',
    started_at = now(),
    completed_at = null;

  update public.circle_cycles
  set current_position =
    v_next_round
  where id = v_cycle.id;

  update public.circles
  set
    current_round =
      v_next_round,
    current_payout_order =
      v_next_round,
    next_payout_member =
      v_recipient_member.user_id,
    next_contribution_date =
      public
        .calculate_next_contribution_date(
          coalesce(
            next_contribution_date,
            current_date
          ),
          contribution_frequency
        )
  where id = p_circle_id;

  return jsonb_build_object(
    'success',
    true,
    'processed',
    true,
    'circle_completed',
    false,
    'circle_id',
    p_circle_id,
    'completed_round',
    v_round_number,
    'next_round',
    v_next_round,
    'payout_member_id',
    v_payout.member_id,
    'payout_user_id',
    v_recipient_member.user_id,
    'payout_amount',
    v_expected_total,
    'wallet_transaction_id',
    v_wallet_transaction_id,
    'next_payout_member_id',
    v_next_payout.member_id,
    'next_payout_user_id',
    v_recipient_member.user_id
  );
end;
$function$;