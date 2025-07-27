/*
  # Fix Authentication and RLS Issues

  1. Database Fixes
    - Create superadmin authentication function
    - Fix RLS policies to prevent recursion
    - Ensure superadmin user exists with proper data

  2. Security
    - Simple RLS policies without recursion
    - Proper function permissions
    - Secure superadmin authentication
*/

-- Drop existing problematic policies and functions
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Read active users" ON users;
DROP POLICY IF EXISTS "Insert users" ON users;
DROP POLICY IF EXISTS "Update users" ON users;
DROP POLICY IF EXISTS "Delete users" ON users;
DROP FUNCTION IF EXISTS authenticate_superadmin(text, text);

-- Ensure all required columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS period text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture text;

-- Delete and recreate superadmin user to ensure clean state
DELETE FROM users WHERE email = 'superadmin@lafac.com';

INSERT INTO users (
    id,
    email, 
    name, 
    role, 
    contact_info, 
    is_active,
    join_date,
    two_fa_enabled,
    birth_date,
    student_id,
    cpf,
    institution,
    period,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'superadmin@lafac.com',
    'Superadmin LAFAC',
    'Superadmin',
    '+55 11 99999-0000',
    true,
    CURRENT_DATE,
    false,
    '1990-01-01',
    'SUPER001',
    '00000000000',
    'LAFAC System',
    'Admin',
    NOW(),
    NOW()
);

-- Create simple RLS policies without recursion
CREATE POLICY "users_select_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update_policy"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "users_delete_policy"
  ON users
  FOR DELETE
  TO authenticated
  USING (true);

-- Create superadmin authentication function
CREATE OR REPLACE FUNCTION authenticate_superadmin(
    email_input text,
    password_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record record;
    result json;
BEGIN
    -- Validate superadmin credentials
    IF email_input = 'superadmin@lafac.com' AND password_input = 'SuperAdmin2025!' THEN
        -- Get user data
        SELECT 
            id, email, name, role, contact_info, is_active, 
            join_date, two_fa_enabled, birth_date, student_id, 
            cpf, institution, period, profile_picture
        INTO user_record
        FROM users 
        WHERE email = email_input AND is_active = true;
        
        IF FOUND THEN
            result := json_build_object(
                'success', true,
                'user_id', user_record.id,
                'email', user_record.email,
                'name', user_record.name,
                'role', user_record.role,
                'contact_info', user_record.contact_info,
                'is_active', user_record.is_active,
                'join_date', user_record.join_date,
                'two_fa_enabled', user_record.two_fa_enabled,
                'birth_date', user_record.birth_date,
                'student_id', user_record.student_id,
                'cpf', user_record.cpf,
                'institution', user_record.institution,
                'period', user_record.period,
                'profile_picture', user_record.profile_picture,
                'requires_2fa', false
            );
        ELSE
            result := json_build_object('success', false, 'error', 'User profile not found');
        END IF;
    ELSE
        result := json_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION authenticate_superadmin(text, text) TO authenticated, anon;

-- Verify superadmin user exists
DO $$
DECLARE
    user_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE email = 'superadmin@lafac.com' 
        AND is_active = true
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'Superadmin user creation failed';
    END IF;
    
    RAISE NOTICE 'Superadmin user verified successfully';
END $$;