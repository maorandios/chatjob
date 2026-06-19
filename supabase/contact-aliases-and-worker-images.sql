alter table workers
  add column if not exists profile_image_url text;

create table if not exists contact_aliases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  owner_role text not null check (owner_role in ('manager', 'worker')),
  owner_id uuid not null,
  contact_role text not null check (contact_role in ('manager', 'worker', 'self')),
  contact_id uuid not null,
  display_name text,
  display_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_aliases_owner_contact_unique unique (
    owner_role,
    owner_id,
    contact_role,
    contact_id
  )
);

create index if not exists contact_aliases_owner_idx
  on contact_aliases (owner_role, owner_id);

insert into storage.buckets (id, name, public)
values ('worker-profiles', 'worker-profiles', true)
on conflict (id) do update set public = excluded.public;
