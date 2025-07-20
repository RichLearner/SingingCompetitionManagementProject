-- Migration script to update judges table schema
-- Run this if your judges table is missing the new fields

-- Add missing columns to judges table
ALTER TABLE judges 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_judges_email ON judges(email);

-- Add index for competition lookups
CREATE INDEX IF NOT EXISTS idx_judges_competition ON judges(competition_id);

-- Update existing records to have updated_at timestamp
UPDATE judges 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add constraint to ensure clerk_user_id is unique per competition (if not already exists)
-- Note: This might fail if you have duplicate clerk_user_ids, so check first
-- ALTER TABLE judges ADD CONSTRAINT unique_competition_clerk_user UNIQUE(competition_id, clerk_user_id);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'judges' 
ORDER BY ordinal_position; 