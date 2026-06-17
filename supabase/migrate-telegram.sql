-- Telegram Mini App: link managers and workers to Telegram user ids

alter table managers
  add column if not exists telegram_user_id bigint;

alter table workers
  add column if not exists telegram_user_id bigint;

create unique index if not exists managers_telegram_user_id_unique_idx
  on managers(telegram_user_id)
  where telegram_user_id is not null;

create unique index if not exists workers_telegram_user_id_unique_idx
  on workers(telegram_user_id)
  where telegram_user_id is not null;
