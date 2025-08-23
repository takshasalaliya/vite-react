-- Quick Setup Script for Testing
-- Run this after creating the admin user in Supabase Auth

-- 1. Create tables (if not already created)
-- Copy and paste the contents of supabase/migrations/001_initial_schema.sql first

-- 2. Insert basic seed data
INSERT INTO colleges (id, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Tech University');

INSERT INTO fields (id, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Computer Science');

-- 3. Insert admin user (replace UUID with actual Auth user ID)
INSERT INTO users (id, name, email, phone, enrollment_number, college_id, role) VALUES
  ('REPLACE_WITH_ADMIN_AUTH_UUID', 'Admin User', 'admin@college.edu', 'admin123', 'ADMIN001', '550e8400-e29b-41d4-a716-446655440001', 'admin');

-- 4. Insert sample event
INSERT INTO events (id, name, description, price, category, max_participants, is_active, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440200', 'Test Event', 'A test event for development', 25.00, 'tech', 100, true, 'REPLACE_WITH_ADMIN_AUTH_UUID');

-- 5. Verify setup
SELECT 'Setup complete!' as status;
SELECT id, name, email, role FROM users;
SELECT id, name, category FROM events; 