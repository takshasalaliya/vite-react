-- Check combo items data and troubleshoot combo display issue
-- Run this in your Supabase SQL Editor

-- 1. Check if combo_items table exists and has data
SELECT 'Combo Items table check' as test, COUNT(*) as count FROM combo_items;

-- 2. Check all combo items with details
SELECT 
  ci.id,
  ci.combo_id,
  c.name as combo_name,
  ci.target_type,
  ci.target_id,
  ci.position,
  CASE 
    WHEN ci.target_type = 'event' THEN e.name
    WHEN ci.target_type = 'workshop' THEN w.title
    ELSE 'Unknown'
  END as target_name
FROM combo_items ci
LEFT JOIN combos c ON ci.combo_id = c.id
LEFT JOIN events e ON ci.target_type = 'event' AND ci.target_id = e.id
LEFT JOIN workshops w ON ci.target_type = 'workshop' AND ci.target_id = w.id
ORDER BY ci.combo_id, ci.position;

-- 3. Check specific combo that user has registered for
SELECT 
  'User Combo Check' as test,
  c.id as combo_id,
  c.name as combo_name,
  c.is_active,
  COUNT(ci.id) as items_count
FROM combos c
LEFT JOIN combo_items ci ON c.id = ci.combo_id
WHERE c.id = '94dd6f3f-da31-4721-8e9f-44cee551cca2'
GROUP BY c.id, c.name, c.is_active;

-- 4. Check if combo_items table has the right structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'combo_items'
ORDER BY ordinal_position;

-- 5. Check for any combo registrations
SELECT 
  'Combo Registrations' as test,
  COUNT(*) as count
FROM registrations 
WHERE target_type = 'combo';

-- 6. Check specific combo registration
SELECT 
  r.*,
  c.name as combo_name
FROM registrations r
LEFT JOIN combos c ON r.target_id = c.id
WHERE r.target_type = 'combo'
ORDER BY r.created_at DESC;
