create or replace function public.start_circle_payouts(
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

  v_member record;

  v_member_count integer;
  v_payout_amount numeric;
  v_order integer := 1;

  v_first_member_id uuid;
  v_first_member_user_id uuid;
  v_round_id uuid;
begin
  if v_user_id is null then
    raise exception 'You must be logged in.';
  end if;

  select *
  into v_circle
  from public.circles
  where id = p_circle_id
  for update;

  if not found then
    raise exception 'Savings circle not found.';
  end if;

  if v_circle.owner_id <> v_user_id then
    raise exception
      'Only the circle owner can start this circle.';
  end if;

  if
    v_circle.completed = true
    or v_circle.status = 'completed'
  then
    raise exception
      'This savings circle is already completed.';
  end if;

  if v_circle.started = true then
    raise exception
      'This savings circle has already started.';
  end if;

  if exists (
    select 1
    from public.circle_payouts
    where circle_id = p_circle_id
  ) then
    raise exception
      'A payout queue already exists for this circle.';
  end if;

  if exists (
    select 1
    from public.circle_rounds
    where circle_id = p_circle_id
  ) then
    raise exception
      'Savings rounds already exist for this circle.';
  end if;

  if exists (
    select 1
    from public.circle_cycles
    where circle_id = p_circle_id
  ) then
    raise exception
      'A savings cycle already exists for this circle.';
  end if;

  select count(*)
  into v_member_count
  from public.circle_members
  where circle_id = p_circle_id
    and status = 'accepted';

  if v_member_count < 2 then
    raise exception
      'At least two accepted members are required to start the circle.';
  end if;

  select
    id,
    user_id
  into
    v_first_member_id,
    v_first_member_user_id
  from public.circle_members
  where circle_id = p_circle_id
    and status = 'accepted'
  order by
    joined_at asc nulls first,
    created_at asc,
    id asc
  limit 1;

  if v_first_member_id is null then
    raise exception
      'The first payout member could not be determined.';
  end if;

  if v_first_member_user_id is null then
    raise exception
      'The first payout member is not linked to a registered user.';
  end if;

  v_payout_amount :=
    v_circle.contribution_amount
    * v_member_count;

  insert into public.circle_cycles (
    circle_id,
    current_position,
    status,
    created_at
  )
  values (
    p_circle_id,
    1,
    'active',
    now()
  );

  for v_member in
    select
      id,
      user_id
    from public.circle_members
    where circle_id = p_circle_id
      and status = 'accepted'
    order by
      joined_at asc nulls first,
      created_at asc,
      id asc
  loop
    insert into public.circle_payouts (
      circle_id,
      member_id,
      payout_order,
      amount,
      status,
      created_at
    )
    values (
      p_circle_id,
      v_member.id,
      v_order,
      v_payout_amount,
      'pending',
      now()
    );

    v_order := v_order + 1;
  end loop;

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
    1,
    v_first_member_id,
    v_payout_amount,
    0,
    'active',
    now(),
    null
  )
  returning id
  into v_round_id;

  update public.circles
  set
    started = true,
    completed = false,
    status = 'active',
    current_payout_order = 1,
    current_round = 1,
    next_payout_member =
      v_first_member_user_id,
    next_contribution_date =
      coalesce(
        start_date,
        current_date
      ),
    paused_at = null,
    completed_at = null,
    closed_reason = null
  where id = p_circle_id;

  return jsonb_build_object(
    'success', true,
    'circle_id', p_circle_id,
    'round_id', v_round_id,
    'round_number', 1,
    'accepted_members', v_member_count,
    'payout_member_id', v_first_member_id,
    'payout_member_user_id',
      v_first_member_user_id,
    'payout_amount', v_payout_amount,
    'total_expected', v_payout_amount,
    'total_received', 0,
    'queue_length', v_order - 1,
    'status', 'active'
  );
end;
$function$;