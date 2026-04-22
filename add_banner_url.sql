-- Add banner_url column to performers table
ALTER TABLE performers ADD COLUMN IF NOT EXISTS banner_url TEXT;
