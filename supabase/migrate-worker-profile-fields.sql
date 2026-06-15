-- Add optional worker profile fields for manager editing
alter table workers
  add column if not exists employee_number text,
  add column if not exists address text;
