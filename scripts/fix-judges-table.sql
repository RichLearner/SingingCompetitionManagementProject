-- Simple script to add missing columns to judges table
-- Run this in your Supabase SQL Editor

-- Add missing columns (IF NOT EXISTS prevents errors if columns already exist)
ALTER TABLE judges ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE judges ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE judges ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE judges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_judges_email ON judges(email);
CREATE INDEX IF NOT EXISTS idx_judges_competition ON judges(competition_id);

-- Update existing records to have updated_at timestamp
UPDATE judges SET updated_at = created_at WHERE updated_at IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'judges' 
ORDER BY ordinal_position; 