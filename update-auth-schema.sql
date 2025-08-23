-- Update database schema for direct authentication
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

-- 2. Update users table to make phone required for authentication
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- 3. Create admin user with phone number as password
INSERT INTO users (id, name, email, phone, role, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@college.edu',
  'admin123', -- This will be used as password
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  phone = 'admin123',
  role = 'admin',
  updated_at = NOW();

-- 4. Create some test users
INSERT INTO users (id, name, email, phone, role, created_at, updated_at) 
VALUES 
  (gen_random_uuid(), 'Event Manager', 'manager@college.edu', 'manager123', 'event_manager', NOW(), NOW()),
  (gen_random_uuid(), 'Event Handler', 'handler@college.edu', 'handler123', 'event_handler', NOW(), NOW()),
  (gen_random_uuid(), 'Registration Committee', 'committee@college.edu', 'committee123', 'registration_committee', NOW(), NOW()),
  (gen_random_uuid(), 'Test Participant', 'participant@college.edu', 'participant123', 'participant', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 5. Verify users were created
SELECT id, name, email, phone, role, created_at FROM users ORDER BY role, name;

-- 6. Test authentication query
SELECT id, name, email, role FROM users 
WHERE email = 'admin@college.edu' AND phone = 'admin123';
