-- 0. Enable extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tables ---------------------------------------------------------------

-- Colleges
CREATE TABLE IF NOT EXISTS colleges (
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

-- Fields (diploma IT, CP, EC, etc.)
CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (app-level profile)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone VARCHAR(20),
  photo_url TEXT,
  enrollment_number VARCHAR(100),
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  semester VARCHAR(20),
  field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','event_manager','event_handler','registration_committee','participant')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  category TEXT CHECK (category IN ('tech','non-tech')),
  handler_id UUID REFERENCES users(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_participants INTEGER DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshops
CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  fee NUMERIC(10,2) DEFAULT 0,
  capacity INTEGER DEFAULT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  speakers JSONB,            -- array of speaker objects or names
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Combos
CREATE TABLE IF NOT EXISTS combos (
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

-- Combo items (links combos to events or workshops)
CREATE TABLE IF NOT EXISTS combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('event','workshop')),
  target_id UUID NOT NULL,
  position INTEGER DEFAULT 0,
  UNIQUE (combo_id, target_type, target_id)
);

-- Registrations (polymorphic target_type: 'event','workshop','combo')
CREATE TABLE IF NOT EXISTS registrations (
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

-- Attendance logs
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('event','workshop')),
  target_id UUID NOT NULL,
  scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scan_time TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_target ON registrations(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_attendance_target ON attendance(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_events_handler ON events(handler_id);
CREATE INDEX IF NOT EXISTS idx_workshops_created_by ON workshops(created_by);
CREATE INDEX IF NOT EXISTS idx_combos_created_by ON combos(created_by);
CREATE INDEX IF NOT EXISTS idx_combo_items_target ON combo_items(target_type, target_id);

-- 2. Trigger: create child registrations when a combo registration is inserted
--    (After insert so parent_registration_id is available)

CREATE OR REPLACE FUNCTION fn_create_combo_child_regs() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  ci RECORD;
BEGIN
  IF (NEW.target_type = 'combo') THEN
    FOR ci IN
      SELECT * FROM combo_items WHERE combo_id = NEW.target_id ORDER BY position
    LOOP
      INSERT INTO registrations (
        id,
        user_id,
        target_type,
        target_id,
        transaction_id,
        amount_paid,
        payment_status,
        selected,
        parent_registration_id,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        NEW.user_id,
        ci.target_type,
        ci.target_id,
        NEW.transaction_id,
        0,                      -- child amount default 0 (adjust if you want splitting)
        NEW.payment_status,
        NEW.selected,
        NEW.id,
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_combo_children ON registrations;
CREATE TRIGGER trg_create_combo_children
AFTER INSERT ON registrations
FOR EACH ROW
EXECUTE PROCEDURE fn_create_combo_child_regs();

-- 3. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 4. Basic RLS Policies (these are examples - customize as needed)

-- Users table policies
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert/update/delete users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Colleges and Fields policies (admin only)
CREATE POLICY "Admins can manage colleges" ON colleges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage fields" ON fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Events policies
CREATE POLICY "Event managers can manage their events" ON events
  FOR ALL USING (
    manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Workshops policies
CREATE POLICY "Admins can manage workshops" ON workshops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Combos policies
CREATE POLICY "Admins can manage combos" ON combos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Combo items policies
CREATE POLICY "Admins can manage combo items" ON combo_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Registrations policies
CREATE POLICY "Users can read their own registrations" ON registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins and managers can read all registrations" ON registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'event_manager')
    )
  );

CREATE POLICY "Admins can manage all registrations" ON registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Attendance policies
CREATE POLICY "Admins can manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  ); 