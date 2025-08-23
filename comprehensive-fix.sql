-- Comprehensive fix for admin user and RLS issues
-- Run this in your Supabase SQL Editor

-- 1. First, let's completely disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE colleges DISABLE ROW LEVEL SECURITY;
ALTER TABLE fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE workshops DISABLE ROW LEVEL SECURITY;
ALTER TABLE combos DISABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- 2. Check if admin user exists
SELECT id, email, role FROM users WHERE email = 'admin@college.edu';

-- 3. Delete any existing admin user to avoid conflicts
DELETE FROM users WHERE email = 'admin@college.edu';

-- 4. Create the admin user with the correct Auth User ID
INSERT INTO users (id, name, email, role, created_at, updated_at) 
VALUES (
  '09585439-fd39-49b1-bb52-2720ec1b045a', -- Auth User ID from Supabase Auth
  'Admin User',
  'admin@college.edu',
  'admin',
  NOW(),
  NOW()
);

-- 5. Verify the user was created
SELECT id, name, email, role, created_at FROM users WHERE email = 'admin@college.edu';

-- 6. Test the connection by counting users
SELECT COUNT(*) as user_count FROM users;

-- 7. Test a simple query to make sure everything works
SELECT * FROM users WHERE email = 'admin@college.edu';

-- 8. Create some basic data for testing
INSERT INTO colleges (name, city, state) VALUES 
('Test College', 'Test City', 'Test State')
ON CONFLICT (name) DO NOTHING;

INSERT INTO fields (name, description) VALUES 
('Computer Science', 'Computer Science field')
ON CONFLICT (name) DO NOTHING;

-- 9. Verify basic data was created
SELECT COUNT(*) as college_count FROM colleges;
SELECT COUNT(*) as field_count FROM fields;
