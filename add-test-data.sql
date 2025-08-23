-- Add test data for events, workshops, and combos
-- Run this in your Supabase SQL Editor

-- 1. Add some test colleges
INSERT INTO colleges (name, city, state) VALUES 
('Engineering College', 'Tech City', 'State A'),
('Arts College', 'Creative City', 'State B'),
('Science College', 'Research City', 'State C')
ON CONFLICT (name) DO NOTHING;

-- 2. Add some test fields
INSERT INTO fields (name, description) VALUES 
('Computer Science', 'Computer Science and Engineering'),
('Mechanical Engineering', 'Mechanical Engineering'),
('Electrical Engineering', 'Electrical Engineering'),
('Civil Engineering', 'Civil Engineering'),
('Arts', 'Fine Arts and Design')
ON CONFLICT (name) DO NOTHING;

-- 3. Add some test events
INSERT INTO events (name, description, price, category, max_participants, is_active) VALUES 
('Tech Hackathon 2024', '24-hour coding competition for students', 50.00, 'tech', 100, true),
('Art Exhibition', 'Annual student art showcase', 25.00, 'non-tech', 200, true),
('Science Fair', 'Innovation and research showcase', 30.00, 'tech', 150, true),
('Sports Tournament', 'Inter-college sports competition', 20.00, 'non-tech', 300, true),
('Cultural Festival', 'Music, dance, and drama performances', 40.00, 'non-tech', 500, true)
ON CONFLICT DO NOTHING;

-- 4. Add some test workshops
INSERT INTO workshops (title, description, fee, capacity, start_time, end_time, is_active) VALUES 
('Web Development Bootcamp', 'Learn modern web development in 2 days', 100.00, 50, '2024-02-15 09:00:00', '2024-02-16 17:00:00', true),
('AI and Machine Learning', 'Introduction to AI and ML concepts', 150.00, 40, '2024-02-20 10:00:00', '2024-02-21 16:00:00', true),
('Digital Art Workshop', 'Learn digital painting and design', 80.00, 30, '2024-02-25 14:00:00', '2024-02-26 18:00:00', true),
('Public Speaking Skills', 'Improve your presentation skills', 60.00, 60, '2024-03-01 09:00:00', '2024-03-02 15:00:00', true)
ON CONFLICT DO NOTHING;

-- 5. Add some test combos
INSERT INTO combos (name, description, price, capacity, is_active) VALUES 
('Tech Package', 'Hackathon + Web Development Workshop', 120.00, 40, true),
('Arts Package', 'Art Exhibition + Digital Art Workshop', 90.00, 25, true),
('Complete Experience', 'All events and workshops', 300.00, 20, true)
ON CONFLICT DO NOTHING;

-- 6. Add combo items (link combos to events/workshops)
INSERT INTO combo_items (combo_id, target_type, target_id, position) 
SELECT 
  c.id as combo_id,
  'event' as target_type,
  e.id as target_id,
  1 as position
FROM combos c, events e 
WHERE c.name = 'Tech Package' AND e.name = 'Tech Hackathon 2024'
ON CONFLICT DO NOTHING;

INSERT INTO combo_items (combo_id, target_type, target_id, position) 
SELECT 
  c.id as combo_id,
  'workshop' as target_type,
  w.id as target_id,
  2 as position
FROM combos c, workshops w 
WHERE c.name = 'Tech Package' AND w.title = 'Web Development Bootcamp'
ON CONFLICT DO NOTHING;

INSERT INTO combo_items (combo_id, target_type, target_id, position) 
SELECT 
  c.id as combo_id,
  'event' as target_type,
  e.id as target_id,
  1 as position
FROM combos c, events e 
WHERE c.name = 'Arts Package' AND e.name = 'Art Exhibition'
ON CONFLICT DO NOTHING;

INSERT INTO combo_items (combo_id, target_type, target_id, position) 
SELECT 
  c.id as combo_id,
  'workshop' as target_type,
  w.id as target_id,
  2 as position
FROM combos c, workshops w 
WHERE c.name = 'Arts Package' AND w.title = 'Digital Art Workshop'
ON CONFLICT DO NOTHING;

-- 7. Verify the data was created
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
