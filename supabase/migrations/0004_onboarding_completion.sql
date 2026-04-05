alter table mental_profiles
add column if not exists onboarding_completed boolean default false not null;
