-- ============================================================
-- MedFlow EMR- Complete Pharmacy Module Setup
-- Run this entire script in Neon SQL Editor
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: FHIR COMPLIANCE ENHANCEMENTS
-- ============================================================

-- Add FHIR reference columns to existing tables
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS fhir_patient_ref uuid,
ADD COLUMN IF NOT EXISTS ethnicity varchar(64),
ADD COLUMN IF NOT EXISTS language varchar(64),
ADD COLUMN IF NOT EXISTS birth_place text;

ALTER TABLE encounters
ADD COLUMN IF NOT EXISTS fhir_encounter_ref uuid;
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_status_check;
UPDATE prescriptions SET status = LOWER(status) WHERE status IN ('Pending', 'Dispensed', 'Cancelled');
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES patients(id),
ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS prescription_number varchar(64),
ADD COLUMN IF NOT EXISTS priority varchar(16) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat', 'asap')),
ADD COLUMN IF NOT EXISTS fhir_medication_request_ref uuid;



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

-- Observations table (FHIR Observation Resource) - Enhanced
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

-- ============================================================
-- PART 2: PHARMACY MODULE TABLES
-- ============================================================

DROP TABLE IF EXISTS pharmacy_alerts CASCADE;
DROP TABLE IF EXISTS patient_medication_allocations CASCADE;
DROP TABLE IF EXISTS ward_stock CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS pharmacy_inventory CASCADE;
DROP TABLE IF EXISTS drug_batches CASCADE;
DROP TABLE IF EXISTS medication_schedules CASCADE;
DROP TABLE IF EXISTS medication_administrations CASCADE;
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS drug_allergies CASCADE;
DROP TABLE IF EXISTS drug_interactions CASCADE;
DROP TABLE IF EXISTS drug_master CASCADE;

-- Drug Master with comprehensive medication metadata
CREATE TABLE IF NOT EXISTS drug_master(
  drug_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  generic_name text NOT NULL,
  brand_names text[] DEFAULT '{}',
  strength text,
  dosage_form varchar(64),
  route varchar(64),
  manufacturer text,
  ndc_code varchar(32), -- National Drug Code
  rxnorm_code varchar(32), -- RxNorm CUI
  snomed_code varchar(64), -- SNOMED CT code
  therapeutic_class varchar(64),
  schedule_type varchar(16) CHECK (schedule_type IN ('OTC', 'Prescription', 'Controlled-II', 'Controlled-III', 'Controlled-IV', 'Controlled-V')),
  high_alert_flag boolean DEFAULT false,
  look_alike_sound_alike_flag boolean DEFAULT false,
  black_box_warning boolean DEFAULT false,
  pregnancy_category varchar(8),
  renal_adjustment_required boolean DEFAULT false,
  hepatic_adjustment_required boolean DEFAULT false,
  cyp450_substrate boolean DEFAULT false,
  controlled_substance boolean DEFAULT false,
  refrigeration_required boolean DEFAULT false,
  reorder_threshold integer DEFAULT 50,
  status varchar(32) DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'recall', 'shortage')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drug-Drug Interactions database
CREATE TABLE IF NOT EXISTS drug_interactions(
  interaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a uuid NOT NULL REFERENCES drug_master(drug_id),
  drug_b uuid NOT NULL REFERENCES drug_master(drug_id),
  severity varchar(32) NOT NULL CHECK (severity IN ('contraindicated', 'major', 'moderate', 'minor')),
  description text NOT NULL,
  mechanism text,
  management text,
  evidence_level varchar(16),
  created_at timestamptz DEFAULT now()
);

