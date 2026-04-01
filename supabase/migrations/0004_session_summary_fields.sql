alter table session_summaries
add column if not exists possible_triggers text[] default '{}'::text[] not null;

alter table session_summaries
add column if not exists suggested_focus_area text default '' not null;
