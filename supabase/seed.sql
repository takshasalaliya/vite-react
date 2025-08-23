-- Seed data for the event management system
-- Run this after the migration file

-- 1. Insert sample colleges
INSERT INTO colleges (id, name, address, city, state, country, phone, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Tech University', '123 Tech Street', 'Tech City', 'Tech State', 'Tech Country', '+1-555-0123', 'info@techuniversity.edu'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Engineering College', '456 Engineering Ave', 'Engineer City', 'Engineer State', 'Engineer Country', '+1-555-0456', 'info@engineeringcollege.edu'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Science Institute', '789 Science Blvd', 'Science City', 'Science State', 'Science Country', '+1-555-0789', 'info@scienceinstitute.edu');

-- 2. Insert sample fields
INSERT INTO fields (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Computer Science', 'Computer Science and Information Technology'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Electrical Engineering', 'Electrical and Electronics Engineering'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Mechanical Engineering', 'Mechanical Engineering and Design'),
  ('550e8400-e29b-41d4-a716-446655440013', 'Business Administration', 'Business Management and Administration'),
  ('550e8400-e29b-41d4-a716-446655440014', 'Data Science', 'Data Science and Analytics');

-- 3. Insert sample users (you'll need to create these in Supabase Auth first)
-- Note: Replace the UUIDs with actual user IDs from your Supabase Auth
-- The admin user should be created in Supabase Auth with email: admin@college.edu

-- Sample admin user (replace with actual auth user ID)
-- Password: admin123 (phone: +1-555-0001)
INSERT INTO users (id, name, email, phone, enrollment_number, college_id, semester, field_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'Admin User', 'admin@college.edu', 'admin123', 'ADMIN001', '550e8400-e29b-41d4-a716-446655440001', 'N/A', NULL, 'admin');

-- Sample event manager
-- Password: manager123 (phone: +1-555-0002)
INSERT INTO users (id, name, email, phone, enrollment_number, college_id, semester, field_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 'Event Manager', 'manager@college.edu', 'manager123', 'MGR001', '550e8400-e29b-41d4-a716-446655440001', 'N/A', NULL, 'event_manager');

-- Sample event handler
-- Password: handler123 (phone: +1-555-0003)
INSERT INTO users (id, name, email, phone, enrollment_number, college_id, semester, field_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440102', 'Event Handler', 'handler@college.edu', 'handler123', 'HDL001', '550e8400-e29b-41d4-a716-446655440001', 'N/A', NULL, 'event_handler');

-- Sample registration committee member
-- Password: committee123 (phone: +1-555-0004)
INSERT INTO users (id, name, email, phone, enrollment_number, college_id, semester, field_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440103', 'Registration Committee', 'committee@college.edu', 'committee123', 'COM001', '550e8400-e29b-41d4-a716-446655440001', 'N/A', NULL, 'registration_committee');

-- Sample participant
-- Password: student123 (phone: +1-555-0005)
INSERT INTO users (id, name, email, phone, enrollment_number, college_id, semester, field_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440104', 'John Doe', 'john.doe@student.edu', 'student123', 'STU001', '550e8400-e29b-41d4-a716-446655440001', '6th', '550e8400-e29b-41d4-a716-446655440010', 'participant');

-- 4. Insert sample events
INSERT INTO events (id, name, description, photo_url, price, category, handler_id, manager_id, max_participants, is_active, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440200', 'Hackathon 2024', 'Annual coding competition for students', 'https://example.com/hackathon.jpg', 25.00, 'tech', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440101', 100, true, '550e8400-e29b-41d4-a716-446655440100'),
  ('550e8400-e29b-41d4-a716-446655440201', 'Cultural Festival', 'Annual cultural celebration and performances', 'https://example.com/cultural.jpg', 0.00, 'non-tech', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440101', 200, true, '550e8400-e29b-41d4-a716-446655440100'),
  ('550e8400-e29b-41d4-a716-446655440202', 'Tech Conference', 'Technology conference with industry experts', 'https://example.com/techconf.jpg', 50.00, 'tech', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440101', 150, true, '550e8400-e29b-41d4-a716-446655440100');

-- 5. Insert sample workshops
INSERT INTO workshops (id, title, description, photo_url, fee, capacity, start_time, end_time, speakers, is_active, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440300', 'React Workshop', 'Learn React fundamentals and build a real app', 'https://example.com/react.jpg', 15.00, 30, '2024-02-15 10:00:00+00', '2024-02-15 16:00:00+00', '["Dr. React Expert", "Prof. Frontend"]', true, '550e8400-e29b-41d4-a716-446655440100'),
  ('550e8400-e29b-41d4-a716-446655440301', 'Machine Learning Basics', 'Introduction to ML concepts and algorithms', 'https://example.com/ml.jpg', 20.00, 25, '2024-02-20 09:00:00+00', '2024-02-20 17:00:00+00', '["Dr. ML Scientist", "Prof. AI"]', true, '550e8400-e29b-41d4-a716-446655440100'),
  ('550e8400-e29b-41d4-a716-446655440302', 'Public Speaking', 'Improve your presentation and speaking skills', 'https://example.com/speaking.jpg', 10.00, 40, '2024-02-25 14:00:00+00', '2024-02-25 18:00:00+00', '["Communication Expert", "Toastmaster Pro"]', true, '550e8400-e29b-41d4-a716-446655440100');

-- 6. Insert sample combos
INSERT INTO combos (id, name, description, photo_url, price, capacity, is_active, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440400', 'Tech Pack', 'Complete tech experience with hackathon and workshops', 'https://example.com/techpack.jpg', 75.00, 50, true, '550e8400-e29b-41d4-a716-446655440100'),
  ('550e8400-e29b-41d4-a716-446655440401', 'Learning Bundle', 'Workshop bundle for skill development', 'https://example.com/learning.jpg', 40.00, 60, true, '550e8400-e29b-41d4-a716-446655440100');

-- 7. Insert combo items
INSERT INTO combo_items (id, combo_id, target_type, target_id, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440500', '550e8400-e29b-41d4-a716-446655440400', 'event', '550e8400-e29b-41d4-a716-446655440200', 1),
  ('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440400', 'workshop', '550e8400-e29b-41d4-a716-446655440300', 2),
  ('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440400', 'workshop', '550e8400-e29b-41d4-a716-446655440301', 3),
  ('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440401', 'workshop', '550e8400-e29b-41d4-a716-446655440300', 1),
  ('550e8400-e29b-41d4-a716-446655440504', '550e8400-e29b-41d4-a716-446655440401', 'workshop', '550e8400-e29b-41d4-a716-446655440302', 2);

-- 8. Insert sample registrations
INSERT INTO registrations (id, user_id, target_type, target_id, transaction_id, amount_paid, payment_status, selected) VALUES
  ('550e8400-e29b-41d4-a716-446655440600', '550e8400-e29b-41d4-a716-446655440104', 'event', '550e8400-e29b-41d4-a716-446655440200', 'TXN001', 25.00, 'approved', true),
  ('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440104', 'workshop', '550e8400-e29b-41d4-a716-446655440300', 'TXN002', 15.00, 'approved', true),
  ('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440104', 'combo', '550e8400-e29b-41d4-a716-446655440400', 'TXN003', 75.00, 'approved', true);

-- 9. Insert sample attendance records
INSERT INTO attendance (id, user_id, target_type, target_id, scanned_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440700', '550e8400-e29b-41d4-a716-446655440104', 'event', '550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440102'),
  ('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440104', 'workshop', '550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440102');

-- Note: After running this seed file, you'll need to:
-- 1. Create the admin user in Supabase Auth with email: admin@college.edu
-- 2. Update the users table to link the auth user ID with the admin record
-- 3. Create the required storage buckets in Supabase Storage
-- 4. Set up appropriate RLS policies for your use case 