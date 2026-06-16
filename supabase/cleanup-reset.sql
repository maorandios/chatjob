-- Optional: wipe all data and start fresh (run in Supabase SQL Editor)
-- Use when you have duplicate companies from earlier bootstrap bugs.
--
-- After this, run supabase/schema.sql (full tables + functions).
-- If you already have tables and only need new columns, run migrate-latest.sql instead.

drop table if exists messages cascade;
drop table if exists workers cascade;
drop table if exists managers cascade;
drop table if exists companies cascade;

-- Then run supabase/schema.sql
