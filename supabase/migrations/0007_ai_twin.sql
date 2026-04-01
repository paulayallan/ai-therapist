create table if not exists ai_twin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  emotional_tendencies text[] default '{}'::text[] not null,
  thinking_patterns text[] default '{}'::text[] not null,
  common_triggers text[] default '{}'::text[] not null,
  behavioral_habits text[] default '{}'::text[] not null,
  profile_summary text default '' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists ai_twin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  question text not null,
  response text not null,
  created_at timestamptz default now() not null
);

alter table ai_twin_profiles enable row level security;
alter table ai_twin_sessions enable row level security;

drop policy if exists "users can manage own ai twin profile" on ai_twin_profiles;
create policy "users can manage own ai twin profile"
on ai_twin_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can manage own ai twin sessions" on ai_twin_sessions;
create policy "users can manage own ai twin sessions"
on ai_twin_sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
