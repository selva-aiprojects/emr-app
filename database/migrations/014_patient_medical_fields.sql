-- Migration: Add Medical Fields to Patients
-- Standardized for institutional shards

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS blood_group VARCHAR(8),
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(128),
ADD COLUMN IF NOT EXISTS insurance VARCHAR(256),
ADD COLUMN IF NOT EXISTS medical_history JSONB NOT NULL DEFAULT '{
    "chronicConditions": "",
    "allergies": "",
    "surgeries": "",
    "familyHistory": ""
}'::jsonb,
ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(64),
ADD COLUMN IF NOT EXISTS language VARCHAR(64),
ADD COLUMN IF NOT EXISTS birth_place TEXT;
