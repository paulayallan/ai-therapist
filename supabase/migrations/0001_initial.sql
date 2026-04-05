create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now() not null
);

create table if not exists mental_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  brings_you_here text[] default '{}'::text[] not null,
  current_mood int default 5 not null,
  therapist_style text default 'Practical Coach' not null,
  onboarding_completed boolean default false not null,
  main_challenges text[] default '{}'::text[] not null,
  stress_level int default 5 not null,
  sleep_quality int default 5 not null,
  triggers text[] default '{}'::text[] not null,
  coping_methods text[] default '{}'::text[] not null,
  goals text[] default '{}'::text[] not null,
  therapy_experience text default '' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id)
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  text_content text not null,
  voice_url text,
  emotional_analysis_json jsonb,
  created_at timestamptz default now() not null
);

create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mood int not null check (mood between 1 and 10),
  anxiety_level int not null check (anxiety_level between 1 and 10),
  energy int not null check (energy between 1 and 10),
  stress int not null check (stress between 1 and 10),
  sleep_quality int not null check (sleep_quality between 1 and 10),
  notes text,
  created_at timestamptz default now() not null
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz default now() not null
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  emotional_state text check (emotional_state in ('calm', 'anxious', 'sad', 'angry', 'overwhelmed')),
  structured_json jsonb,
  created_at timestamptz default now() not null
);

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

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  insight_type text not null,
  description text not null,
  generated_at timestamptz default now() not null
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  status text not null default 'inactive' check (status in ('inactive', 'active', 'trialing', 'past_due')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists strategy_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mode text not null check (mode in ('decision', 'social', 'life', 'burnout')),
  prompt text not null,
  response_json jsonb not null,
  created_at timestamptz default now() not null
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'inactive')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;
alter table mental_profiles enable row level security;
alter table journal_entries enable row level security;
alter table mood_logs enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table insights enable row level security;
alter table subscriptions enable row level security;
alter table strategy_sessions enable row level security;
alter table session_summaries enable row level security;

create policy "users can read own profile" on profiles for select using (auth.uid() = id);
create policy "users can read own mental profile" on mental_profiles for select using (auth.uid() = user_id);
create policy "users can upsert own mental profile" on mental_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own journal" on journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own mood logs" on mood_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own conversations" on conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own insights" on insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can read own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "users can manage own strategy sessions" on strategy_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own session summaries" on session_summaries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own messages" on messages
for all using (
  exists (
    select 1 from conversations where conversations.id = messages.conversation_id and conversations.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from conversations where conversations.id = messages.conversation_id and conversations.user_id = auth.uid()
  )
);
