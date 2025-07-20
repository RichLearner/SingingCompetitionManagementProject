-- Check and create missing tables for 803 Event
-- Run this in your Supabase SQL Editor

-- Check if participants table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'participants') THEN
        -- Create participants table
        CREATE TABLE participants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            photo_url TEXT,
            group_id UUID,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Add foreign key constraint if groups table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups') THEN
            ALTER TABLE participants 
            ADD CONSTRAINT fk_participants_group 
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'Created participants table';
    ELSE
        RAISE NOTICE 'Participants table already exists';
    END IF;
END $$;

-- Check if groups table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups') THEN
        -- Create groups table
        CREATE TABLE groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            competition_id UUID,
            name VARCHAR(255) NOT NULL,
            photo_url TEXT,
            leader_id UUID,
            is_eliminated BOOLEAN DEFAULT FALSE,
            elimination_round INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Add foreign key constraint if competitions table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'competitions') THEN
            ALTER TABLE groups 
            ADD CONSTRAINT fk_groups_competition 
            FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'Created groups table';
    ELSE
        RAISE NOTICE 'Groups table already exists';
    END IF;
END $$;

-- Check if competitions table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'competitions') THEN
        -- Create competitions table
        CREATE TABLE competitions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            name_en VARCHAR(255),
            description TEXT,
            status VARCHAR(50) DEFAULT 'draft',
            current_round INTEGER DEFAULT 1,
            total_rounds INTEGER DEFAULT 2,
            voting_enabled BOOLEAN DEFAULT FALSE,
            display_mode VARCHAR(50) DEFAULT 'individual_scores',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created competitions table';
    ELSE
        RAISE NOTICE 'Competitions table already exists';
    END IF;
END $$;

-- Now add the leader_id foreign key constraint if both tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'participants') THEN
        
        -- Check if the constraint already exists
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_groups_leader'
        ) THEN
            ALTER TABLE groups 
            ADD CONSTRAINT fk_groups_leader 
            FOREIGN KEY (leader_id) REFERENCES participants(id);
            
            RAISE NOTICE 'Added leader_id foreign key constraint';
        ELSE
            RAISE NOTICE 'Leader foreign key constraint already exists';
        END IF;
    END IF;
END $$;

-- Enable RLS on all tables
DO $$
BEGIN
    -- Enable RLS on competitions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'competitions') THEN
        ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on groups
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups') THEN
        ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on participants
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'participants') THEN
        ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    RAISE NOTICE 'Enabled RLS on tables';
END $$;

-- Show table status
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('competitions', 'groups', 'participants') THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('competitions', 'groups', 'participants')
ORDER BY table_name; 