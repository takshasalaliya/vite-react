-- Allow 'food' in events.category check constraint
-- Run this in Supabase SQL editor

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE events
  ADD CONSTRAINT events_category_check
  CHECK (category IN ('tech','non-tech','workshop','food'));

-- Verify
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='events';
-- INSERT INTO events (name, description, price, category, is_active, created_at)
-- VALUES ('Food sample', 'test', 0, 'food', true, NOW());

