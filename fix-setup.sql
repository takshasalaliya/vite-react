-- Complete Fix Script
-- Run this to fix all setup issues

-- Step 1: Drop existing tables (if they exist) to start fresh
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS combo_items CASCADE;
DROP TABLE IF EXISTS combos CASCADE;
DROP TABLE IF EXISTS workshops CASCADE;
DROP TABLE IF EXISTS events CASCADE;  
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS fields CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;

-- Step 2: Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 3: Create all tables
CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  phone VARCHAR(20),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone VARCHAR(20),
  photo_url TEXT,
  enrollment_number VARCHAR(100),
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  semester VARCHAR(20),
  field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','event_manager','event_handler','registration_committee','scanner_committee','participant')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  category TEXT CHECK (category IN ('tech','workshop','non-tech')),
  handler_id UUID REFERENCES users(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_participants INTEGER DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  fee NUMERIC(10,2) DEFAULT 0,
  capacity INTEGER DEFAULT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  speakers JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  capacity INTEGER DEFAULT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('event','workshop')),
  target_id UUID NOT NULL,
  position INTEGER DEFAULT 0,
  UNIQUE (combo_id, target_type, target_id)
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('event','workshop','combo')),
  target_id UUID NOT NULL,
  transaction_id TEXT,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('pending','approved','declined','not_required')) DEFAULT 'not_required',
  selected BOOLEAN DEFAULT TRUE,
  parent_registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('event','workshop')),
  target_id UUID NOT NULL,
  scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scan_time TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_target ON registrations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_attendance_target ON attendance(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_events_handler ON events(handler_id);
CREATE INDEX IF NOT EXISTS idx_workshops_created_by ON workshops(created_by);
CREATE INDEX IF NOT EXISTS idx_combos_created_by ON combos(created_by);
CREATE INDEX IF NOT EXISTS idx_combo_items_target ON combo_items(target_type, target_id);

