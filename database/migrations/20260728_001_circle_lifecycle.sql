begin;

alter table public.circles
  add column if not exists current_payout_order integer not null default 1,
  add column if not exists completed boolean not null default false,
  add column if not exists started boolean not null default false,
  add column if not exists status text not null default 'upcoming',
  add column if not exists paused_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists closed_reason text,
  add column if not exists total_saved numeric not null default 0,
  add column if not exists current_round integer not null default 1,
  add column if not exists next_payout_member uuid,
  add column if not exists next_contribution_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'circles_next_payout_member_fkey'
  ) then
    alter table public.circles
      add constraint circles_next_payout_member_fkey
      foreign key (next_payout_member)
      references public.profiles(id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'circles_status_check'
  ) then
    alter table public.circles
      add constraint circles_status_check
      check (
        status in (
          'upcoming',
          'active',
          'paused',
          'completed'
        )
      );
  end if;
end
$$;

update public.circles
set status = case
  when completed = true then 'completed'
  when started = true then 'active'
  else 'upcoming'
end
where status is null
   or status not in (
     'upcoming',
     'active',
     'paused',
     'completed'
   );

update public.circles
set current_payout_order = 1
where current_payout_order is null
   or current_payout_order < 1;

update public.circles
set current_round = 1
where current_round is null
   or current_round < 1;

update public.circles
set total_saved = 0
where total_saved is null;

create index if not exists circles_status_idx
  on public.circles(status);

create index if not exists circles_started_idx
  on public.circles(started);

create index if not exists circles_completed_idx
  on public.circles(completed);

create index if not exists circles_next_payout_member_idx
  on public.circles(next_payout_member);

commit;