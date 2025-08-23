-- Test script to check events in database
-- Run this in your Supabase SQL Editor

-- 1. Check if events table exists and has data
SELECT 'Events table check' as test, COUNT(*) as count FROM events;

-- 2. Check events with their status
SELECT 
  id,
  name,
  is_active,
  created_at,
  updated_at
FROM events 
ORDER BY created_at DESC;

-- 3. Check if there are any active events
SELECT 'Active events' as test, COUNT(*) as count 
FROM events 
WHERE is_active = true;

-- 4. Check if there are any inactive events
SELECT 'Inactive events' as test, COUNT(*) as count 
FROM events 
WHERE is_active = false;

-- 5. Check all tables for data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Events' as table_name, COUNT(*) as count FROM events
UNION ALL
SELECT 'Workshops' as table_name, COUNT(*) as count FROM workshops
UNION ALL
SELECT 'Combos' as table_name, COUNT(*) as count FROM combos
UNION ALL
SELECT 'Colleges' as table_name, COUNT(*) as count FROM colleges
UNION ALL
SELECT 'Fields' as table_name, COUNT(*) as count FROM fields;
