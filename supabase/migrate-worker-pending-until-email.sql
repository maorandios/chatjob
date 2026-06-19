-- Keep workers unavailable for chat until they verify email via invite OTP.
update workers
set status = 'pending'
where email is null
  and status = 'active';

update workers
set status = 'active'
where email is not null
  and status = 'pending';
