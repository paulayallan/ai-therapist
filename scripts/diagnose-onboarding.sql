-- Why "Could not save your profile" — read-only diagnosis.
-- Paste into the Supabase SQL editor for `ai-therapist` and run.
--
-- v2 upserts with onConflict:"user_id". Postgres REFUSES an upsert unless a
-- UNIQUE constraint exists on exactly those columns, so the first section is
-- the prime suspect. The second section catches the other likely cause: a
-- column v2 writes that this table does not have.

-- 1. Unique indexes on every table v2 upserts into. Each of these needs one
--    on (user_id) — saved_tools needs (user_id, tool_id).
select
  'UNIQUE INDEX' as section,
  t.relname      as table_name,
  pg_get_indexdef(i.oid) as detail
from pg_index x
join pg_class i on i.oid = x.indexrelid
join pg_class t on t.oid = x.indrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and x.indisunique
  and t.relname in (
    'mental_profiles','user_support_preferences','account_memory',
    'saved_tools','ai_twin_profiles'
  )

union all

-- 2. Columns of the two tables the failing call writes to. Compare against
--    what the route sends.
select
  'COLUMN',
  table_name,
  column_name || ' :: ' || data_type ||
    case when is_nullable = 'NO' then ' NOT NULL' else '' end ||
    coalesce(' default ' || column_default, '')
from information_schema.columns
where table_schema = 'public'
  and table_name in ('mental_profiles','account_memory')

order by section, table_name, detail;
