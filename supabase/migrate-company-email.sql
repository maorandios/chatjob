-- Company email — set automatically on admin signup (admin's login email)
-- Run in Supabase SQL Editor on existing databases.

alter table companies
  add column if not exists email text;

create unique index if not exists companies_email_unique_idx
  on companies(lower(email))
  where email is not null;

-- Backfill from admin manager email where missing.
update companies c
set email = m.email
from managers m
where m.company_id = c.id
  and m.is_admin = true
  and m.email is not null
  and c.email is null;
