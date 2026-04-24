-- FHIR Tables -Final Part

BEGIN;

-- Service Requests table
CREATE TABLE IF NOT EXISTS emr.service_requests(
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  patient_id uuid NOT NULL REFERENCES emr.patients(id),
  encounter_id uuid REFERENCES emr.encounters(id),
  status varchar(32) NOT NULL,
  intent varchar(32) NOT NULL,
  category varchar(32),
  code_loinc varchar(32),
  code_snomed varchar(64),
  display_name varchar(255),
  priority varchar(32),
  ordered_by_id uuid REFERENCES emr.users(id),
  order_datetime timestamptz DEFAULT now(),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  reason_code_snomed varchar(64),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES emr.users(id),
  fhir_service_request_ref uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conditions_patient ON emr.conditions(patient_id, clinical_status);
CREATE INDEX IF NOT EXISTS idx_procedures_patient ON emr.procedures(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_observations_patient ON emr.observations(patient_id, category);
CREATE INDEX IF NOT EXISTS idx_diagnostic_reports_patient ON emr.diagnostic_reports(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_patient ON emr.service_requests(patient_id, status);

COMMIT;

-- Verify
SELECT '✅ FHIR Tables Created' as status, COUNT(DISTINCT table_name) as count 
FROM information_schema.tables 
WHERE table_schema = 'emr' 
AND table_name IN ('conditions', 'procedures', 'observations', 'diagnostic_reports', 'service_requests');
