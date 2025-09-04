-- Fix attendance table constraints to prevent duplicate entries
-- This ensures that a user can only have one attendance record per target

-- First, let's check if there are any existing duplicate records
SELECT 
  user_id, 
  target_type, 
  target_id, 
  COUNT(*) as duplicate_count
FROM attendance 
GROUP BY user_id, target_type, target_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Remove duplicate records (keep the first one)
DELETE FROM attendance 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM attendance 
  GROUP BY user_id, target_type, target_id
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE attendance 
ADD CONSTRAINT attendance_unique_user_target 
UNIQUE (user_id, target_type, target_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_target 
ON attendance (user_id, target_type, target_id);

-- Verify the constraint was added
SELECT 
  constraint_name, 
  constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'attendance' 
AND constraint_type = 'UNIQUE';
