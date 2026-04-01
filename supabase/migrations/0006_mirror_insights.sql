create table if not exists mirror_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  observation text not null,
  feedback text check (feedback in ('very-accurate', 'somewhat-accurate', 'not-really')),
  created_at timestamptz default now() not null
);

alter table mirror_insights enable row level security;

drop policy if exists "users can manage own mirror insights" on mirror_insights;
create policy "users can manage own mirror insights"
on mirror_insights for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
