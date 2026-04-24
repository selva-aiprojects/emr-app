-- Enterprise-Wide HL7/FHIR Compliance Enhancements
-- PostgreSQL 14+
-- Adds FHIR resource references and clinical data structures to all modules

BEGIN;

-- =====================================================
-- PATIENT ENHANCEMENTS (FHIR Patient Resource)
-- =====================================================
ALTER TABLE emr.patients 
ADD COLUMN fhir_patient_ref uuid,
ADD COLUMN communication_language varchar(10) DEFAULT 'en',
ADD COLUMN marital_status varchar(32),
ADD COLUMN religion text,
ADD COLUMN ethnicity text,
ADD COLUMN birth_place text,
ADD COLUMN multiple_birth_indicator boolean DEFAULT false,
ADD COLUMN multiple_birth_order integer,
ADD COLUMN general_practitioner_id uuid REFERENCES emr.users(id),
ADD COLUMN managing_organization_id uuid,
ADD COLUMN preferred_contact_method varchar(16),
ADD COLUMN emergency_contact_name text,
ADD COLUMN emergency_contact_phone varchar(32),
ADD COLUMN emergency_contact_relationship varchar(32),
ADD COLUMN insurance_coverage_ids uuid[],
ADD COLUMN care_team_provider_ids uuid[];

-- Indexes for FHIR queries
CREATE INDEX IF NOT EXISTS idx_patients_general_practitioner ON emr.patients(general_practitioner_id);
CREATE INDEX IF NOT EXISTS idx_patients_ethnicity ON emr.patients(ethnicity);

-- =====================================================
-- ENCOUNTER ENHANCEMENTS (FHIR Encounter Resource)
-- =====================================================
ALTER TABLE emr.encounters
ADD COLUMN fhir_encounter_ref uuid,
ADD COLUMN encounter_class varchar(32) DEFAULT 'AMB' CHECK (encounter_class IN ('AMB', 'IMP', 'EMER', 'VR', 'HH')),
ADD COLUMN service_type text,
ADD COLUMN priority integer DEFAULT 5,
ADD COLUMN discharge_disposition varchar(64),
ADD COLUMN hospitalization_admission_source varchar(64),
ADD COLUMN episode_of_care_id uuid,
ADD COLUMN location_id uuid,
ADD COLUMN length_of_days integer,
ADD COLUMN diet_preference text,
ADD COLUMN admission_diagnosis text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_encounters_class ON emr.encounters(encounter_class);
CREATE INDEX IF NOT EXISTS idx_encounters_priority ON emr.encounters(priority DESC);

