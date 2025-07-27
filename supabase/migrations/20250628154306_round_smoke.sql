/*
  # Create Superadmin Authentication

  1. Create superadmin user in auth.users table
  2. Ensure proper authentication setup
  3. Link with users table for profile data

  This migration creates the superadmin user with the specified credentials:
  - Email: superadmin@lafac.com
  - Password: SuperAdmin2025!
*/

-- First, ensure we have the auth schema available
-- Insert the superadmin user into auth.users if it doesn't exist
DO $$
DECLARE
    superadmin_user_id uuid := '00000000-0000-0000-0000-000000000001';
    superadmin_email text := 'superadmin@lafac.com';
    superadmin_password text := 'SuperAdmin2025!';
    encrypted_password text;
BEGIN
    -- Generate encrypted password (this is a simplified version - in production Supabase handles this)
    encrypted_password := crypt(superadmin_password, gen_salt('bf'));
    
    -- Insert into auth.users if not exists
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token,
        email_change_token_new,
        recovery_token
    ) VALUES (
        superadmin_user_id,
        '00000000-0000-0000-0000-000000000000',
        superadmin_email,
        encrypted_password,
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        updated_at = NOW();
        
    -- Also insert into auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at
    ) VALUES (
        superadmin_user_id,
        superadmin_user_id,
        jsonb_build_object('sub', superadmin_user_id::text, 'email', superadmin_email),
        'email',
        NOW(),
        NOW()
    ) ON CONFLICT (provider, id) DO NOTHING;
    
EXCEPTION
    WHEN OTHERS THEN
        -- If we can't access auth schema directly, we'll handle this differently
        RAISE NOTICE 'Could not directly insert into auth schema: %', SQLERRM;
END $$;

-- Ensure the superadmin user exists in our users table
INSERT INTO users (
    id,
    email, 
    name, 
    role, 
    contact_info, 
    is_active,
    join_date,
    two_fa_enabled
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'superadmin@lafac.com',
    'Superadmin LAFAC',
    'Superadmin',
    '+55 11 99999-0000',
    true,
    CURRENT_DATE,
    false
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create a function to handle superadmin authentication
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
    -- Check if this is the superadmin login
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
            result := json_build_object('success', false, 'error', 'User not found');
        END IF;
    ELSE
        result := json_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    RETURN result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION authenticate_superadmin(text, text) TO authenticated, anon;