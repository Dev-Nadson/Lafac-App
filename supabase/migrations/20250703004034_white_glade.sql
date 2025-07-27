/*
  # Add post_type column to posts table

  1. Changes
    - Add `post_type` column to `posts` table with default value 'Feed Post'
    - Add check constraint to ensure valid post types
    - Update existing records to have default post type

  2. Security
    - No changes to RLS policies needed
*/

-- Add post_type column to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'post_type'
  ) THEN
    ALTER TABLE posts ADD COLUMN post_type text DEFAULT 'Feed Post';
  END IF;
END $$;

-- Add check constraint for valid post types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'posts_post_type_check'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
    CHECK (post_type = ANY (ARRAY['Feed Post'::text, 'Reel'::text, 'Story'::text, 'Carrossel'::text]));
  END IF;
END $$;

-- Update any existing records that might have NULL post_type
UPDATE posts SET post_type = 'Feed Post' WHERE post_type IS NULL;