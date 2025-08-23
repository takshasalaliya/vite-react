-- Setup script for College Event Management System
-- Run this in your Supabase SQL Editor

-- 1. First, create the admin user in Supabase Auth (do this manually in Auth dashboard)
-- Email: admin@college.edu
-- Password: admin123

-- 2. After creating the user in Auth, get the User ID and replace it below
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual UUID from Auth

-- 3. Insert admin user into database
INSERT INTO users (id, name, email, role) 
VALUES (
  'YOUR_AUTH_USER_ID_HERE', -- Replace with actual Auth user ID
  'Admin User',
  'admin@college.edu',
  'admin'
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 4. Verify the user was created
SELECT id, name, email, role, created_at 
FROM users 
WHERE email = 'admin@college.edu';

-- 5. Test the connection
SELECT COUNT(*) as user_count FROM users;
