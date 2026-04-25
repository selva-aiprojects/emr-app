-- FHIR Tables - Part 3 of 2
-- Run this after 01a and 01b

BEGIN;

-- Procedures table
CREATE TABLE IF NOT EXISTS procedures(
  procedure_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  status varchar(32) NOT NULL,
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

COMMIT;
