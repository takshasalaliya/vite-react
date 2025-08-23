-- Test script to check combos in database
-- Run this in your Supabase SQL Editor

-- 1. Check if combos table exists and has data
SELECT 'Combos table check' as test, COUNT(*) as count FROM combos;

-- 2. Check combos with their status
SELECT 
  id,
  name,
  is_active,
  created_at,
  updated_at
FROM combos 
ORDER BY created_at DESC;

-- 3. Check if there are any active combos
SELECT 'Active combos' as test, COUNT(*) as count 
FROM combos 
WHERE is_active = true;

-- 4. Check if there are any inactive combos
SELECT 'Inactive combos' as test, COUNT(*) as count 
FROM combos 
WHERE is_active = false;

-- 5. Check combo_items table
SELECT 'Combo items table check' as test, COUNT(*) as count FROM combo_items;

-- 6. Check combo_items with details
SELECT 
  ci.id,
  ci.combo_id,
  c.name as combo_name,
  ci.target_type,
  ci.target_id,
  ci.position
FROM combo_items ci
LEFT JOIN combos c ON ci.combo_id = c.id
ORDER BY ci.combo_id, ci.position;

-- 7. Check all tables for data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Events' as table_name, COUNT(*) as count FROM events
UNION ALL
SELECT 'Workshops' as table_name, COUNT(*) as count FROM workshops
UNION ALL
SELECT 'Combos' as table_name, COUNT(*) as count FROM combos
UNION ALL
SELECT 'Combo Items' as table_name, COUNT(*) as count FROM combo_items
UNION ALL
SELECT 'Colleges' as table_name, COUNT(*) as count FROM colleges
UNION ALL
SELECT 'Fields' as table_name, COUNT(*) as count FROM fields;
