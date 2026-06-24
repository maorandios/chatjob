-- Normalize worker access so one worker can belong to multiple companies.

create table if not exists worker_company_memberships (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  invite_token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  relationship_type text not null default 'direct',
  created_by_manager_id uuid references managers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(worker_id, company_id)
);

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

do $$
begin
  alter publication supabase_realtime add table worker_company_memberships;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

alter table worker_company_memberships enable row level security;

drop policy if exists "slang_read_worker_company_memberships" on worker_company_memberships;
drop policy if exists "slang_insert_worker_company_memberships" on worker_company_memberships;
drop policy if exists "slang_update_worker_company_memberships" on worker_company_memberships;
drop policy if exists "slang_delete_worker_company_memberships" on worker_company_memberships;

create policy "slang_read_worker_company_memberships" on worker_company_memberships for select using (true);
create policy "slang_insert_worker_company_memberships" on worker_company_memberships for insert with check (true);
create policy "slang_update_worker_company_memberships" on worker_company_memberships for update using (true);
create policy "slang_delete_worker_company_memberships" on worker_company_memberships for delete using (true);
