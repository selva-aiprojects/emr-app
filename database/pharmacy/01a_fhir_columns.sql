-- Quick FHIR Tables - Part 1 of 2
-- Run this in Neon SQL Editor

BEGIN;

-- Add FHIR reference columns to existing tables
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS fhir_patient_ref uuid,
ADD COLUMN IF NOT EXISTS ethnicity varchar(64),
ADD COLUMN IF NOT EXISTS language varchar(64),
ADD COLUMN IF NOT EXISTS birth_place text;

ALTER TABLE encounters
ADD COLUMN IF NOT EXISTS fhir_encounter_ref uuid;

ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS fhir_medication_request_ref uuid;

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS fhir_observation_ref uuid;

COMMIT;
