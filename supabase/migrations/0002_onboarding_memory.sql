alter table profiles
add column if not exists display_name text;

update profiles
set display_name = coalesce(nullif(display_name, ''), split_part(email, '@', 1))
where display_name is null or display_name = '';

alter table mental_profiles
add column if not exists brings_you_here text[] default '{}'::text[] not null;

alter table mental_profiles
add column if not exists current_mood int default 5 not null;

alter table mental_profiles
add column if not exists therapist_style text default 'Practical Coach' not null;

alter table messages
add column if not exists emotional_state text check (emotional_state in ('calm', 'anxious', 'sad', 'angry', 'overwhelmed'));

create table if not exists session_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  main_issue text not null,
  emotional_state text not null check (emotional_state in ('calm', 'anxious', 'sad', 'angry', 'overwhelmed')),
  emotional_themes text[] default '{}'::text[] not null,
  recurring_issues text[] default '{}'::text[] not null,
  suggested_next_steps text[] default '{}'::text[] not null,
  summary_text text not null,
  created_at timestamptz default now() not null
);

alter table session_summaries enable row level security;

drop policy if exists "users can manage own session summaries" on session_summaries;
create policy "users can manage own session summaries"
on session_summaries for all
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

  return new;
end;
$$;
