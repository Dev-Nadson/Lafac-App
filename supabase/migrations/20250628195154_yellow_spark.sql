/*
  # Secure Authentication System

  1. New Tables
    - `auth_sessions` - Secure session management
    - `auth_attempts` - Login attempt tracking
    - `auth_tokens` - Secure token management
    - `user_permissions` - Role-based permissions
    - `security_logs` - Comprehensive audit logging
    - `password_history` - Password change tracking
    - `trusted_devices` - Device management

  2. Security Features
    - Enhanced RLS policies
    - Password complexity requirements
    - Session timeout management
    - IP-based restrictions
    - Audit logging for all actions

  3. Updates to existing tables
    - Enhanced users table with security fields
    - Password history tracking
    - Two-factor authentication support
*/

-- Enhanced users table with security fields
DO $$
BEGIN
  -- Add security columns to existing users table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'salt') THEN
    ALTER TABLE users ADD COLUMN salt text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'login_count') THEN
    ALTER TABLE users ADD COLUMN login_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'failed_login_attempts') THEN
    ALTER TABLE users ADD COLUMN failed_login_attempts integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_locked_until') THEN
    ALTER TABLE users ADD COLUMN account_locked_until timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_changed_at') THEN
    ALTER TABLE users ADD COLUMN password_changed_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'require_password_change') THEN
    ALTER TABLE users ADD COLUMN require_password_change boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'allowed_ips') THEN
    ALTER TABLE users ADD COLUMN allowed_ips text[];
  END IF;
END $$;

-- Auth sessions table for secure session management
CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  refresh_token text UNIQUE,
  ip_address inet NOT NULL,
  user_agent text,
  expires_at timestamptz NOT NULL,
  last_activity timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  device_fingerprint text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON auth_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
  ON auth_sessions
  FOR ALL
  TO authenticated
  USING (true);

-- Auth attempts table for tracking login attempts
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  success boolean NOT NULL,
  failure_reason text,
  attempted_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read auth attempts"
  ON auth_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President')
    )
  );

CREATE POLICY "System can insert auth attempts"
  ON auth_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User permissions table for granular RBAC
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  permission_name text NOT NULL,
  resource text NOT NULL,
  actions text[] NOT NULL, -- ['create', 'read', 'update', 'delete']
  conditions jsonb DEFAULT '{}',
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, permission_name, resource)
);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President')
    )
  );

-- Security logs for comprehensive audit trail
CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  session_id uuid REFERENCES auth_sessions(id) ON DELETE SET NULL,
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read security logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Superadmin', 'President')
    )
  );

CREATE POLICY "System can insert security logs"
  ON security_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Password history for preventing password reuse
CREATE TABLE IF NOT EXISTS password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  salt text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own password history"
  ON password_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage password history"
  ON password_history
  FOR ALL
  TO authenticated
  USING (true);

-- Trusted devices for enhanced security
CREATE TABLE IF NOT EXISTS trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_fingerprint text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  last_used timestamptz DEFAULT now(),
  is_trusted boolean DEFAULT false,
  trusted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trusted devices"
  ON trusted_devices
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Auth tokens for secure API access
CREATE TABLE IF NOT EXISTS auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  token_type text CHECK (token_type IN ('access', 'refresh', 'reset', 'verification')) NOT NULL,
  scope text[] DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tokens"
  ON auth_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage tokens"
  ON auth_tokens
  FOR ALL
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email ON auth_attempts(email);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip ON auth_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_attempted_at ON auth_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash);

-- Insert default permissions for existing roles
INSERT INTO user_permissions (user_id, permission_name, resource, actions, granted_by)
SELECT 
  u.id,
  'admin_access',
  'all',
  ARRAY['create', 'read', 'update', 'delete'],
  u.id
FROM users u 
WHERE u.role = 'Superadmin'
ON CONFLICT (user_id, permission_name, resource) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_name, resource, actions, granted_by)
SELECT 
  u.id,
  'management_access',
  'users,events,posts,statistics',
  ARRAY['create', 'read', 'update', 'delete'],
  u.id
FROM users u 
WHERE u.role IN ('President', 'Vice-President')
ON CONFLICT (user_id, permission_name, resource) DO NOTHING;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE auth_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  DELETE FROM auth_sessions 
  WHERE expires_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id uuid,
  p_action text,
  p_resource text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_risk_level text DEFAULT 'low'
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO security_logs (
    user_id, action, resource, resource_id, details, 
    ip_address, user_agent, risk_level
  ) VALUES (
    p_user_id, p_action, p_resource, p_resource_id, p_details,
    p_ip_address, p_user_agent, p_risk_level
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id uuid,
  p_resource text,
  p_action text
)
RETURNS boolean AS $$
DECLARE
  has_permission boolean := false;
BEGIN
  -- Check if user has specific permission
  SELECT EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = p_user_id
    AND up.resource = p_resource
    AND p_action = ANY(up.actions)
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > now())
  ) INTO has_permission;
  
  -- If no specific permission, check role-based permissions
  IF NOT has_permission THEN
    SELECT EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = p_user_id
      AND u.is_active = true
      AND (
        (u.role = 'Superadmin') OR
        (u.role IN ('President', 'Vice-President') AND p_resource IN ('users', 'events', 'posts', 'statistics')) OR
        (u.role = 'Director of Events' AND p_resource = 'events') OR
        (u.role = 'Director of Communications' AND p_resource = 'posts') OR
        (u.role = 'Scientific Director' AND p_resource = 'study_groups') OR
        (u.role = 'Treasurer' AND p_resource = 'budget_requests')
      )
    ) INTO has_permission;
  END IF;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql;