create table if not exists account_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  display_name text default '' not null,
  brings_you_here text[] default '{}'::text[] not null,
  therapist_style text default 'Practical Coach' not null,
  goals text[] default '{}'::text[] not null,
  emotional_themes text[] default '{}'::text[] not null,
  recurring_issues text[] default '{}'::text[] not null,
  common_triggers text[] default '{}'::text[] not null,
  memory_snippets text[] default '{}'::text[] not null,
  memory_summary text default '' not null,
  last_session_summary text default '' not null,
  last_detected_emotion text check (last_detected_emotion in ('calm', 'anxious', 'sad', 'angry', 'overwhelmed')),
  last_mood int,
  last_anxiety_level int,
  last_stress_level int,
  last_sleep_quality int,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table account_memory enable row level security;

drop policy if exists "users can manage own account memory" on account_memory;
create policy "users can manage own account memory"
on account_memory for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), split_part(coalesce(new.email, ''), '@', 1));

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'inactive')
  on conflict (user_id) do nothing;

  insert into public.account_memory (user_id, display_name)
  values (new.id, split_part(coalesce(new.email, ''), '@', 1))
  on conflict (user_id) do nothing;

  return new;
end;
$$;
