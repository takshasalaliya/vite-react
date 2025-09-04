-- Test script to add a workshop registration
-- Run this in your Supabase SQL Editor to test workshop functionality

-- First, let's check if we have any users
SELECT id, name, email, role FROM users LIMIT 5;

-- Check if we have any workshops
SELECT id, title, description, fee FROM workshops LIMIT 5;

-- Check if we have any registrations
SELECT id, user_id, target_type, target_id, payment_status FROM registrations LIMIT 10;

-- Add a test workshop registration (replace USER_ID and WORKSHOP_ID with actual values)
-- INSERT INTO registrations (user_id, target_type, target_id, payment_status, amount_paid) 
-- VALUES ('USER_ID_HERE', 'workshop', 'WORKSHOP_ID_HERE', 'approved', 100.00);

-- Check workshop registrations specifically
SELECT 
  r.id,
  r.user_id,
  r.target_type,
  r.target_id,
  r.payment_status,
  r.amount_paid,
  w.title as workshop_title,
  w.fee as workshop_fee
FROM registrations r
LEFT JOIN workshops w ON r.target_id = w.id
WHERE r.target_type = 'workshop';
