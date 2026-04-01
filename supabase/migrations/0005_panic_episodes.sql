create table if not exists panic_episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  trigger text not null check (trigger in ('Work stress', 'Social situation', 'Relationship', 'Overthinking', 'Physical symptoms', 'Unknown')),
  location text not null check (location in ('Home', 'Work', 'Outside', 'With people', 'Alone')),
  recovery_time text not null check (recovery_time in ('1-5 minutes', '5-10 minutes', '10-20 minutes', '20+ minutes')),
  check_in text not null check (check_in in ('calmer', 'still-anxious')),
  created_at timestamptz default now() not null
);

alter table panic_episodes enable row level security;

drop policy if exists "users can manage own panic episodes" on panic_episodes;
create policy "users can manage own panic episodes"
on panic_episodes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
