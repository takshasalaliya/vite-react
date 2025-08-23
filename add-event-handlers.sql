-- Add test event handlers to the database
-- Run this in your Supabase SQL Editor

-- First, let's add some event handlers with the 'event_handler' role
INSERT INTO users (name, email, phone, role, is_active) VALUES
('John Smith', 'john.smith@college.edu', '1234567890', 'event_handler', true),
('Sarah Johnson', 'sarah.johnson@college.edu', '2345678901', 'event_handler', true),
('Mike Davis', 'mike.davis@college.edu', '3456789012', 'event_handler', true),
('Emily Wilson', 'emily.wilson@college.edu', '4567890123', 'event_handler', true),
('David Brown', 'david.brown@college.edu', '5678901234', 'event_handler', true);

-- Update existing users to have event_handler role if needed
-- (This will only update users that don't already have a role)
UPDATE users 
SET role = 'event_handler' 
WHERE role IS NULL 
AND email LIKE '%@college.edu';

-- Check the results
SELECT 
  id,
  name,
  email,
  phone,
  role,
  is_active,
  created_at
FROM users 
WHERE role = 'event_handler'
ORDER BY created_at DESC;
