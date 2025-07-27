/*
  # Fix RLS Policies for Read Access

  1. Problem
    - Members can only see data when they can manage it
    - Read policies are too restrictive
    - Members should see all data but only manage what they're authorized for

  2. Solution
    - Separate read and write policies
    - Allow all authenticated users to read most data
    - Keep write restrictions based on roles
*/

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Event directors can manage events" ON events;
DROP POLICY IF EXISTS "Communications directors can manage posts" ON posts;
DROP POLICY IF EXISTS "Scientific directors can manage study groups" ON study_groups;
DROP POLICY IF EXISTS "Executives can read candidates" ON candidates;
DROP POLICY IF EXISTS "Executives can manage candidates" ON candidates;

-- EVENTS: Allow all to read, restrict write access
CREATE POLICY "All authenticated users can read events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event directors can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Director of Events')
      AND u.is_active = true
    )
  );

CREATE POLICY "Event directors can update events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Director of Events')
      AND u.is_active = true
    )
  );

CREATE POLICY "Event directors can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Director of Events')
      AND u.is_active = true
    )
  );

-- POSTS: Allow all to read, restrict write access
CREATE POLICY "All authenticated users can read posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Communications directors can insert posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Director of Communications')
      AND u.is_active = true
    )
  );

CREATE POLICY "Communications directors can update posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Director of Communications')
      AND u.is_active = true
    )
  );

CREATE POLICY "Communications directors can delete posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Director of Communications')
      AND u.is_active = true
    )
  );

-- STUDY GROUPS: Allow all to read, restrict write access
CREATE POLICY "All authenticated users can read study groups"
  ON study_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Scientific directors can insert study groups"
  ON study_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Scientific Director')
      AND u.is_active = true
    )
  );

CREATE POLICY "Scientific directors can update study groups"
  ON study_groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Scientific Director')
      AND u.is_active = true
    )
  );

CREATE POLICY "Scientific directors can delete study groups"
  ON study_groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Scientific Director')
      AND u.is_active = true
    )
  );

-- CANDIDATES: Allow executives to read, restrict write access
CREATE POLICY "Executives can read candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
  );

CREATE POLICY "Executives can insert candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
  );

CREATE POLICY "Executives can update candidates"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
  );

CREATE POLICY "Executives can delete candidates"
  ON candidates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
  );

-- BUDGET REQUESTS: Allow all to read, restrict write based on role
DROP POLICY IF EXISTS "Treasurers can manage budget requests" ON budget_requests;

CREATE POLICY "All authenticated users can read budget requests"
  ON budget_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own budget requests"
  ON budget_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Treasurers can update budget requests"
  ON budget_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Treasurer')
      AND u.is_active = true
    )
  );

CREATE POLICY "Treasurers can delete budget requests"
  ON budget_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President', 'Treasurer')
      AND u.is_active = true
    )
  );

-- NOTIFICATIONS: Keep existing policies (users can only see their own)
-- ACTIVITY ASSIGNMENTS: Keep existing policies (users can see their own + directors can see all)
-- MEMBER WORKLOAD: Keep existing policies (users can see their own + directors can see all)

-- Add some sample data if tables are empty
INSERT INTO events (title, description, date, time, type, location, status, created_by)
SELECT 
  'Palestra: Farmácia Clínica na Prática',
  'Uma palestra sobre a aplicação prática da farmácia clínica no dia a dia hospitalar.',
  CURRENT_DATE + INTERVAL '7 days',
  '14:00',
  'Palestra',
  'Auditório Principal',
  'Scheduled',
  u.id
FROM users u 
WHERE u.role IN ('President', 'Director of Events') 
AND u.is_active = true
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO posts (title, description, deadline, status, created_by)
SELECT 
  'Post sobre Interações Medicamentosas',
  'Criar um post educativo sobre as principais interações medicamentosas.',
  CURRENT_DATE + INTERVAL '5 days',
  'In Production',
  u.id
FROM users u 
WHERE u.role IN ('President', 'Director of Communications') 
AND u.is_active = true
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO study_groups (theme, presenter, mode, date, time, material_status, session_status, created_by)
SELECT 
  'Farmacologia Cardiovascular',
  'Dr. Maria Silva',
  'Presencial',
  CURRENT_DATE + INTERVAL '10 days',
  '15:30',
  'Unfinished',
  'Scheduled',
  u.id
FROM users u 
WHERE u.role IN ('President', 'Scientific Director') 
AND u.is_active = true
LIMIT 1
ON CONFLICT DO NOTHING;