-- Patient Drug Allergies
CREATE TABLE IF NOT EXISTS drug_allergies(
  allergy_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  drug_id uuid NOT NULL REFERENCES drug_master(drug_id),
  reaction_severity varchar(32) CHECK (reaction_severity IN ('mild', 'moderate', 'severe', 'life-threatening', 'anaphylaxis')),
  reaction_description text,
  criticality varchar(16) CHECK (criticality IN ('low', 'high', 'unable-to-assess')),
  verification_status varchar(32) CHECK (verification_status IN ('unconfirmed', 'provisional', 'confirmed', 'refuted', 'entered-in-error')),
  first_occurrence date,
  recorded_date timestamptz DEFAULT now(),
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Prescription Items (line items within a prescription)
CREATE TABLE IF NOT EXISTS prescription_items(
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_id uuid NOT NULL REFERENCES drug_master(drug_id),
  sequence integer NOT NULL,
  dose numeric NOT NULL,
  dose_unit varchar(64) NOT NULL,
  frequency varchar(64) NOT NULL, -- BID, TID, QD, etc.
  route varchar(64), -- PO, IV, IM, etc.
  administration_timing varchar(64), -- before_meals, with_food, at_bedtime, etc.
  duration_days integer,
  quantity_prescribed numeric NOT NULL,
  quantity_dispensed numeric,
  instructions text,
  sig_code varchar(255), -- Structured SIG code
  refills_allowed integer DEFAULT 0,
  days_supply integer DEFAULT 30,
  substitution_allowed boolean DEFAULT true,
  dispense_as_written_flag boolean DEFAULT false,
  status varchar(32) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'on-hold', 'expired')),
  prescribed_date timestamptz DEFAULT now(),
  dispensed_date timestamptz,
  last_fill_date timestamptz,
  next_fill_date timestamptz,
  dispensed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medication Administration Record (MAR) - For nurses
