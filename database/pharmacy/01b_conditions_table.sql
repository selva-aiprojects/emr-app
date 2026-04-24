-- Quick FHIR Tables - Part 2 of 2
-- Run this in Neon SQL Editor (after 01a_fhir_columns.sql)

BEGIN;

-- Conditions table
CREATE TABLE IF NOT EXISTS emr.conditions(
  condition_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  patient_id uuid NOT NULL REFERENCES emr.patients(id),
  clinical_status varchar(32) NOT NULL,
  verification_status varchar(32) NOT NULL,
  category varchar(32) DEFAULT 'problem-list-item',
  severity varchar(32),
  code_snomed varchar(64),
  code_icd10 varchar(32),
  onset_datetime timestamptz,
  recorded_date timestamptz DEFAULT now(),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES emr.users(id),
  fhir_condition_ref uuid
);

COMMIT;
