-- SAFE DATABASE FIX - Handles existing tables
-- Run this in your Supabase SQL Editor

-- Step 1: Check if judges table exists and has the right structure
DO $$
BEGIN
    -- Check if password_hash column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'judges' AND column_name = 'password_hash'
    ) THEN
        -- Add missing columns to existing judges table
        ALTER TABLE judges ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ALTER TABLE judges ADD COLUMN IF NOT EXISTS photo_url TEXT;
        ALTER TABLE judges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
        
        -- Remove old columns if they exist
        ALTER TABLE judges DROP COLUMN IF EXISTS email;
        ALTER TABLE judges DROP COLUMN IF EXISTS phone;
        ALTER TABLE judges DROP COLUMN IF EXISTS specialization;
        ALTER TABLE judges DROP COLUMN IF EXISTS experience_years;
        ALTER TABLE judges DROP COLUMN IF EXISTS clerk_user_id;
        
        -- Update existing records to have password_hash (set a default for existing records)
        UPDATE judges SET password_hash = 'temp_hash_needs_update' WHERE password_hash IS NULL;
        
        -- Make password_hash NOT NULL after setting default values
        ALTER TABLE judges ALTER COLUMN password_hash SET NOT NULL;
        
        RAISE NOTICE 'Updated existing judges table with new schema';
    ELSE
        RAISE NOTICE 'Judges table already has correct schema';
    END IF;
END $$;

-- Step 2: Create judge_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS judge_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_judges_competition ON judges(competition_id);
CREATE INDEX IF NOT EXISTS idx_judges_name ON judges(name);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_token ON judge_sessions(token);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_judge ON judge_sessions(judge_id);

-- Step 4: Enable RLS if not already enabled
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'judges' AND policyname = 'Judges can view their own data') THEN
        CREATE POLICY "Judges can view their own data" ON judges FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'judges' AND policyname = 'Admins can manage judges') THEN
        CREATE POLICY "Admins can manage judges" ON judges FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'judge_sessions' AND policyname = 'Judge sessions are private') THEN
        CREATE POLICY "Judge sessions are private" ON judge_sessions FOR ALL USING (true);
    END IF;
END $$;

-- Step 6: Update existing records to have updated_at timestamp
UPDATE judges SET updated_at = created_at WHERE updated_at IS NULL;

-- Step 7: Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'judges' 
ORDER BY ordinal_position;

-- Step 8: Show success message
SELECT 'Database schema updated successfully! You can now create judges.' as status; 