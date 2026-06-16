-- Add login email support for workers invited by token.
alter table workers
  add column if not exists email text;

create unique index if not exists workers_email_unique_idx
  on workers(lower(email))
  where email is not null;
