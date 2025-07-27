/*
  # Fix User Profiles and Authentication

  1. Ensure superadmin user exists with all required fields
  2. Update authentication function to handle profile data properly
  3. Add sample users for testing
  4. Verify all user fields are properly set
*/

-- First, ensure we have all required columns in users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS period text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture text;

-- Delete existing superadmin to recreate with proper data
DELETE FROM users WHERE email = 'superadmin@lafac.com';

-- Insert the superadmin user with complete profile
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

-- Insert some sample users for testing
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
) VALUES 
(
    '00000000-0000-0000-0000-000000000002',
    'presidente@lafac.com',
    'Dr. Maria Silva',
    'President',
    '+55 11 98888-1111',
    true,
    '2023-01-15',
    false,
    '1985-03-15',
    'PRES001',
    '11111111111',
    'Universidade Federal',
    'Docente',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000003',
    'vice@lafac.com',
    'João Santos',
    'Vice-President',
    '+55 11 98888-2222',
    true,
    '2023-02-01',
    false,
    '1987-07-22',
    'VICE001',
    '22222222222',
    'Universidade Federal',
    'Docente',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000004',
    'eventos@lafac.com',
    'Ana Costa',
    'Director of Events',
    '+55 11 98888-3333',
    true,
    '2023-03-10',
    false,
    '1992-11-08',
    'EVT001',
    '33333333333',
    'Universidade Federal',
    '8º período',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000005',
    'comunicacao@lafac.com',
    'Carlos Oliveira',
    'Director of Communications',
    '+55 11 98888-4444',
    true,
    '2023-04-05',
    false,
    '1993-05-12',
    'COM001',
    '44444444444',
    'Universidade Federal',
    '7º período',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000006',
    'cientifico@lafac.com',
    'Lucia Ferreira',
    'Scientific Director',
    '+55 11 98888-5555',
    true,
    '2023-05-20',
    false,
    '1991-09-30',
    'SCI001',
    '55555555555',
    'Universidade Federal',
    '9º período',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000007',
    'tesoureiro@lafac.com',
    'Pedro Lima',
    'Treasurer',
    '+55 11 98888-6666',
    true,
    '2023-06-15',
    false,
    '1994-12-03',
    'TES001',
    '66666666666',
    'Universidade Federal',
    '6º período',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000008',
    'membro@lafac.com',
    'Fernanda Alves',
    'Member',
    '+55 11 98888-7777',
    true,
    '2023-07-01',
    false,
    '1995-04-18',
    'MEM001',
    '77777777777',
    'Universidade Federal',
    '5º período',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    contact_info = EXCLUDED.contact_info,
    is_active = EXCLUDED.is_active,
    birth_date = EXCLUDED.birth_date,
    student_id = EXCLUDED.student_id,
    cpf = EXCLUDED.cpf,
    institution = EXCLUDED.institution,
    period = EXCLUDED.period,
    updated_at = NOW();

-- Update the authenticate_superadmin function to return complete user data
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
        -- Get complete user record
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

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION authenticate_superadmin(text, text) TO authenticated, anon;

-- Verify all users were created successfully
DO $$
DECLARE
    user_count integer;
    superadmin_exists boolean;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE is_active = true;
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'superadmin@lafac.com' AND is_active = true) INTO superadmin_exists;
    
    IF NOT superadmin_exists THEN
        RAISE EXCEPTION 'Superadmin user was not created successfully';
    END IF;
    
    RAISE NOTICE 'Successfully created % active users including superadmin', user_count;
END $$;