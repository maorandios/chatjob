-- Optional: set login email on an existing manager (e.g. after admin added them in the app).
-- New admins normally sign up via /manager/login with their email.

update managers
set email = 'your-email@example.com'
where id = 'manager-uuid-here';

-- Verify:
select id, name, phone, email, is_admin from managers;
