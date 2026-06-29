-- Location messages support.
-- Run in Supabase SQL Editor for existing databases.

alter table messages
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists location_label text;

alter table messages
  drop constraint if exists messages_input_type_check;

alter table messages
  add constraint messages_input_type_check
  check (input_type in ('text', 'voice', 'image', 'location'));

