-- Run once if you already applied schema.sql before the bootstrap lock was added.
-- Safe to re-run (CREATE OR REPLACE).

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
