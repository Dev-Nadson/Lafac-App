/*
  # Fix Interviewer Permissions for Candidates

  1. Problem
    - Interviewers assigned to conduct interviews cannot see candidates
    - Current RLS policy only allows executives to read candidates
    - Need to allow interviewers to see candidates they are assigned to interview

  2. Solution
    - Update RLS policy to allow interviewers to see candidates they are assigned to
    - Add permission for users who are assigned as interviewer_1_id or interviewer_2_id
    - Keep existing executive permissions intact
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Executives can read candidates" ON candidates;

-- Create new policy that allows both executives and assigned interviewers to read candidates
CREATE POLICY "Executives and assigned interviewers can read candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (
    -- Allow executives (existing permission)
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
    OR
    -- Allow users who are assigned as interviewers in registrations
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE (r.interviewer_1_id = auth.uid() OR r.interviewer_2_id = auth.uid())
      AND r.email = candidates.email -- Link candidates to registrations by email
    )
  );

-- Also update registrations policy to allow assigned interviewers to read their assigned registrations
DROP POLICY IF EXISTS "Executives can manage registrations" ON registrations;

-- Create separate policies for registrations
CREATE POLICY "Executives can read all registrations"
  ON registrations
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

CREATE POLICY "Assigned interviewers can read their registrations"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (
    interviewer_1_id = auth.uid() OR interviewer_2_id = auth.uid()
  );

CREATE POLICY "Executives can insert registrations"
  ON registrations
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

CREATE POLICY "Executives can update registrations"
  ON registrations
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

CREATE POLICY "Executives can delete registrations"
  ON registrations
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

-- Allow assigned interviewers to update interview scores and notes for their assigned registrations
CREATE POLICY "Assigned interviewers can update their interview data"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (
    interviewer_1_id = auth.uid() OR interviewer_2_id = auth.uid()
  )
  WITH CHECK (
    interviewer_1_id = auth.uid() OR interviewer_2_id = auth.uid()
  );