-- =====================================================
-- APPOINTMENT ENHANCEMENTS (FHIR Appointment Resource)
-- =====================================================
ALTER TABLE emr.appointments
ADD COLUMN fhir_appointment_ref uuid,
ADD COLUMN appointment_status varchar(32) DEFAULT 'scheduled' CHECK (appointment_status IN ('proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow')),
ADD COLUMN service_category varchar(64),
ADD COLUMN appointment_type varchar(64),
ADD COLUMN service_provider_id uuid REFERENCES emr.users(id),
ADD COLUMN supporting_information jsonb DEFAULT '{}'::jsonb,
ADD COLUMN minutes_duration integer DEFAULT 30,
ADD COLUMN arrival_time timestamptz,
ADD COLUMN no_show_reason text,
ADD COLUMN cancellation_reason text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_status ON emr.appointments(appointment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_service_category ON emr.appointments(service_category);

-- =====================================================
-- PRESCRIPTION ENHANCEMENTS (FHIR MedicationRequest)
-- =====================================================
ALTER TABLE emr.prescriptions
ADD COLUMN fhir_medication_request_ref uuid,
ADD COLUMN medication_codeable_concept jsonb,
ADD COLUMN category varchar(32) DEFAULT 'outpatient' CHECK (category IN ('inpatient', 'outpatient', 'community', 'discharge')),
ADD COLUMN intent varchar(32) DEFAULT 'order' CHECK (intent IN ('proposal', 'plan', 'directive', 'order', 'original-order')),
ADD COLUMN priority varchar(32) DEFAULT 'routine' CHECK (priority IN ('stat', 'urgent', 'asap', 'routine')),
ADD COLUMN do_not_perform_flag boolean DEFAULT false,
ADD COLUMN reported_boolean boolean DEFAULT false,
ADD COLUMN recorder_id uuid REFERENCES emr.users(id),
ADD COLUMN information_source_type varchar(32),
ADD COLUMN context_encounter_id uuid,
ADD COLUMN supporting_information_ids uuid[],
ADD COLUMN requested_dispense_as_written boolean DEFAULT false,
ADD COLUMN prior_prescription_id uuid,
ADD COLUMN based_on_prescription_ids uuid[],
ADD COLUMN insurance_coverage_ids uuid[],
ADD COLUMN note_text text,
ADD COLUMN detected_issue_ids uuid[],
ADD COLUMN rxnorm_code varchar(32),
ADD COLUMN ndc_code varchar(32),
ADD COLUMN snomed_code varchar(64);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_intent ON emr.prescriptions(intent);
CREATE INDEX IF NOT EXISTS idx_prescriptions_priority ON emr.prescriptions(priority);
CREATE INDEX IF NOT EXISTS idx_prescriptions_rxnorm ON emr.prescriptions(rxnorm_code);

-- =====================================================
-- NEW: CONDITIONS TABLE (FHIR Condition Resource)
-- Problem List, Diagnoses, Health Concerns
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.conditions(
  condition_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  clinical_status varchar(32) NOT NULL DEFAULT 'active' CHECK (clinical_status IN ('active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved')),
  verification_status varchar(32) NOT NULL DEFAULT 'unconfirmed' CHECK (verification_status IN ('unconfirmed', 'provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error')),
  category varchar(32) DEFAULT 'problem-list-item' CHECK (category IN ('problem-list-item', 'encounter-diagnosis', 'health-concern')),
  severity varchar(32) CHECK (severity IN ('mild', 'moderate', 'severe')),
  code_snomed varchar(64),
  code_icd10 varchar(32),
  code_icd9 varchar(32),
  body_site varchar(64),
  onset_datetime timestamptz,
  onset_age_range jsonb,
  abatement_datetime timestamptz,
  recorded_date timestamptz DEFAULT now(),
  recorder_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  asserter_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  stage_summary text,
  evidence_code varchar(64)[],
  note text,
  fhir_condition_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, condition_id)
);

-- Indexes
CREATE INDEX idx_conditions_tenant_patient ON emr.conditions(tenant_id, patient_id);
CREATE INDEX idx_conditions_clinical_status ON emr.conditions(clinical_status);
CREATE INDEX idx_conditions_verification ON emr.conditions(verification_status);
CREATE INDEX idx_conditions_snomed ON emr.conditions(code_snomed);
CREATE INDEX idx_conditions_icd10 ON emr.conditions(code_icd10);

-- =====================================================
-- NEW: PROCEDURES TABLE (FHIR Procedure Resource)
-- Surgical Procedures, Interventions, Treatments
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.procedures (
  procedure_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  status varchar(32) NOT NULL DEFAULT 'preparation' CHECK (status IN ('preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown')),
  category varchar(32) CHECK (category IN ('diagnostic', 'surgical', 'therapeutic', 'laboratory', 'administrative')),
  code_snomed varchar(64),
  code_cpt varchar(32),
  code_hcpcs varchar(32),
  body_site varchar(64)[],
  performed_datetime timestamptz,
  performed_period_start timestamptz,
  performed_period_end timestamptz,
  performer_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  location_id uuid,
  reason_code varchar(64)[],
  indication_condition_id uuid REFERENCES emr.conditions(condition_id) ON DELETE SET NULL,
  part_of_procedure_id uuid REFERENCES emr.procedures(procedure_id) ON DELETE SET NULL,
  outcome text,
  report_diagnostic_report_ids uuid[],
  complication text[],
  follow_up_required boolean DEFAULT false,
  follow_up_instructions text,
  anesthesia_used boolean DEFAULT false,
  anesthesia_type varchar(32),
  surgical_approach varchar(64),
  body_structure_side varchar(32),
  note text,
  fhir_procedure_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, procedure_id)
);

-- Indexes
CREATE INDEX idx_procedures_tenant_patient ON emr.procedures(tenant_id, patient_id);
CREATE INDEX idx_procedures_status ON emr.procedures(status);
CREATE INDEX idx_procedures_snomed ON emr.procedures(code_snomed);
CREATE INDEX idx_procedures_cpt ON emr.procedures(code_cpt);

