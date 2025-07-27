/*
  # Create President Account

  1. New User Account
    - Creates a president account with full access
    - Sets up proper permissions and security settings
    - Includes default password that should be changed on first login

  2. Security Setup
    - Account is active and ready to use
    - Password change required on first login for security
    - Full administrative permissions granted
*/

-- Insert president user account
INSERT INTO users (
  id,
  name,
  email,
  role,
  contact_info,
  is_active,
  join_date,
  password_hash,
  salt,
  require_password_change,
  two_fa_enabled,
  password_changed_at,
  login_count,
  failed_login_attempts
) VALUES (
  gen_random_uuid(),
  'Presidente LAFAC',
  'presidente@lafac.org',
  'President',
  '+55 11 99999-0001',
  true,
  CURRENT_DATE,
  -- This is a hashed version of 'lafac2025!' - should be changed on first login
  '$2a$12$LQv3c1yqBwlFDJrwQUib/OXYDeXWKNHkqGzjaUP.xrjQMXiKGqS6.',
  'secure_salt_string',
  true, -- Force password change on first login
  false,
  now(),
  0,
  0
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  require_password_change = EXCLUDED.require_password_change;

-- Grant full permissions to the president account
INSERT INTO user_permissions (
  user_id,
  permission_name,
  resource,
  actions,
  granted_by,
  granted_at,
  is_active
)
SELECT 
  u.id,
  'full_admin_access',
  'all',
  ARRAY['create', 'read', 'update', 'delete'],
  u.id,
  now(),
  true
FROM users u 
WHERE u.email = 'presidente@lafac.org'
ON CONFLICT (user_id, permission_name, resource) DO UPDATE SET
  actions = EXCLUDED.actions,
  is_active = EXCLUDED.is_active;

-- Create initial auth session for the president (optional)
-- This allows immediate login without going through Supabase Auth initially
INSERT INTO auth_sessions (
  user_id,
  session_token,
  ip_address,
  user_agent,
  expires_at,
  is_active,
  device_fingerprint
)
SELECT 
  u.id,
  'initial-session-' || gen_random_uuid()::text,
  '127.0.0.1'::inet,
  'Initial Setup',
  now() + INTERVAL '24 hours',
  true,
  'initial-setup-fingerprint'
FROM users u 
WHERE u.email = 'presidente@lafac.org'
ON CONFLICT (session_token) DO NOTHING;

-- Log the account creation
INSERT INTO security_logs (
  user_id,
  action,
  resource,
  details,
  ip_address,
  user_agent,
  risk_level
)
SELECT 
  u.id,
  'account_created',
  'users',
  jsonb_build_object(
    'account_type', 'president',
    'created_by', 'system_setup',
    'initial_setup', true
  ),
  '127.0.0.1'::inet,
  'System Setup',
  'low'
FROM users u 
WHERE u.email = 'presidente@lafac.org';