-- =============================================================================
-- Slang — consolidated migration (run once in Supabase SQL Editor)
-- =============================================================================
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS / CREATE OR REPLACE.
--
-- Applies everything added after the original schema:
--   • Drop obsolete companies.company_number (ח.פ)
--   • workers.employee_number, workers.address (optional profile fields)
--   • managers.is_admin + one-admin-per-company index (v2 model)
--   • Remove manager/worker count limits (unlimited until billing tiers)
--   • Atomic bootstrap function with advisory lock
--   • companies UPDATE policy (admin edits company details via API)
--   • Worker-company memberships for leased/shared workers
--   • Push notification subscriptions for installed/mobile PWAs
--   • Location messages
--
-- Fresh database? Run supabase/schema.sql instead (full bootstrap).
-- Existing database? Run this file only.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------

alter table companies
  drop column if exists company_number;

alter table companies
  add column if not exists email text;

create unique index if not exists companies_email_unique_idx
  on companies(lower(email))
  where email is not null;

-- ---------------------------------------------------------------------------
-- workers: optional profile fields (manager-editable)
-- ---------------------------------------------------------------------------

alter table workers
  add column if not exists employee_number text,
  add column if not exists address text,
  add column if not exists email text;

create unique index if not exists workers_email_unique_idx
  on workers(lower(email))
  where email is not null;

-- ---------------------------------------------------------------------------
-- managers: single admin per company (v2 — replaces separate admins table)
-- ---------------------------------------------------------------------------

alter table managers
  add column if not exists is_admin boolean not null default false;

alter table managers
  add column if not exists email text;

alter table managers
  add column if not exists onboarding_complete boolean not null default true;

create unique index if not exists managers_email_unique_idx
  on managers(lower(email))
  where email is not null;

-- Promote the earliest manager in each company if none is marked admin yet.
update managers m
set is_admin = true
where m.id in (
  select distinct on (company_id) id
  from managers
  order by company_id, created_at asc, id asc
)
and not exists (
  select 1
  from managers existing
  where existing.company_id = m.company_id
    and existing.is_admin = true
);

create unique index if not exists managers_one_admin_per_company_idx
  on managers(company_id)
  where is_admin = true;

-- Legacy table from pre-v2 installs (no-op if already removed).
drop table if exists admins cascade;

-- ---------------------------------------------------------------------------
-- Team size limits removed — billing tiers will enforce caps later.
-- ---------------------------------------------------------------------------

drop trigger if exists slang_manager_limit on managers;
drop trigger if exists slang_worker_limit on workers;
drop function if exists slang_enforce_manager_limit();
drop function if exists slang_enforce_worker_limit();

-- ---------------------------------------------------------------------------
-- Worker-company memberships (leased/shared workers)
-- ---------------------------------------------------------------------------

create table if not exists worker_company_memberships (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  invite_token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  relationship_type text not null default 'direct',
  display_name text,
  display_phone text,
  private_note text,
  created_by_manager_id uuid references managers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(worker_id, company_id)
);

alter table worker_company_memberships
  add column if not exists display_name text,
  add column if not exists display_phone text,
  add column if not exists private_note text;

create index if not exists worker_company_memberships_worker_id_idx
  on worker_company_memberships(worker_id);
create index if not exists worker_company_memberships_company_id_idx
  on worker_company_memberships(company_id);
create index if not exists worker_company_memberships_invite_token_idx
  on worker_company_memberships(invite_token);

insert into worker_company_memberships (
  worker_id,
  company_id,
  invite_token,
  status,
  relationship_type,
  created_at,
  updated_at
)
select
  id,
  company_id,
  invite_token,
  case when status = 'active' then 'active' else 'pending' end,
  'direct',
  created_at,
  now()
from workers
on conflict (worker_id, company_id) do nothing;

-- ---------------------------------------------------------------------------
-- Message company guard (idempotent replace)
-- ---------------------------------------------------------------------------

create or replace function slang_enforce_message_company()
returns trigger
language plpgsql
as $$
declare
  manager_company uuid;
  active_membership uuid;