-- =====================================================
-- NEW: OBSERVATIONS TABLE (FHIR Observation Resource)
-- Vital Signs, Lab Results, Clinical Measurements
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.observations(
  observation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  status varchar(32) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'preliminary', 'final', 'amended', 'corrected', 'entered-in-error')),
  category varchar(32) NOT NULL CHECK (category IN ('vital-signs', 'laboratory', 'imaging', 'social-history', 'exam', 'procedure', 'survey', 'activity')),
  code_loinc varchar(32),
  code_snomed varchar(64),
  display_name text NOT NULL,
  value_quantity numeric,
  value_quantity_unit varchar(32),
  value_string text,
  value_boolean boolean,
  value_range_low numeric,
  value_range_high numeric,
  value_ratio_numerator numeric,
  value_ratio_denominator numeric,
  effective_datetime timestamptz,
  issued_datetime timestamptz,
  performer_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  data_absence_reason varchar(64),
  interpretation varchar(32) CHECK (interpretation IN ('normal', 'abnormal', 'high', 'low', 'very-high', 'very-low', 'critical', 'alert')),
  reference_range_low numeric,
  reference_range_high numeric,
  reference_range_text text,
  method varchar(64),
  specimen_id uuid,
  device_id uuid,
  has_member boolean DEFAULT false,
  member_observation_ids uuid[],
  derived_from_document_ids uuid[],
  component_observations jsonb DEFAULT '{}'::jsonb,
  fhir_observation_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, observation_id)
);

-- Indexes
CREATE INDEX idx_observations_tenant_patient ON emr.observations(tenant_id, patient_id);
CREATE INDEX idx_observations_category ON emr.observations(category);
CREATE INDEX idx_observations_loinc ON emr.observations(code_loinc);
CREATE INDEX idx_observations_effective ON emr.observations(effective_datetime DESC);

-- =====================================================
-- NEW: DIAGNOSTIC REPORTS TABLE (FHIR DiagnosticReport)
-- Lab Reports, Imaging Reports, Pathology Reports
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.diagnostic_reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  identifier varchar(64) NOT NULL, -- Lab accession number
  status varchar(32) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'entered-in-error')),
  category varchar(32) CHECK (category IN ('laboratory', 'imaging', 'pathology', 'endoscopy', 'cardiology', 'radiology')),
  code_loinc varchar(32),
  code_snomed varchar(64),
  display_name text NOT NULL,
  specimen_ids uuid[],
  based_on_service_request_ids uuid[],
  issued_datetime timestamptz,
  performer_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  results_interpretation text,
  conclusion text,
  conclusion_code varchar(64)[],
  presented_form_data bytea, -- PDF/image attachment
  presented_form_content_type varchar(64),
  presented_form_url text,
  result_observation_ids uuid[],
  media_attachment_ids uuid[],
  imaging_study_uid varchar(128), -- DICOM Study Instance UID
  fhir_diagnostic_report_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, report_id)
);

-- Indexes
CREATE INDEX idx_diagnostic_reports_tenant_patient ON emr.diagnostic_reports(tenant_id, patient_id);
CREATE INDEX idx_diagnostic_reports_status ON emr.diagnostic_reports(status);
CREATE INDEX idx_diagnostic_reports_category ON emr.diagnostic_reports(category);
CREATE INDEX idx_diagnostic_reports_loinc ON emr.diagnostic_reports(code_loinc);

-- =====================================================
-- NEW: SERVICE REQUESTS TABLE (FHIR ServiceRequest)
-- Lab Orders, Referrals, Diagnostic Orders
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.service_requests (
  service_request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  identifier varchar(64) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'plan', 'proposal', 'arranged', 'on-hold', 'in-progress', 'requested', 'completed', 'cancelled')),
  intent varchar(32) NOT NULL CHECK (intent IN ('proposal', 'plan', 'directive', 'order', 'original-order')),
  category varchar(32) CHECK (category IN ('referral-request', 'laboratory-request', 'imaging-request', 'procedure-request')),
  priority varchar(32) DEFAULT 'routine' CHECK (priority IN ('stat', 'urgent', 'asap', 'routine')),
  do_not_perform_flag boolean DEFAULT false,
  code_snomed varchar(64),
  code_loinc varchar(32),
  code_cpt varchar(32),
  orderable_reference text,
  quantity_quantity numeric,
  quantity_range_low numeric,
  quantity_range_high numeric,
  requisition_identifier varchar(64),
  performer_type varchar(64),
  performer_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  location_id uuid,
  occurrence_datetime timestamptz,
  authored_on timestamptz DEFAULT now(),
  requester_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  reason_code varchar(64)[],
  reason_condition_id uuid REFERENCES emr.conditions(condition_id) ON DELETE SET NULL,
  supporting_information_ids uuid[],
  specimen_ids uuid[],
  relevant_info text,
  body_site varchar(64)[],
  note text,
  insurance_coverage_ids uuid[],
  additional_info text,
  fhir_service_request_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, service_request_id)
);

