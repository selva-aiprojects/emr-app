-- ============================================================
-- MedFlow EMR- FHIR Compliance Tables
-- Run this FIRST in Neon SQL Editor
-- ============================================================

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

-- Conditions table (FHIR Condition Resource)
CREATE TABLE IF NOT EXISTS conditions(
  condition_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  clinical_status varchar(32) NOT NULL CHECK (clinical_status IN ('active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved')),
  verification_status varchar(32) NOT NULL,
  category varchar(32) DEFAULT 'problem-list-item',
  severity varchar(32) CHECK (severity IN ('mild', 'moderate', 'severe')),
  code_snomed varchar(64),
  code_icd10 varchar(32),
  onset_datetime timestamptz,
  recorded_date timestamptz DEFAULT now(),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  fhir_condition_ref uuid
);

-- Procedures table (FHIR Procedure Resource)
CREATE TABLE IF NOT EXISTS procedures(
  procedure_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  status varchar(32) NOT NULL CHECK (status IN ('preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown')),
  category varchar(32) DEFAULT 'procedure',
  code_snomed varchar(64),
  code_cpt varchar(32),
  display_name varchar(255),
  performed_datetime timestamptz,
  performer_id uuid REFERENCES users(id),
  location varchar(255),
  reason_code_snomed varchar(64),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  fhir_procedure_ref uuid
);

-- Observations table enhanced (FHIR Observation Resource)
CREATE TABLE IF NOT EXISTS observations(
  observation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  status varchar(32) NOT NULL CHECK (status IN ('registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown')),
  category varchar(32) NOT NULL CHECK (category IN ('vital-signs', 'laboratory', 'imaging', 'survey', 'exam', 'procedure', 'activity', 'social-history', 'assessment-plan')),
  code_loinc varchar(32),
  code_snomed varchar(64),
  display_name varchar(255),
  value_quantity numeric,
  value_quantity_unit varchar(64),
  value_string text,
  effective_datetime timestamptz,
  performer_id uuid REFERENCES users(id),
  interpretation varchar(32) CHECK (interpretation IN ('low', 'normal', 'high', 'very-low', 'very-high', 'critical-low', 'critical-high')),
  reference_range_low numeric,
  reference_range_high numeric,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  fhir_observation_ref uuid
);

-- Diagnostic Reports table (FHIR DiagnosticReport Resource)
CREATE TABLE IF NOT EXISTS diagnostic_reports(
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  status varchar(32) NOT NULL CHECK (status IN ('registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown')),
  category varchar(32) CHECK (category IN ('laboratory', 'radiology', 'cardiology', 'pathology', 'other')),
  code_loinc varchar(32),
  code_snomed varchar(64),
  conclusion text,
  presented_form_data bytea,
  presented_form_content_type varchar(64),
  issued_datetime timestamptz DEFAULT now(),
  performer_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  fhir_diagnostic_report_ref uuid
);

-- Service Requests table (FHIR ServiceRequest Resource)
CREATE TABLE IF NOT EXISTS service_requests(
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  status varchar(32) NOT NULL CHECK (status IN ('draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown')),
  intent varchar(32) NOT NULL CHECK (intent IN ('proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option')),
  category varchar(32),
  code_loinc varchar(32),
  code_snomed varchar(64),
  display_name varchar(255),
  priority varchar(32) CHECK (priority IN ('stat', 'urgent', 'asap', 'routine')),
  ordered_by_id uuid REFERENCES users(id),
  order_datetime timestamptz DEFAULT now(),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  reason_code_snomed varchar(64),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  fhir_service_request_ref uuid
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conditions_patient ON conditions(patient_id, clinical_status);
CREATE INDEX IF NOT EXISTS idx_procedures_patient ON procedures(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_observations_patient ON observations(patient_id, category);
CREATE INDEX IF NOT EXISTS idx_diagnostic_reports_patient ON diagnostic_reports(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_patient ON service_requests(patient_id, status);

COMMIT;

-- Verify creation
SELECT '✅ FHIR Tables Created' as status, COUNT(DISTINCT table_name) as count 
FROM information_schema.tables 
WHERE table_schema = 'emr' 
AND table_name IN ('conditions', 'procedures', 'observations', 'diagnostic_reports', 'service_requests');
