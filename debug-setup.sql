-- Debug Setup Script
-- Run this to check what's wrong with your setup

-- 1. Check if tables exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'colleges', 'fields', 'events');

-- 2. Check if users table has data
SELECT 
  'users table' as table_name,
  COUNT(*) as record_count
FROM users;

-- 3. Check if admin user exists
SELECT 
  id,
  name,
  email,
  role,
  CASE WHEN role = 'admin' THEN 'ADMIN FOUND' ELSE 'NOT ADMIN' END as admin_status
FROM users 
WHERE email = 'admin@college.edu';

-- 4. Check all users
SELECT 
  id,
  name,
  email,
  role
FROM users 
ORDER BY role;

-- 5. Check if colleges exist
SELECT 
  'colleges table' as table_name,
  COUNT(*) as record_count
FROM colleges;

-- 6. Check if fields exist
SELECT 
  'fields table' as table_name,
  COUNT(*) as record_count
FROM fields; 