/*
  # Add missing fields to study_groups table

  1. New Fields
    - `research_assigned_to` - UUID reference to users for research/PowerPoint assignments
    - `material_assigned_to` - UUID reference to users for quiz/material assignments

  2. Updates
    - Add foreign key constraints
    - Update existing records to have null values for new fields
*/

-- Add new columns to study_groups table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_groups' AND column_name = 'research_assigned_to'
  ) THEN
    ALTER TABLE study_groups ADD COLUMN research_assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_groups' AND column_name = 'material_assigned_to'
  ) THEN
    ALTER TABLE study_groups ADD COLUMN material_assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_groups_research_assigned ON study_groups(research_assigned_to);
CREATE INDEX IF NOT EXISTS idx_study_groups_material_assigned ON study_groups(material_assigned_to);