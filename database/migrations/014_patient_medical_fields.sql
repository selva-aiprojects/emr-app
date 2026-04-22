-- Migration: Add Medical Fields to Patients
-- Description: Adds blood_group, insurance, and medical_history to emr.patients for parity with SHARD baseline
BEGIN;

ALTER TABLE emr.patients
ADD COLUMN IF NOT EXISTS blood_group varchar(8),
ADD COLUMN IF NOT EXISTS emergency_contact varchar(128),
ADD COLUMN IF NOT EXISTS insurance varchar(256),
ADD COLUMN IF NOT EXISTS medical_history jsonb NOT NULL DEFAULT '{
    "chronicConditions": "",
    "allergies": "",
    "surgeries": "",
    "familyHistory": ""
}'::jsonb,
ADD COLUMN IF NOT EXISTS ethnicity varchar(64),
ADD COLUMN IF NOT EXISTS language varchar(64),
ADD COLUMN IF NOT EXISTS birth_place text;

COMMIT;
