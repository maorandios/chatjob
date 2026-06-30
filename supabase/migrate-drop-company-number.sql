-- Remove obsolete company registration number (ח.פ)
-- Run in Supabase SQL Editor on existing databases.

alter table companies
  drop column if exists company_number;
