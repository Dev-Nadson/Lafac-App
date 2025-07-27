/*
  # Interviewer Permission System for Selection Process

  1. New Features
    - Interviewer permission system for candidates access
    - Automatic notification system for assigned interviewers
    - Enhanced RLS policies for interviewer access

  2. Changes
    - Add interviewer permission checks
    - Update candidate access policies
    - Enhance notification system for interview assignments
*/

-- Create function to grant interviewer permission
CREATE OR REPLACE FUNCTION grant_interviewer_permission(
  target_user_id uuid,
  granted_by_user_id uuid,
  expires_at timestamptz DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  granter_role text;
BEGIN
  -- Check if granter has permission to grant interviewer access
  SELECT role INTO granter_role
  FROM users 
  WHERE id = granted_by_user_id 
  AND is_active = true;
  
  IF granter_role NOT IN ('Superadmin', 'President', 'Vice-President') THEN
    RETURN false;
  END IF;
  
  -- Grant interviewer permission
  INSERT INTO user_permissions (
    user_id,
    permission_name,
    resource,
    actions,
    granted_by,
    expires_at,
    is_active
  ) VALUES (
    target_user_id,
    'interview_access',
    'candidates',
    ARRAY['read', 'update'],
    granted_by_user_id,
    expires_at,
    true
  ) ON CONFLICT (user_id, permission_name, resource) 
  DO UPDATE SET
    granted_by = EXCLUDED.granted_by,
    expires_at = EXCLUDED.expires_at,
    is_active = true,
    granted_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to revoke interviewer permission
CREATE OR REPLACE FUNCTION revoke_interviewer_permission(
  target_user_id uuid,
  revoked_by_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  revoker_role text;
BEGIN
  -- Check if revoker has permission to revoke interviewer access
  SELECT role INTO revoker_role
  FROM users 
  WHERE id = revoked_by_user_id 
  AND is_active = true;
  
  IF revoker_role NOT IN ('Superadmin', 'President', 'Vice-President') THEN
    RETURN false;
  END IF;
  
  -- Revoke interviewer permission
  UPDATE user_permissions 
  SET is_active = false
  WHERE user_id = target_user_id
  AND permission_name = 'interview_access'
  AND resource = 'candidates';
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has interviewer permission
CREATE OR REPLACE FUNCTION has_interviewer_permission(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = has_interviewer_permission.user_id
    AND up.permission_name = 'interview_access'
    AND up.resource = 'candidates'
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > now())
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically notify assigned interviewers
CREATE OR REPLACE FUNCTION notify_assigned_interviewers()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify interviewer 1 if assigned
  IF NEW.interviewer_1_id IS NOT NULL AND (OLD.interviewer_1_id IS NULL OR OLD.interviewer_1_id != NEW.interviewer_1_id) THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      read,
      action_url,
      related_id
    ) VALUES (
      NEW.interviewer_1_id,
      'Entrevista Atribuída',
      'Você foi designado como entrevistador para ' || NEW.full_name || '. Acesse o processo seletivo para mais detalhes.',
      'Task',
      false,
      '#selection-process',
      NEW.id
    );
    
    -- Grant interviewer permission if not already granted
    PERFORM grant_interviewer_permission(NEW.interviewer_1_id, auth.uid(), now() + INTERVAL '90 days');
  END IF;
  
  -- Notify interviewer 2 if assigned
  IF NEW.interviewer_2_id IS NOT NULL AND (OLD.interviewer_2_id IS NULL OR OLD.interviewer_2_id != NEW.interviewer_2_id) THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      read,
      action_url,
      related_id
    ) VALUES (
      NEW.interviewer_2_id,
      'Entrevista Atribuída',
      'Você foi designado como entrevistador para ' || NEW.full_name || '. Acesse o processo seletivo para mais detalhes.',
      'Task',
      false,
      '#selection-process',
      NEW.id
    );
    
    -- Grant interviewer permission if not already granted
    PERFORM grant_interviewer_permission(NEW.interviewer_2_id, auth.uid(), now() + INTERVAL '90 days');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic interviewer notifications
DROP TRIGGER IF EXISTS notify_interviewers_trigger ON registrations;
CREATE TRIGGER notify_interviewers_trigger
  AFTER UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_assigned_interviewers();

-- Update RLS policy for candidates to include interviewer access
DROP POLICY IF EXISTS "Executives and assigned interviewers can read candidates" ON candidates;

CREATE POLICY "Executives and interviewers can read candidates"
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
    -- Allow users with interviewer permission
    has_interviewer_permission(auth.uid())
    OR
    -- Allow users who are assigned as interviewers in registrations
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE (r.interviewer_1_id = auth.uid() OR r.interviewer_2_id = auth.uid())
      AND r.email = candidates.email
    )
  );

-- Update RLS policy for registrations to include interviewer access
DROP POLICY IF EXISTS "Assigned interviewers can read their registrations" ON registrations;

CREATE POLICY "Interviewers can read assigned registrations"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (
    -- Allow executives
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
    OR
    -- Allow assigned interviewers
    (interviewer_1_id = auth.uid() OR interviewer_2_id = auth.uid())
    OR
    -- Allow users with general interviewer permission
    has_interviewer_permission(auth.uid())
  );

-- Allow interviewers to update interview scores for their assigned registrations
DROP POLICY IF EXISTS "Assigned interviewers can update their interview data" ON registrations;

CREATE POLICY "Interviewers can update interview scores"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow executives (full access)
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
    OR
    -- Allow assigned interviewers (limited to their interviews)
    (interviewer_1_id = auth.uid() OR interviewer_2_id = auth.uid())
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President', 'Vice-President')
      AND u.is_active = true
    )
    OR
    (interviewer_1_id = auth.uid() OR interviewer_2_id = auth.uid())
  );

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION grant_interviewer_permission(uuid, uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_interviewer_permission(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_interviewer_permission(uuid) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_interview_access 
ON user_permissions(user_id, permission_name, resource) 
WHERE permission_name = 'interview_access';

CREATE INDEX IF NOT EXISTS idx_registrations_interviewers 
ON registrations(interviewer_1_id, interviewer_2_id);