-- Indexes
CREATE INDEX idx_service_requests_tenant_patient ON emr.service_requests(tenant_id, patient_id);
CREATE INDEX idx_service_requests_status ON emr.service_requests(status);
CREATE INDEX idx_service_requests_intent ON emr.service_requests(intent);
CREATE INDEX idx_service_requests_loinc ON emr.service_requests(code_loinc);

-- =====================================================
-- INSURANCE/COVERAGE ENHANCEMENTS (FHIR Coverage/Claim)
-- =====================================================
ALTER TABLE emr.insurance_providers
ADD COLUMN fhir_organization_ref uuid,
ADD COLUMN payer_id varchar(32), -- CMS payer ID
ADD COLUMN plan_type varchar(64),
ADD COLUMN network_status varchar(32);

ALTER TABLE emr.claims
ADD COLUMN fhir_claim_ref uuid,
ADD COLUMN claim_type varchar(32) DEFAULT 'institutional' CHECK (claim_type IN ('institutional', 'professional', 'pharmacy', 'dental', 'vision')),
ADD COLUMN use_type varchar(32) DEFAULT 'claim' CHECK (use_type IN ('claim', 'pre-determination', 'pre-authorization')),
ADD COLUMN related_claim_ids uuid[],
ADD COLUMN prescription_ids uuid[],
ADD COLUMN diagnosis_codes varchar(32)[], -- ICD-10 codes
ADD COLUMN procedure_codes varchar(32)[], -- CPT/HCPCS codes
ADD COLUMN facility_code varchar(32),
ADD COLUMN place_of_service_code varchar(32),
ADD COLUMN total_billed numeric(12,2),
ADD COLUMN total_covered numeric(12,2),
ADD COLUMN total_deductible numeric(12,2),
ADD COLUMN total_copay numeric(12,2),
ADD COLUMN total_coinsurance numeric(12,2);

-- =====================================================
-- INVOICE ENHANCEMENTS (FHIR Account/ChargeItem)
-- =====================================================
ALTER TABLE emr.invoices
ADD COLUMN fhir_account_ref uuid,
ADD COLUMN claim_type varchar(32),
ADD COLUMN use_type varchar(32),
ADD COLUMN account_type varchar(32) DEFAULT 'patient';

ALTER TABLE emr.invoice_items
ADD COLUMN fhir_charge_ref uuid,
ADD COLUMN service_code_loinc varchar(32),
ADD COLUMN service_code_cpt varchar(32),
ADD COLUMN service_code_hcpcs varchar(32),
ADD COLUMN service_date timestamptz,
ADD COLUMN performing_provider_id uuid REFERENCES emr.users(id),
ADD COLUMN charge_code varchar(64),
ADD COLUMN cost_center varchar(64);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
DROP TRIGGER IF EXISTS trg_conditions_set_updated_at ON emr.conditions;
CREATE TRIGGER trg_conditions_set_updated_at BEFORE UPDATE ON emr.conditions 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_procedures_set_updated_at ON emr.procedures;
CREATE TRIGGER trg_procedures_set_updated_at BEFORE UPDATE ON emr.procedures 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_observations_set_updated_at ON emr.observations;
CREATE TRIGGER trg_observations_set_updated_at BEFORE UPDATE ON emr.observations 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_diagnostic_reports_set_updated_at ON emr.diagnostic_reports;
CREATE TRIGGER trg_diagnostic_reports_set_updated_at BEFORE UPDATE ON emr.diagnostic_reports 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_service_requests_set_updated_at ON emr.service_requests;
CREATE TRIGGER trg_service_requests_set_updated_at BEFORE UPDATE ON emr.service_requests 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

COMMIT;
