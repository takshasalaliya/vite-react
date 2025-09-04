-- Add combo items to link combos with events and workshops
-- Run this in your Supabase SQL Editor

-- First, let's see what combos we have
SELECT 'Available Combos' as info, id, name, description FROM combos WHERE is_active = true;

-- Now let's add combo items for the "tech" combo
-- We'll link it to some existing events and workshops

-- Add Tech Hackathon event to the tech combo
INSERT INTO combo_items (combo_id, target_type, target_id, position) 
SELECT 
  c.id as combo_id,
  'event' as target_type,
  e.id as target_id,
  1 as position
FROM combos c, events e 
WHERE c.name = 'tech' AND e.name = 'Tech Hackathon 2024'
ON CONFLICT DO NOTHING;

-- Add Web Development Workshop to the tech combo
INSERT INTO combo_items (combo_id, target_type, target_id, position) 
SELECT 
  c.id as combo_id,
  'workshop' as target_type,
  w.id as target_id,
  2 as position
FROM combos c, workshops w 
WHERE c.name = 'tech' AND w.title = 'Web Development Bootcamp'
ON CONFLICT DO NOTHING;

-- Add AI Workshop to the tech combo if it exists
INSERT INTO combo_items (combo_id, target_type, target_id, position) 
SELECT 
  c.id as combo_id,
  'workshop' as target_type,
  w.id as target_id,
  3 as position
FROM combos c, workshops w 
WHERE c.name = 'tech' AND w.title = 'AI and Machine Learning'
ON CONFLICT DO NOTHING;

-- Verify the combo items were created
SELECT 
  'Combo Items Created' as info,
  ci.id,
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
WHERE c.name = 'tech'
ORDER BY ci.position;

-- Check total combo items count
SELECT 'Total Combo Items' as info, COUNT(*) as count FROM combo_items;
