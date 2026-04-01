alter table mirror_insights
add column if not exists saved boolean default false not null;
