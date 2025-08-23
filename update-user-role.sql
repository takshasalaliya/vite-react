-- Update user role to event_manager
-- Run this in your Supabase SQL Editor

-- Update the specific user to have event_manager role
UPDATE users 
SET role = 'event_manager' 
WHERE email = 'nirja@gmail.com';

-- Verify the update
SELECT 
  id,
  name,
  email,
  phone,
  role,
  is_active,
  created_at
FROM users 
WHERE email = 'nirja@gmail.com';

-- Check all users with their roles
SELECT 
  id,
  name,
  email,
  role,
  is_active
FROM users 
ORDER BY role, name;
