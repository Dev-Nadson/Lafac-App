/*
  # Initial Schema for LAFAC Management System

  1. New Tables
    - `users` - User profiles and authentication data
    - `events` - Events and activities
    - `posts` - Social media posts and content
    - `study_groups` - Study group sessions
    - `candidates` - Selection process candidates
    - `score_weights` - Scoring configuration for selection process
    - `task_completions` - Task completion tracking for statistics
    - `audit_logs` - Audit trail for all changes

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure sensitive operations to executives only

  3. Features
    - Role-based permissions
    - 2FA support for executives
    - Comprehensive audit logging
    - Task completion tracking
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('President', 'Vice-President', 'Director of Events', 'Director of Communications', 'Scientific Director', 'Treasurer', 'Member')),
  contact_info text NOT NULL,
  is_active boolean DEFAULT true,
  join_date date DEFAULT CURRENT_DATE,
  two_fa_enabled boolean DEFAULT false,
  two_fa_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time time NOT NULL,
  type text NOT NULL CHECK (type IN ('Simpósio', 'Palestra', 'Workshop', 'Ação', 'Minicurso', 'Outro')),
  location text,
  online_link text,
  assigned_members uuid[] DEFAULT '{}',
  status text DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Cancelled', 'Completed')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date date DEFAULT CURRENT_DATE,
  deadline date NOT NULL,
  status text DEFAULT 'In Production' CHECK (status IN ('In Production', 'Posted', 'Expired', 'Done')),
  assigned_roles jsonb DEFAULT '[]',
  related_event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Study groups table
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme text NOT NULL,
  presenter text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('Presencial', 'Online')),
  date date NOT NULL,
  time time NOT NULL,
  material_status text DEFAULT 'Unfinished' CHECK (material_status IN ('Finished', 'Unfinished')),
  session_status text DEFAULT 'Scheduled' CHECK (session_status IN ('Done', 'Cancelled', 'Scheduled')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  position_applied text,
  test_score integer CHECK (test_score >= 0 AND test_score <= 100),
  interview_scores jsonb DEFAULT '[]',
  status text DEFAULT 'Under Evaluation' CHECK (status IN ('Under Evaluation', 'Approved', 'Rejected', 'Pending Documents')),
  comments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Score weights table
CREATE TABLE IF NOT EXISTS score_weights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_weight integer NOT NULL CHECK (test_weight >= 0 AND test_weight <= 100),
  interview_weight integer NOT NULL CHECK (interview_weight >= 0 AND interview_weight <= 100),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT weights_sum_100 CHECK (test_weight + interview_weight = 100)
);

-- Task completions table for statistics
CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('post', 'event', 'study', 'research', 'design', 'video')),
  task_id uuid NOT NULL,
  completed_at timestamptz DEFAULT now(),
  timeliness_score integer DEFAULT 100 CHECK (timeliness_score >= 0 AND timeliness_score <= 100),
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read all active users"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Executives can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President')
      AND u.is_active = true
    )
  );

-- RLS Policies for events table
CREATE POLICY "All users can read events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event directors can manage events"
  ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President', 'Director of Events')
      AND u.is_active = true
    )
  );

-- RLS Policies for posts table
CREATE POLICY "All users can read posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Communications directors can manage posts"
  ON posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President', 'Director of Communications')
      AND u.is_active = true
    )
  );

-- RLS Policies for study_groups table
CREATE POLICY "All users can read study groups"
  ON study_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Scientific directors can manage study groups"
  ON study_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President', 'Scientific Director')
      AND u.is_active = true
    )
  );

-- RLS Policies for candidates table
CREATE POLICY "Executives can read candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President')
      AND u.is_active = true
    )
  );

CREATE POLICY "Executives can manage candidates"
  ON candidates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President')
      AND u.is_active = true
    )
  );

-- RLS Policies for score_weights table
CREATE POLICY "All users can read score weights"
  ON score_weights
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can manage score weights"
  ON score_weights
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President')
      AND u.is_active = true
    )
  );

-- RLS Policies for task_completions table
CREATE POLICY "Users can read their own task completions"
  ON task_completions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Directors can read all task completions"
  ON task_completions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President', 'Director of Events', 'Director of Communications', 'Scientific Director')
      AND u.is_active = true
    )
  );

CREATE POLICY "Users can insert their own task completions"
  ON task_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for audit_logs table
CREATE POLICY "Executives can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('President', 'Vice-President')
      AND u.is_active = true
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_posts_deadline ON posts(deadline);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_study_groups_date ON study_groups(date);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON task_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default score weights
INSERT INTO score_weights (test_weight, interview_weight, updated_by)
VALUES (40, 60, NULL)
ON CONFLICT DO NOTHING;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_score_weights_updated_at BEFORE UPDATE ON score_weights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();