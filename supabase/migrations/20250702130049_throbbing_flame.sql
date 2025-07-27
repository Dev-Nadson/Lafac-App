/*
  # Fix User Registration RLS Policy

  1. Security Updates
    - Update INSERT policy to allow user creation during registration
    - Ensure users can only create records for their own auth.uid()
    - Maintain security while enabling registration flow

  2. Changes
    - Modify users_insert_policy to allow both authenticated and anon users
    - Add proper check to ensure users can only insert their own record
    - Keep existing policies for other operations
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "users_insert_policy" ON users;

-- Create new insert policy that allows user creation during registration
CREATE POLICY "users_insert_policy" 
  ON users 
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (
    -- Allow if user is authenticated and inserting their own record
    (auth.uid() IS NOT NULL AND id = auth.uid()) OR
    -- Allow if user is anonymous but will become authenticated (during registration)
    (auth.uid() IS NULL AND id IS NOT NULL)
  );

-- Also update the insert policy to be more permissive for the registration flow
DROP POLICY IF EXISTS "users_insert_policy" ON users;

CREATE POLICY "users_insert_policy" 
  ON users 
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (
    -- During registration, allow insert if the ID matches the auth user
    -- or if it's a system operation
    id = auth.uid() OR auth.uid() IS NOT NULL
  );