CREATE TABLE IF NOT EXISTS medication_administrations(
  administration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  prescription_item_id uuid REFERENCES prescription_items(item_id),
  drug_id uuid NOT NULL REFERENCES drug_master(drug_id),
  scheduled_datetime timestamptz NOT NULL,
  administered_datetime timestamptz,
  dose_administered numeric,
  dose_unit varchar(64),
  route varchar(64),
  site varchar(255), -- Injection site, etc.
  administered_by uuid REFERENCES users(id),
  verified_by uuid REFERENCES users(id),
  status varchar(32) NOT NULL CHECK (status IN ('scheduled', 'administered', 'missed', 'held', 'refused', 'not-applicable')),
  hold_reason varchar(255),
  refusal_reason varchar(255),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medication Schedules (for recurring doses)
CREATE TABLE IF NOT EXISTS medication_schedules(
  schedule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  prescription_item_id uuid REFERENCES prescription_items(item_id),
  drug_id uuid NOT NULL REFERENCES drug_master(drug_id),
  dose numeric NOT NULL,
  dose_unit varchar(64) NOT NULL,
  frequency varchar(64) NOT NULL,
  route varchar(64),
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz,
  administration_instructions text,
  status varchar(32) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on-hold')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drug Batches/Lots for pharmaceutical inventory
CREATE TABLE IF NOT EXISTS drug_batches(
  batch_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_id uuid NOT NULL REFERENCES drug_master(drug_id),
  batch_number varchar(64) NOT NULL,
  serial_number varchar(64), -- Track and trace requirement
  quantity_received numeric NOT NULL,
  quantity_remaining numeric NOT NULL,
  quantity_dispensed numeric DEFAULT 0,
  unit_cost numeric(12,2),
  purchase_price numeric(12,2),
  expiry_date date NOT NULL,
  manufacturing_date date,
  received_date timestamptz DEFAULT now(),
  supplier varchar(255),
  location varchar(64), -- Shelf/bin location
  status varchar(32) DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'recalled', 'expired', 'depleted')),
  recall_notice text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pharmacy Inventory Transactions (audit trail)
CREATE TABLE IF NOT EXISTS pharmacy_inventory(
  transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  batch_id uuid NOT NULL REFERENCES drug_batches(batch_id),
  transaction_type varchar(32) NOT NULL CHECK (transaction_type IN ('receive', 'dispense', 'adjustment', 'return', 'transfer', 'discard', 'expire')),
  quantity_change numeric NOT NULL,
  quantity_balance numeric,
  reference_type varchar(32), -- prescription, purchase_order, adjustment, etc.
  reference_id uuid,
  performed_by uuid REFERENCES users(id),
  notes text,
  transaction_datetime timestamptz DEFAULT now()
);

-- Vendors/Suppliers for drug procurement
CREATE TABLE IF NOT EXISTS vendors(
  vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  vendor_name text NOT NULL,
  contact_person text,
  email varchar(255),
  phone varchar(32),
  address text,
  account_number varchar(64),
  payment_terms varchar(64),
  lead_time_days integer DEFAULT 7,
  minimum_order_amount numeric(10,2),
  status varchar(32) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase Orders for drug procurement
CREATE TABLE IF NOT EXISTS purchase_orders(
  order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  vendor_id uuid NOT NULL REFERENCES vendors(vendor_id),
  order_number varchar(64) UNIQUE NOT NULL,
  order_date timestamptz DEFAULT now(),
  expected_delivery_date date,
  actual_delivery_date date,
  status varchar(32) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shipped', 'received', 'cancelled', 'closed')),
  total_amount numeric(12,2),
  notes text,
  ordered_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  received_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase Order Line Items
CREATE TABLE IF NOT EXISTS purchase_order_items(
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES purchase_orders(order_id) ON DELETE CASCADE,
  drug_id uuid NOT NULL REFERENCES drug_master(drug_id),
  quantity_ordered numeric NOT NULL,
  quantity_received numeric,
  unit_price numeric(10,2),
  total_price numeric(10,2),
  batch_number varchar(64),
  expiry_date date,
  status varchar(32) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Ward Stock (Inpatient medication supply)
CREATE TABLE IF NOT EXISTS ward_stock(
  stock_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  ward_id uuid REFERENCES tenants(id), -- Could be enhanced with wards table
  drug_id uuid NOT NULL REFERENCES drug_master(drug_id),
  batch_id uuid REFERENCES drug_batches(batch_id),
  quantity numeric NOT NULL,
  par_level numeric DEFAULT 100,
  reorder_point numeric DEFAULT 50,
  location varchar(64),
  last_count_date timestamptz,
  last_restock_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Patient Medication Allocations (for reserved medications)
CREATE TABLE IF NOT EXISTS patient_medication_allocations(
  allocation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  drug_id uuid NOT NULL REFERENCES drug_master(drug_id),
  batch_id uuid REFERENCES drug_batches(batch_id),
  quantity_allocated numeric NOT NULL,
  allocated_for varchar(64), -- surgery, discharge, specialty_meds, etc.
  allocated_by uuid REFERENCES users(id),
  allocation_date timestamptz DEFAULT now(),
  expiry_date timestamptz,
  status varchar(32) DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'returned', 'expired')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Pharmacy Alerts System
CREATE TABLE IF NOT EXISTS pharmacy_alerts(
  alert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  alert_type varchar(32) NOT NULL CHECK (alert_type IN ('low-stock', 'expiring', 'recall', 'interaction', 'allergy', 'overdue')),
  severity varchar(32) CHECK (severity IN ('critical', 'warning', 'info')),
  drug_id uuid REFERENCES drug_master(drug_id),
  batch_id uuid REFERENCES drug_batches(batch_id),
  patient_id uuid REFERENCES patients(id),
  message text NOT NULL,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES users(id),
  acknowledged_datetime timestamptz,
  created_datetime timestamptz DEFAULT now(),
  expires_datetime timestamptz
);

-- Create indexes for pharmacy module
CREATE INDEX IF NOT EXISTS idx_drug_master_generic ON drug_master(generic_name);
CREATE INDEX IF NOT EXISTS idx_drug_master_rxnorm ON drug_master(rxnorm_code);
CREATE INDEX IF NOT EXISTS idx_prescription_items_drug ON prescription_items(drug_id, status);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_patient ON medication_administrations(patient_id, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_drug_batches_expiry ON drug_batches(expiry_date, status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_batch ON pharmacy_inventory(batch_id, transaction_datetime);

COMMIT;

-- ============================================================
-- PART 3: SAMPLE PHARMACY DATA
-- ============================================================

BEGIN;

-- Common Medications (US Market)
INSERT INTO drug_master 
(tenant_id, generic_name, brand_names, strength, dosage_form, route,
 ndc_code, rxnorm_code, snomed_code, schedule_type, high_alert_flag, pregnancy_category)
VALUES
(NULL, 'Acetaminophen', ARRAY['Tylenol', 'Panadol'], '500mg', 'Tablet', 'Oral',
 '50580-496', '161', '323987006', 'OTC', false, 'B'),

(NULL, 'Ibuprofen', ARRAY['Advil', 'Motrin', 'Nuprin'], '400mg', 'Tablet', 'Oral',
 '00074-6631', '5640', '372552008', 'OTC', false, 'B'),

(NULL, 'Naproxen', ARRAY['Aleve', 'Naprosyn'], '250mg', 'Tablet', 'Oral',
 '50580-378', '7258', '372552008', 'OTC', false, 'B'),

(NULL, 'Amoxicillin', ARRAY['Amoxil', 'Trimox'], '500mg', 'Capsule', 'Oral',
 '00093-3137', '723', '372552008', 'Prescription', false, 'B'),

(NULL, 'Azithromycin', ARRAY['Zithromax', 'Z-Pak'], '250mg', 'Tablet', 'Oral',
 '00074-3473', '18631', '372552008', 'Prescription', false, 'B'),

(NULL, 'Ciprofloxacin', ARRAY['Cipro'], '500mg', 'Tablet', 'Oral',
 '00026-0750', '2551', '372552008', 'Prescription', false, 'C'),

(NULL, 'Lisinopril', ARRAY['Prinivil', 'Zestril'], '10mg', 'Tablet', 'Oral',
 '00071-0154', '29046', '372552008', 'Prescription', false, 'D'),

(NULL, 'Metoprolol', ARRAY['Lopressor', 'Toprol-XL'], '50mg', 'Tablet', 'Oral',
 '00078-0348', '6918', '372552008', 'Prescription', false, 'C'),

(NULL, 'Amlodipine', ARRAY['Norvasc'], '5mg', 'Tablet', 'Oral',
 '00069-1530', '17767', '372552008', 'Prescription', false, 'C'),

(NULL, 'Metformin', ARRAY['Glucophage'], '500mg', 'Tablet', 'Oral',
 '00087-6060', '6809', '372552008', 'Prescription', false, 'B'),

(NULL, 'Insulin Glargine', ARRAY['Lantus', 'Basaglar'], '100 units/mL', 'Solution', 'Subcutaneous',
 '00088-2220', '261551', '372724001', 'Prescription', true, 'B'),

(NULL, 'Albuterol', ARRAY['Ventolin', 'ProAir'], '90mcg/actuation', 'Inhalation Aerosol', 'Inhalation',
 '00085-1193', '435', '372552008', 'Prescription', false, 'C'),

(NULL, 'Fluticasone', ARRAY['Flovent'], '110mcg/actuation', 'Inhalation Aerosol', 'Inhalation',
 '00173-0722', '41126', '372552008', 'Prescription', false, 'C'),

(NULL, 'Sertraline', ARRAY['Zoloft'], '50mg', 'Tablet', 'Oral',
 '00049-4960', '36437', '372552008', 'Prescription', false, 'C'),

(NULL, 'Alprazolam', ARRAY['Xanax'], '0.5mg', 'Tablet', 'Oral',
 '00009-0029', '596', '372552008', 'Controlled-IV', true, 'D'),

(NULL, 'Zolpidem', ARRAY['Ambien'], '10mg', 'Tablet', 'Oral',
 '00024-5421', '39993', '372552008', 'Controlled-IV', true, 'B'),

(NULL, 'Omeprazole', ARRAY['Prilosec'], '20mg', 'Delayed-release Capsule', 'Oral',
 '00037-0172', '7646', '372552008', 'OTC', false, 'C'),

(NULL, 'Pantoprazole', ARRAY['Protonix'], '40mg', 'Delayed-release Tablet', 'Oral',
 '00008-0841', '40790', '372552008', 'Prescription', false, 'B'),

(NULL, 'Warfarin', ARRAY['Coumadin'], '5mg', 'Tablet', 'Oral',
 '00056-0173', '11289', '372552008', 'Prescription', true, 'X'),

(NULL, 'Heparin', ARRAY[]::text[], '5000 units/mL', 'Solution', 'Intravenous',
 '00074-6586', '5093', '372552008', 'Prescription', true, 'C'),

(NULL, 'Enoxaparin', ARRAY['Lovenox'], '40mg/0.4mL', 'Solution', 'Subcutaneous',
 '00075-0632', '40178', '372552008', 'Prescription', true, 'B'),

(NULL, 'Hydrocodone/Acetaminophen', ARRAY['Vicodin', 'Norco'], '5mg/325mg', 'Tablet', 'Oral',
 '00074-6628', '197923', '372552008', 'Controlled-II', true, 'C'),

(NULL, 'Oxycodone', ARRAY['OxyContin', 'Roxicodone'], '10mg', 'Tablet', 'Oral',
 '00074-6616', '7804', '372552008', 'Controlled-II', true, 'B'),

(NULL, 'Tramadol', ARRAY['Ultram'], '50mg', 'Tablet', 'Oral',
 '00045-0315', '10689', '372552008', 'Controlled-IV', true, 'C'),

(NULL, 'Hydrocortisone', ARRAY['Cortaid'], '1%', 'Cream', 'Topical',
 '00045-0462', '5514', '372552008', 'OTC', false, 'C'),

(NULL, 'Triamcinolone', ARRAY['Kenalog'], '0.1%', 'Cream', 'Topical',
 '00008-0630', '10753', '372552008', 'Prescription', false, 'C');

-- Drug Interactions
INSERT INTO drug_interactions
(drug_a, drug_b, severity, description, mechanism, management)
SELECT 
  da.drug_id, db.drug_id, 'major',
  'Increased risk of bleeding when warfarin is combined with NSAIDs',
  'NSAIDs inhibit platelet aggregation and may damage GI mucosa, potentiating warfarin anticoagulation',
  'Monitor INR closely. Consider alternative analgesic. Educate patient on bleeding signs.'
FROM drug_master da, drug_master db
WHERE da.generic_name = 'Warfarin' AND db.generic_name IN ('Ibuprofen', 'Naproxen');

INSERT INTO drug_interactions
(drug_a, drug_b, severity, description, mechanism, management)
SELECT 
  da.drug_id, db.drug_id, 'major',
  'Increased risk of hypoglycemia when insulin is combined with beta-blockers',
  'Beta-blockers may mask hypoglycemia symptoms and prolong insulin effect',
  'Monitor blood glucose closely. Adjust insulin dose as needed.'
FROM drug_master da, drug_master db
WHERE da.generic_name = 'Insulin Glargine' AND db.generic_name = 'Metoprolol';

-- Sample Drug Batches
INSERT INTO drug_batches
(drug_id, batch_number, quantity_received, quantity_remaining, expiry_date, purchase_price, location, status)
SELECT 
  dm.drug_id, 
  'BATCH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || ROW_NUMBER() OVER (PARTITION BY dm.drug_id)::text,
  100,
  FLOOR(RANDOM() * 80 + 20)::numeric,
  CURRENT_DATE + INTERVAL '6 months' + (RANDOM() * INTERVAL '12 months'),
  ROUND((RANDOM() * 50 +5)::numeric, 2),
  CASE FLOOR(RANDOM() * 3)::int
    WHEN 0 THEN 'Shelf A-1'
    WHEN 1 THEN 'Shelf B-2'
    WHEN 2 THEN 'Refrigerator R-1'
  END,
  'active'
FROM drug_master dm
WHERE dm.status = 'active'
LIMIT 50;

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Show what was created
SELECT '✅ Drugs Loaded' as status, COUNT(*) as count FROM drug_master
UNION ALL
SELECT '✅ Interactions Created', COUNT(*) FROM drug_interactions
UNION ALL
SELECT '✅ Batches Created', COUNT(*) FROM drug_batches
UNION ALL
SELECT '✅ Clinical Tables Ready', COUNT(DISTINCT table_name) 
FROM information_schema.tables 
WHERE table_schema = 'emr' 
AND table_name IN ('conditions', 'procedures', 'observations', 'diagnostic_reports', 'service_requests');

-- Show sample drugs
SELECT generic_name, brand_names[1] as brand_name, dosage_form, schedule_type
FROM drug_master
WHERE tenant_id IS NULL
ORDER BY generic_name
LIMIT 10;
