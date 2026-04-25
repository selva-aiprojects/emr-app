-- Migration: Add Missing Clinical Columns
-- Description: Adds 'source' to nexus.appointments and 'notes' to nexus.encounters 
-- to ensure compatibility with NAH seeding scripts.

BEGIN;

-- 1. Add source to appointments
ALTER TABLE nexus.appointments 
ADD COLUMN IF NOT EXISTS source varchar(16) DEFAULT 'staff' CHECK (source IN ('staff', 'self', 'walkin'));

-- 2. Add notes to encounters
ALTER TABLE nexus.encounters 
ADD COLUMN IF NOT EXISTS notes text;

COMMIT;
