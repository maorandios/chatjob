-- =============================================================================
-- Slang — consolidated migration (run once in Supabase SQL Editor)
-- =============================================================================
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS / CREATE OR REPLACE.
--
-- Applies everything added after the original schema:
--   • companies.company_number (ח.פ, optional)
--   • workers.employee_number, workers.address (optional profile fields)
--   • managers.is_admin + one-admin-per-company index (v2 model)
--   • Remove manager/worker count limits (unlimited until billing tiers)
--   • Atomic bootstrap function with advisory lock
--   • companies UPDATE policy (admin edits company details via API)
--
-- Fresh database? Run supabase/schema.sql instead (full bootstrap).
-- Existing database? Run this file only.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- companies: optional registration number (ח.פ)
-- ---------------------------------------------------------------------------

alter table companies
  add column if not exists company_number text;

-- ---------------------------------------------------------------------------
-- workers: optional profile fields (manager-editable)
-- ---------------------------------------------------------------------------

alter table workers
  add column if not exists employee_number text,
  add column if not exists address text;

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
-- Message company guard (idempotent replace)
-- ---------------------------------------------------------------------------

create or replace function slang_enforce_message_company()
returns trigger
language plpgsql
as $$
declare
  manager_company uuid;
  worker_company uuid;
begin
  select company_id into manager_company from managers where id = NEW.manager_id;
  select company_id into worker_company from workers where id = NEW.worker_id;

  if manager_company is null or worker_company is null then
    raise exception 'SLANG_INVALID_PARTICIPANTS';
  end if;

  if manager_company <> worker_company then
    raise exception 'SLANG_CROSS_COMPANY_MESSAGE';
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

drop policy if exists "slang_update_companies" on companies;
create policy "slang_update_companies"
  on companies
  for update
  using (true);

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
