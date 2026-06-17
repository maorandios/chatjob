-- Mark workers with verified email as active (fixes rows stuck on pending).
update workers
set status = 'active'
where email is not null
  and status = 'pending';
