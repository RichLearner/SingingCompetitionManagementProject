-- 803 Event Database Schema
-- Execute this in your Supabase SQL Editor

-- Step 1: Create tables without foreign key constraints that cause circular references

-- Competitions table (Multi-competition support)
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed
  current_round INTEGER DEFAULT 1,
  total_rounds INTEGER DEFAULT 2,
  voting_enabled BOOLEAN DEFAULT FALSE,
  display_mode VARCHAR(50) DEFAULT 'individual_scores',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rounds table (Dynamic round configuration)
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description TEXT,
  elimination_count INTEGER, -- Number of groups to eliminate (0 = no elimination)
  is_public_voting BOOLEAN DEFAULT FALSE,
  public_votes_per_user INTEGER DEFAULT 5, -- Number of groups each user can vote for
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, completed
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(competition_id, round_number)
);

-- Groups table (CREATE WITHOUT leader_id constraint first)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  leader_id UUID, -- Will add constraint later
  is_eliminated BOOLEAN DEFAULT FALSE,
  elimination_round INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Participants table (Now groups table exists)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Add the foreign key constraint for leader_id now that participants table exists
ALTER TABLE groups 
ADD CONSTRAINT fk_groups_leader 
FOREIGN KEY (leader_id) REFERENCES participants(id);

-- Judges table
CREATE TABLE judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  clerk_user_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(competition_id, clerk_user_id)
);

-- Scoring factors table (Admin configurable)
CREATE TABLE scoring_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description TEXT,
  max_score INTEGER DEFAULT 10,
  weight DECIMAL(3,2) DEFAULT 1.00, -- Weight for factor calculation
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Judge scores table (Multi-round support)
CREATE TABLE judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  factor_id UUID REFERENCES scoring_factors(id) ON DELETE CASCADE,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(judge_id, group_id, factor_id, round_id)
);

-- Public votes table (Multi-round support with multi-select)
CREATE TABLE public_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(round_id, phone_number, group_id)
);

-- Public voting sessions table (Track voting sessions)
CREATE TABLE public_voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  votes_count INTEGER DEFAULT 0,
  max_votes INTEGER DEFAULT 5, -- Configurable max votes (default 5 out of 10)
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(round_id, phone_number)
);

-- Competition results table (Calculated results cache)
CREATE TABLE competition_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  judge_score DECIMAL(10,2),
  public_votes INTEGER DEFAULT 0,
  total_score DECIMAL(10,2),
  rank INTEGER,
  is_qualified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(round_id, group_id)
);

-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Competition admins table (Multi-admin support)
CREATE TABLE competition_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin', -- admin, moderator, viewer
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(competition_id, admin_id)
);

-- Step 3: Insert default scoring factors for 803 Event
INSERT INTO scoring_factors (competition_id, name, name_en, max_score, weight, order_index, is_active)
SELECT 
  c.id,
  '創意' as name,
  'Creativity' as name_en,
  10 as max_score,
  1.00 as weight,
  1 as order_index,
  true as is_active
FROM competitions c
WHERE c.name = '803 Event';

-- Add more default factors...
-- (You can add the rest once you create a competition)

-- Step 4: Enable Row Level Security (RLS) for security
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_admins ENABLE ROW LEVEL SECURITY;

-- Step 5: Basic RLS policies (You can customize these later)
-- Allow public read access to competitions, groups, and participants
CREATE POLICY "Public can view competitions" ON competitions FOR SELECT TO public USING (true);
CREATE POLICY "Public can view groups" ON groups FOR SELECT TO public USING (true);
CREATE POLICY "Public can view participants" ON participants FOR SELECT TO public USING (true);

-- Allow authenticated users to vote
CREATE POLICY "Users can vote" ON public_votes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can manage voting sessions" ON public_voting_sessions FOR ALL TO public USING (true);

-- Admin and judge policies will be added later with proper Clerk integration 