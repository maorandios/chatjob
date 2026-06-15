-- Remove per-company manager/worker count limits (billing tiers later).
drop trigger if exists slang_manager_limit on managers;
drop trigger if exists slang_worker_limit on workers;
drop function if exists slang_enforce_manager_limit();
drop function if exists slang_enforce_worker_limit();
