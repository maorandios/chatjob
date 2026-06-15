-- Optional company registration number (ח.פ)
alter table companies
  add column if not exists company_number text;
