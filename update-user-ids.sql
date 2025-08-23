-- Update user IDs to match Supabase Auth user IDs
-- Run this AFTER creating the users in Supabase Auth

-- First, get the Auth user IDs from Supabase Auth dashboard
-- Then replace the UUIDs below with the actual Auth user IDs

-- Update admin user
UPDATE users 
SET id = 'REPLACE_WITH_ADMIN_AUTH_UUID' 
WHERE email = 'admin@college.edu';

-- Update manager user
UPDATE users 
SET id = 'REPLACE_WITH_MANAGER_AUTH_UUID' 
WHERE email = 'manager@college.edu';

-- Update handler user
UPDATE users 
SET id = 'REPLACE_WITH_HANDLER_AUTH_UUID' 
WHERE email = 'handler@college.edu';

-- Update committee user
UPDATE users 
SET id = 'REPLACE_WITH_COMMITTEE_AUTH_UUID' 
WHERE email = 'committee@college.edu';

-- Update student user
UPDATE users 
SET id = 'REPLACE_WITH_STUDENT_AUTH_UUID' 
WHERE email = 'john.doe@student.edu';

-- Verify the updates
SELECT id, name, email, role FROM users ORDER BY role; 