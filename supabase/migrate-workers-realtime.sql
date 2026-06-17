-- Enable Supabase Realtime for worker status updates (pending → active).
do $$
begin
  alter publication supabase_realtime add table workers;
exception
  when duplicate_object then
    null;
  when undefined_object then
    null;
end;
$$;
