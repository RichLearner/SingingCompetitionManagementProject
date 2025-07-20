-- IMMEDIATE DATABASE FIX
-- Run this in your Supabase SQL Editor to fix all issues

-- Step 1: Drop existing judges table if it has wrong schema
DROP TABLE IF EXISTS judges CASCADE;

-- Step 2: Create new simplified judges table
CREATE TABLE judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(competition_id, name)
);

-- Step 3: Create judge sessions table for authentication
CREATE TABLE judge_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Add indexes for better performance
CREATE INDEX idx_judges_competition ON judges(competition_id);
CREATE INDEX idx_judges_name ON judges(name);
CREATE INDEX idx_judge_sessions_token ON judge_sessions(token);
CREATE INDEX idx_judge_sessions_judge ON judge_sessions(judge_id);

-- Step 5: Enable RLS
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_sessions ENABLE ROW LEVEL SECURITY;

-- Step 6: Basic RLS policies
CREATE POLICY "Judges can view their own data" ON judges FOR SELECT USING (true);
CREATE POLICY "Admins can manage judges" ON judges FOR ALL USING (true);
CREATE POLICY "Judge sessions are private" ON judge_sessions FOR ALL USING (true);

-- Step 7: Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'judges' 
ORDER BY ordinal_position;

-- Step 8: Show success message
SELECT 'Database schema updated successfully! You can now create judges.' as status; 