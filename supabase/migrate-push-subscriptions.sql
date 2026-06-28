-- Push notification subscriptions for installed/mobile PWAs.
-- Run in Supabase SQL Editor for existing databases.

create extension if not exists "pgcrypto";

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_role text not null check (user_role in ('manager', 'worker')),
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on push_subscriptions(user_role, user_id);

