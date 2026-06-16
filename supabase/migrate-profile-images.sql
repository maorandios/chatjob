-- Manager profile images — run in Supabase SQL Editor on existing databases
-- (included in migrate-latest.sql and schema.sql for fresh installs)

alter table managers
  add column if not exists profile_image_url text;

insert into storage.buckets (id, name, public)
values ('manager-profiles', 'manager-profiles', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "manager_profiles_public_read" on storage.objects;
create policy "manager_profiles_public_read"
  on storage.objects
  for select
  using (bucket_id = 'manager-profiles');
