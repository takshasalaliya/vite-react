-- Fix RLS policies for user creation
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if the user exists in the database
SELECT id, email, role FROM users WHERE email = 'admin@college.edu';

-- 2. If the user doesn't exist, we need to temporarily disable RLS to create them
-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Create a temporary policy to allow user creation during signup
-- This policy allows authenticated users to insert their own profile
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Also allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 5. Now let's manually create the admin user if it doesn't exist
-- First, get the auth user ID from Supabase Auth
-- Go to Authentication > Users in Supabase dashboard and copy the UUID for admin@college.edu

-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual UUID from Auth dashboard
INSERT INTO users (id, name, email, role) 
VALUES (
  'YOUR_AUTH_USER_ID_HERE', -- Replace with actual Auth user ID
  'Admin User',
  'admin@college.edu',
  'admin'
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 6. Verify the user was created
SELECT id, name, email, role, created_at FROM users WHERE email = 'admin@college.edu';

-- 7. Test the connection
SELECT COUNT(*) as user_count FROM users;
