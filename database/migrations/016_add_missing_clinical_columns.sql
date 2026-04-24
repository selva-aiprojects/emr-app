-- Migration: Add Missing Clinical Columns
-- Description: Adds 'source' to emr.appointments and 'notes' to emr.encounters 
-- to ensure compatibility with NAH seeding scripts.

BEGIN;

-- 1. Add source to appointments
ALTER TABLE emr.appointments 
ADD COLUMN IF NOT EXISTS source varchar(16) DEFAULT 'staff' CHECK (source IN ('staff', 'self', 'walkin'));

-- 2. Add notes to encounters
ALTER TABLE emr.encounters 
ADD COLUMN IF NOT EXISTS notes text;

COMMIT;
