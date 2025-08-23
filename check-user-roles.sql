-- Check current user roles
SELECT id, name, email, role FROM users WHERE role IN ('event_handler', 'event_manager') ORDER BY role, name;

-- Update Nirja to be event_manager (if not already)
UPDATE users SET role = 'event_manager' WHERE email = 'nirja@gmail.com';

-- Update himanshu to be event_handler (if not already)
UPDATE users SET role = 'event_handler' WHERE email = 'himanshu@gmail.com' OR name = 'himanshu';

-- Verify the changes
SELECT id, name, email, role FROM users WHERE role IN ('event_handler', 'event_manager') ORDER BY role, name;

-- Check what handlers will appear in dropdown (should only be event_handler role)
SELECT id, name, email, role FROM users WHERE role = 'event_handler' ORDER BY name;
