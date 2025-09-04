-- Check Events and Workshops in Database
-- Run this to see what events and workshops are currently in your database

-- Check events table
SELECT 
    'event' as type,
    id,
    name as title,
    category,
    is_active,
    created_at,
    max_participants as capacity
FROM events 
WHERE is_active = true
ORDER BY category, created_at DESC;

-- Check workshops table
SELECT 
    'workshop' as type,
    id,
    title,
    'workshop' as category,
    is_active,
    created_at,
    capacity,
    fee,
    start_time,
    end_time,
    speakers
FROM workshops 
WHERE is_active = true
ORDER BY created_at DESC;

-- Count events by category
SELECT 
    category,
    COUNT(*) as event_count
FROM events 
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Count workshops
SELECT 
    'workshop' as category,
    COUNT(*) as event_count
FROM workshops 
WHERE is_active = true;
