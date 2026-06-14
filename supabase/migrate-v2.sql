-- Migration to v2 — admin is one of the managers (is_admin flag)
-- WARNING: Destroys existing data. Back up first if needed.

drop table if exists messages cascade;
drop table if exists workers cascade;
drop table if exists managers cascade;
drop table if exists admins cascade;
drop table if exists companies cascade;

-- Then run supabase/schema.sql
