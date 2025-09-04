-- Create table to store combo "non top-up" event exclusions
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS combo_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE (combo_id, target_id)
);

-- Helpful view query
-- SELECT c.name as combo_name, e.name as excluded_event
-- FROM combo_exclusions ce
-- JOIN combos c ON ce.combo_id = c.id
-- JOIN events e ON ce.target_id = e.id
-- ORDER BY c.name, e.name;

