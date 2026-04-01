create table if not exists tool_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  tool_id text not null,
  tier text not null check (tier in ('free', 'pro', 'premium')),
  rank int not null,
  relevance_label text not null,
  why_recommended text not null,
  trigger_label text not null,
  score numeric default 0 not null,
  created_at timestamptz default now() not null,
  unique (user_id, week_start, tool_id)
);

create table if not exists saved_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tool_id text not null,
  saved_at timestamptz default now() not null,
  unique (user_id, tool_id)
);

alter table tool_recommendations enable row level security;
alter table saved_tools enable row level security;

drop policy if exists "users can read own tool recommendations" on tool_recommendations;
create policy "users can read own tool recommendations"
on tool_recommendations for select
using (auth.uid() = user_id);

drop policy if exists "users can manage own tool recommendations" on tool_recommendations;
create policy "users can manage own tool recommendations"
on tool_recommendations for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can read own saved tools" on saved_tools;
create policy "users can read own saved tools"
on saved_tools for select
using (auth.uid() = user_id);

drop policy if exists "users can manage own saved tools" on saved_tools;
create policy "users can manage own saved tools"
on saved_tools for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
