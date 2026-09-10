-- ---------------------------------------------------------------------------
-- Mentara v2 — read-only check against the live `ai-therapist` database.
--
-- Paste the whole thing into the Supabase SQL editor and run it.
-- It reads catalogue metadata only: it creates nothing, changes nothing and
-- touches no user data. Safe to run against production.
--
-- Anything in the results marked *** is a problem.
-- ---------------------------------------------------------------------------

with expected(t) as (values
  ('account_memory'),('ai_twin_profiles'),('ai_twin_sessions'),('conversations'),
  ('daily_check_ins'),('homework_items'),('homework_lists'),('insights'),
  ('journal_entries'),('mental_profiles'),('messages'),('mirror_insights'),
  ('mood_logs'),('panic_episodes'),('profiles'),('saved_tools'),
  ('session_summaries'),('subscriptions'),('usage_counters'),
  ('user_activity_events'),('user_support_preferences')
),

-- 1. Every table v2 queries must exist. A missing one is a 500 on first use.
missing_tables as (
  select 1 as sort, '*** MISSING TABLE' as finding, e.t as detail
  from expected e
  left join information_schema.tables i
    on i.table_schema = 'public' and i.table_name = e.t
  where i.table_name is null
),

-- 2. RLS is the ONLY thing stopping one account reading another's rows.
--    v2 deliberately does not add defensive user_id filters.
rls_off as (
  select 2, '*** RLS DISABLED', c.relname::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join expected e on e.t = c.relname
  where n.nspname = 'public' and c.relrowsecurity = false
),

-- 3. The usage-metering RPC. v2 calls it with exactly five arguments.
rpc as (
  select 3, 'RPC reserve_usage_counter',
         p.proname || '(' || pg_get_function_arguments(p.oid) || ')'
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'reserve_usage_counter'
),
rpc_missing as (
  select 3, '*** MISSING RPC', 'reserve_usage_counter'
  where not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'reserve_usage_counter'
  )
),

-- 4. CHECK constraints on the metering + activity tables. v2 sends three
--    activity keys the old app never sent: science_check, homework_created,
--    homework_item_completed. If a constraint enumerates allowed values and
--    those three are absent, every write of them fails.
checks as (
  select 4, 'CHECK on ' || conrelid::regclass::text,
         conname || '  ' || pg_get_constraintdef(oid)
  from pg_constraint
  where contype = 'c'
    and conrelid::regclass::text in (
      'user_activity_events','usage_counters','homework_lists','homework_items'
    )
),

-- 5. Columns of the tables v2 writes to. Compare against src/lib/types.ts.
cols as (
  select 5, 'COLUMN ' || table_name,
         column_name || ' :: ' || data_type ||
         case when is_nullable = 'NO' then ' NOT NULL' else '' end ||
         coalesce(' default ' || column_default, '')
  from information_schema.columns
  where table_schema = 'public'
    and table_name in (
      'user_activity_events','usage_counters','homework_lists','homework_items',
      'ai_twin_profiles','mirror_insights','session_summaries',
      'user_support_preferences','subscriptions'
    )
)

select finding, detail from (
  select * from missing_tables
  union all select * from rls_off
  union all select * from rpc
  union all select * from rpc_missing
  union all select * from checks
  union all select * from cols
) report(sort, finding, detail)
order by sort, finding, detail;
