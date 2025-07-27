/*
  # Fix Superadmin User Profile

  1. Ensure superadmin user exists in users table
  2. Fix authentication flow for superadmin
  3. Add proper user profile data

  This migration ensures the superadmin user profile is properly created
  and can be accessed after authentication.
*/

-- First, delete any existing superadmin user to start fresh
DELETE FROM users WHERE email = 'superadmin@lafac.com';

-- Insert the superadmin user with a specific UUID
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

-- Update the authenticate_superadmin function to be more robust
CREATE OR REPLACE FUNCTION authenticate_superadmin(
    email_input text,
    password_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record users%ROWTYPE;
    result json;
BEGIN
    -- Check if this is the superadmin login with correct credentials
    IF email_input = 'superadmin@lafac.com' AND password_input = 'SuperAdmin2025!' THEN
        -- Get user record
        SELECT * INTO user_record 
        FROM users 
        WHERE email = email_input AND is_active = true;
        
        IF FOUND THEN
            result := json_build_object(
                'success', true,
                'user_id', user_record.id,
                'email', user_record.email,
                'name', user_record.name,
                'role', user_record.role,
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

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION authenticate_superadmin(text, text) TO authenticated, anon;

-- Verify the user was created
DO $$
DECLARE
    user_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE email = 'superadmin@lafac.com';
    IF user_count = 0 THEN
        RAISE EXCEPTION 'Superadmin user was not created successfully';
    ELSE
        RAISE NOTICE 'Superadmin user created successfully with ID: 00000000-0000-0000-0000-000000000001';
    END IF;
END $$;