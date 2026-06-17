-- Slang app schema — run in Supabase SQL Editor (fresh database)
-- Company → managers (one is_admin) + workers; team size unlimited until billing
-- Messages are 1:1 between one manager and one worker (same company)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  company_number text,
  created_at timestamptz not null default now()
);

create unique index if not exists companies_email_unique_idx
  on companies(lower(email))
  where email is not null;

create table if not exists managers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  invite_token text not null unique,
  is_admin boolean not null default false,
  onboarding_complete boolean not null default true,
  profile_image_url text,
  created_at timestamptz not null default now()
);

create index if not exists managers_company_id_idx on managers(company_id);
create index if not exists managers_invite_token_idx on managers(invite_token);
create unique index if not exists managers_email_unique_idx
  on managers(lower(email))
  where email is not null;
create unique index if not exists managers_one_admin_per_company_idx
  on managers(company_id)
  where is_admin = true;

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  employee_number text,
  address text,
  language text,
  status text not null default 'pending' check (status in ('pending', 'active')),
  invite_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists workers_company_id_idx on workers(company_id);
create index if not exists workers_invite_token_idx on workers(invite_token);
create unique index if not exists workers_email_unique_idx
  on workers(lower(email))
  where email is not null;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  manager_id uuid not null references managers(id) on delete cascade,
  worker_id uuid not null references workers(id) on delete cascade,
  sender_role text not null check (sender_role in ('manager', 'worker')),
  original_text text not null default '',
  original_lang text not null default '',
  translated_text text,
  target_lang text,
  input_type text not null default 'text' check (input_type in ('text', 'voice', 'image')),
  image_url text,
  status text not null default 'sent' check (status in ('sending', 'sent', 'delivered', 'failed')),
  created_at timestamptz not null default now(),
  constraint messages_same_company check (
    company_id is not null and manager_id is not null and worker_id is not null
  )
);

create index if not exists messages_conversation_idx
  on messages(company_id, manager_id, worker_id, created_at);
create index if not exists messages_worker_id_idx on messages(worker_id);
create index if not exists messages_manager_id_idx on messages(manager_id);

-- ---------------------------------------------------------------------------
-- Manager profile images (Supabase Storage)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('manager-profiles', 'manager-profiles', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "manager_profiles_public_read" on storage.objects;
create policy "manager_profiles_public_read"
  on storage.objects
  for select
  using (bucket_id = 'manager-profiles');

-- ---------------------------------------------------------------------------
-- Team size limits removed — will be enforced via billing tiers later.
-- ---------------------------------------------------------------------------

drop trigger if exists slang_manager_limit on managers;
drop trigger if exists slang_worker_limit on workers;
drop function if exists slang_enforce_manager_limit();
drop function if exists slang_enforce_worker_limit();

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
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table messages;

-- ---------------------------------------------------------------------------
-- RLS (prototype — API uses service role)
-- ---------------------------------------------------------------------------

alter table companies enable row level security;
alter table managers enable row level security;
alter table workers enable row level security;
alter table messages enable row level security;

drop policy if exists "slang_read_companies" on companies;
drop policy if exists "slang_insert_companies" on companies;
drop policy if exists "slang_read_managers" on managers;
drop policy if exists "slang_insert_managers" on managers;
drop policy if exists "slang_update_managers" on managers;
drop policy if exists "slang_delete_managers" on managers;
drop policy if exists "slang_read_workers" on workers;
drop policy if exists "slang_insert_workers" on workers;
drop policy if exists "slang_update_workers" on workers;
drop policy if exists "slang_delete_workers" on workers;
drop policy if exists "slang_read_messages" on messages;
drop policy if exists "slang_insert_messages" on messages;
drop policy if exists "slang_update_messages" on messages;

create policy "slang_read_companies" on companies for select using (true);
create policy "slang_insert_companies" on companies for insert with check (true);
create policy "slang_update_companies" on companies for update using (true);
create policy "slang_read_managers" on managers for select using (true);
create policy "slang_insert_managers" on managers for insert with check (true);
create policy "slang_update_managers" on managers for update using (true);
create policy "slang_delete_managers" on managers for delete using (true);
create policy "slang_read_workers" on workers for select using (true);
create policy "slang_insert_workers" on workers for insert with check (true);
create policy "slang_update_workers" on workers for update using (true);
create policy "slang_delete_workers" on workers for delete using (true);
create policy "slang_read_messages" on messages for select using (true);
create policy "slang_insert_messages" on messages for insert with check (true);
create policy "slang_update_messages" on messages for update using (true);
