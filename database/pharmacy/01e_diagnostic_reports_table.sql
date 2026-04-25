-- FHIR Tables - Part 5 of 2

BEGIN;

-- Diagnostic Reports table
CREATE TABLE IF NOT EXISTS diagnostic_reports(
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  status varchar(32) NOT NULL,
  category varchar(32),
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

COMMIT;