begin
  select company_id into manager_company from managers where id = NEW.manager_id;

  if manager_company is null then
    raise exception 'SLANG_INVALID_PARTICIPANTS';
  end if;

  select id
  into active_membership
  from worker_company_memberships
  where worker_id = NEW.worker_id
    and company_id = manager_company
    and status = 'active'
  limit 1;

  if active_membership is null then
    raise exception 'SLANG_INACTIVE_WORKER_MEMBERSHIP';
  end if;

  NEW.company_id := manager_company;
  return NEW;
end;
$$;

drop trigger if exists slang_message_company on messages;
create trigger slang_message_company
before insert or update on messages
for each row execute function slang_enforce_message_company();

-- ---------------------------------------------------------------------------
-- Location messages
-- ---------------------------------------------------------------------------

alter table messages
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists location_label text;

alter table messages
  drop constraint if exists messages_input_type_check;

alter table messages
  add constraint messages_input_type_check
  check (input_type in ('text', 'voice', 'image', 'location'));

-- ---------------------------------------------------------------------------
-- Atomic bootstrap (prevents duplicate companies on concurrent requests)
-- ---------------------------------------------------------------------------

create or replace function slang_bootstrap_admin(
  p_company_name text,
  p_admin_name text,
  p_admin_phone text,
  p_invite_token text
)
returns uuid
language plpgsql
as $$
declare
  v_company_id uuid;
  v_manager_id uuid;
begin
  perform pg_advisory_xact_lock(84937201);

  select m.id
  into v_manager_id
  from companies c
  join managers m on m.company_id = c.id
  where m.is_admin = true
  order by c.created_at asc, m.created_at asc
  limit 1;

  if v_manager_id is not null then
    return v_manager_id;
  end if;

  select m.id
  into v_manager_id
  from companies c
  join managers m on m.company_id = c.id
  order by c.created_at asc, m.created_at asc
  limit 1;

  if v_manager_id is not null then
    return v_manager_id;
  end if;

  insert into companies (name)
  values (p_company_name)
  returning id into v_company_id;

  insert into managers (company_id, name, phone, invite_token, is_admin)
  values (v_company_id, p_admin_name, p_admin_phone, p_invite_token, true)
  returning id into v_manager_id;

  return v_manager_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: allow company updates (service role also bypasses RLS)
-- ---------------------------------------------------------------------------

alter table companies enable row level security;
alter table worker_company_memberships enable row level security;

drop policy if exists "slang_update_companies" on companies;
create policy "slang_update_companies"
  on companies
  for update
  using (true);

drop policy if exists "slang_read_worker_company_memberships" on worker_company_memberships;
drop policy if exists "slang_insert_worker_company_memberships" on worker_company_memberships;
drop policy if exists "slang_update_worker_company_memberships" on worker_company_memberships;
drop policy if exists "slang_delete_worker_company_memberships" on worker_company_memberships;

create policy "slang_read_worker_company_memberships" on worker_company_memberships for select using (true);
create policy "slang_insert_worker_company_memberships" on worker_company_memberships for insert with check (true);
create policy "slang_update_worker_company_memberships" on worker_company_memberships for update using (true);
create policy "slang_delete_worker_company_memberships" on worker_company_memberships for delete using (true);

-- ---------------------------------------------------------------------------
-- managers: profile image URL (file stored in Supabase Storage)
-- ---------------------------------------------------------------------------

alter table managers
  add column if not exists profile_image_url text;

insert into storage.buckets (id, name, public)
values ('manager-profiles', 'manager-profiles', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "manager_profiles_public_read" on storage.objects;
create policy "manager_profiles_public_read"
  on storage.objects
  for select
  using (bucket_id = 'manager-profiles');

-- ---------------------------------------------------------------------------
-- Push notification subscriptions
-- ---------------------------------------------------------------------------

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_role text not null check (user_role in ('manager', 'worker')),
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on push_subscriptions(user_role, user_id);

-- ---------------------------------------------------------------------------
-- Realtime (no-op if messages is already in publication)
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table messages;
exception
  when duplicate_object then
    null;
  when undefined_object then
    null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table workers;
exception
  when duplicate_object then
    null;
  when undefined_object then
    null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table worker_company_memberships;
exception
  when duplicate_object then
    null;
  when undefined_object then
    null;
end;
$$;
