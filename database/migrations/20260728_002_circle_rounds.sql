begin;

create table if not exists public.circle_rounds (
  id uuid primary key default gen_random_uuid(),

  circle_id uuid not null
    references public.circles(id)
    on delete cascade,

  round_number integer not null,

  payout_member_id uuid
    references public.circle_members(id)
    on delete set null,

  total_expected numeric(12, 2) not null default 0,
  total_received numeric(12, 2) not null default 0,

  status text not null default 'pending',

  started_at timestamptz not null default now(),
  completed_at timestamptz,

  created_at timestamptz not null default now()
);

create unique index if not exists
  circle_rounds_circle_round_unique
on public.circle_rounds (
  circle_id,
  round_number
);

create index if not exists
  circle_rounds_circle_id_idx
on public.circle_rounds(circle_id);

create index if not exists
  circle_rounds_status_idx
on public.circle_rounds(status);

create index if not exists
  circle_rounds_payout_member_id_idx
on public.circle_rounds(payout_member_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'circle_rounds_round_number_check'
  ) then
    alter table public.circle_rounds
      add constraint circle_rounds_round_number_check
      check (round_number >= 1);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'circle_rounds_totals_check'
  ) then
    alter table public.circle_rounds
      add constraint circle_rounds_totals_check
      check (
        total_expected >= 0
        and total_received >= 0
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'circle_rounds_status_check'
  ) then
    alter table public.circle_rounds
      add constraint circle_rounds_status_check
      check (
        status in (
          'pending',
          'active',
          'processing',
          'completed',
          'cancelled'
        )
      );
  end if;
end
$$;

alter table public.circle_rounds
enable row level security;

drop policy if exists
  "Users can view rounds for their circles"
on public.circle_rounds;

create policy
  "Users can view rounds for their circles"
on public.circle_rounds
for select
using (
  exists (
    select 1
    from public.circles c
    where c.id = circle_rounds.circle_id
      and (
        c.owner_id = auth.uid()
        or exists (
          select 1
          from public.circle_members cm
          where cm.circle_id = c.id
            and cm.user_id = auth.uid()
            and cm.status = 'accepted'
        )
      )
  )
);

drop policy if exists
  "Authenticated users can insert rounds"
on public.circle_rounds;

create policy
  "Authenticated users can insert rounds"
on public.circle_rounds
for insert
with check (
  auth.uid() is not null
);

drop policy if exists
  "Authenticated users can update rounds"
on public.circle_rounds;

create policy
  "Authenticated users can update rounds"
on public.circle_rounds
for update
using (
  auth.uid() is not null
)
with check (
  auth.uid() is not null
);

commit;