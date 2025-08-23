-- Temporary disable RLS for testing registration form
-- Run this in Supabase SQL editor

-- Disable RLS on users table temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on registrations table temporarily  
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on colleges table temporarily
ALTER TABLE colleges DISABLE ROW LEVEL SECURITY;

-- Disable RLS on fields table temporarily
ALTER TABLE fields DISABLE ROW LEVEL SECURITY;

-- Disable RLS on events table temporarily
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Disable RLS on combos table temporarily
ALTER TABLE combos DISABLE ROW LEVEL SECURITY;

-- Disable RLS on combo_items table temporarily
ALTER TABLE combo_items DISABLE ROW LEVEL SECURITY;

-- Note: Remember to re-enable RLS after testing with:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
-- etc.
