-- Slang app schema — run in Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: https://dwaibcythzftjofehezw.supabase.co

create extension if not exists "pgcrypto";

create table if not exists managers (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'מנהל',
  phone text not null default '',
  company_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references managers(id) on delete cascade,
  name text not null,
  phone text not null,
  language text,
  status text not null default 'pending' check (status in ('pending', 'active')),
  invite_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists workers_manager_id_idx on workers(manager_id);
create index if not exists workers_invite_token_idx on workers(invite_token);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  sender_role text not null check (sender_role in ('manager', 'worker')),
  original_text text not null default '',
  original_lang text not null default '',
  translated_text text,
  target_lang text,
  input_type text not null default 'text' check (input_type in ('text', 'voice', 'image')),
  image_url text,
  status text not null default 'sent' check (status in ('sending', 'sent', 'delivered', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists messages_worker_id_created_at_idx on messages(worker_id, created_at);

-- Realtime for cross-device message sync
alter publication supabase_realtime add table messages;

-- Permissive policies for prototype (API uses service role; anon used for realtime reads)
alter table managers enable row level security;
alter table workers enable row level security;
alter table messages enable row level security;

drop policy if exists "slang_read_managers" on managers;
drop policy if exists "slang_insert_managers" on managers;
drop policy if exists "slang_update_managers" on managers;
drop policy if exists "slang_read_workers" on workers;
drop policy if exists "slang_insert_workers" on workers;
drop policy if exists "slang_update_workers" on workers;
drop policy if exists "slang_read_messages" on messages;
drop policy if exists "slang_insert_messages" on messages;
drop policy if exists "slang_update_messages" on messages;

create policy "slang_read_managers" on managers for select using (true);
create policy "slang_insert_managers" on managers for insert with check (true);
create policy "slang_update_managers" on managers for update using (true);

create policy "slang_read_workers" on workers for select using (true);
create policy "slang_insert_workers" on workers for insert with check (true);
create policy "slang_update_workers" on workers for update using (true);

create policy "slang_read_messages" on messages for select using (true);
create policy "slang_insert_messages" on messages for insert with check (true);
create policy "slang_update_messages" on messages for update using (true);
