alter table managers
  add column if not exists onboarding_complete boolean not null default true;
