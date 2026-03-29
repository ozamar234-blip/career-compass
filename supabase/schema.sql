-- =============================================
-- CAREER COMPASS — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  city TEXT,
  current_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Professions (208)
CREATE TABLE professions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  avg_salary_range TEXT,
  education_required TEXT,
  riasec_codes TEXT[],
  description TEXT,
  demand_level TEXT CHECK (demand_level IN ('low', 'medium', 'high')),
  work_environment TEXT
);

-- 3. Questionnaire Sessions
CREATE TABLE questionnaire_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_question_index INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  ai_analysis JSONB,
  matched_professions INTEGER[],
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE questionnaire_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON questionnaire_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 4. Filtering Rounds
CREATE TABLE filtering_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES questionnaire_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  input_professions INTEGER[],
  selected_professions INTEGER[],
  rejected_professions INTEGER[],
  maybe_professions INTEGER[],
  unknown_professions INTEGER[],
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id, round_number)
);

ALTER TABLE filtering_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rounds" ON filtering_rounds
  FOR ALL USING (auth.uid() = user_id);

-- 5. Mirror Invitations
CREATE TABLE mirror_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES questionnaire_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_name TEXT NOT NULL,
  friend_phone TEXT,
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed')),
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE mirror_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invitations" ON mirror_invitations
  FOR ALL USING (auth.uid() = user_id);

-- 6. Mirror Responses
CREATE TABLE mirror_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES mirror_invitations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id) ON DELETE CASCADE,
  friend_name TEXT,
  answers JSONB NOT NULL,
  selected_professions INTEGER[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Synthesis Reports
CREATE TABLE synthesis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES questionnaire_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  top_3_professions JSONB NOT NULL,
  full_analysis JSONB,
  action_steps JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE synthesis_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reports" ON synthesis_reports
  FOR SELECT USING (auth.uid() = user_id);

-- 8. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium')),
  amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider TEXT,
  payment_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_sessions_user ON questionnaire_sessions(user_id);
CREATE INDEX idx_rounds_session ON filtering_rounds(session_id);
CREATE INDEX idx_invitations_token ON mirror_invitations(invite_token);
CREATE INDEX idx_invitations_session ON mirror_invitations(session_id);
CREATE INDEX idx_responses_invitation ON mirror_responses(invitation_id);
CREATE INDEX idx_reports_user ON synthesis_reports(user_id);
