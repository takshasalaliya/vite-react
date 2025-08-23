-- Fix admin user creation with correct Auth User ID
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if the user exists in the database
SELECT id, email, role FROM users WHERE email = 'admin@college.edu';

-- 2. Temporarily disable RLS on users table to allow user creation
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Create the admin user with the correct Auth User ID
INSERT INTO users (id, name, email, role) 
VALUES (
  '09585439-fd39-49b1-bb52-2720ec1b045a', -- Auth User ID from Supabase Auth
  'Admin User',
  'admin@college.edu',
  'admin'
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 4. Verify the user was created
SELECT id, name, email, role, created_at FROM users WHERE email = 'admin@college.edu';

-- 5. Test the connection
SELECT COUNT(*) as user_count FROM users;

-- 6. Re-enable RLS (uncomment when ready for production)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
