-- FHIR Tables - Part 4 of 2

BEGIN;

-- Observations table (enhanced)
CREATE TABLE IF NOT EXISTS observations(
  observation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  status varchar(32) NOT NULL,
  category varchar(32) NOT NULL,
  code_loinc varchar(32),
  code_snomed varchar(64),
  display_name varchar(255),
  value_quantity numeric,
  value_quantity_unit varchar(64),
  value_string text,
  effective_datetime timestamptz,
  performer_id uuid REFERENCES users(id),
  interpretation varchar(32),
  reference_range_low numeric,
  reference_range_high numeric,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  fhir_observation_ref uuid
);

COMMIT;
