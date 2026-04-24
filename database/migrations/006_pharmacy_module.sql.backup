-- Pharmacy Module - Complete HL7/FHIR Compliant Implementation
-- PostgreSQL 14+
-- Supports: MedicationRequest, MedicationDispense, MedicationAdministration

BEGIN;

-- =====================================================
-- DRUG MASTER TABLE (FHIR Medication Resource)
-- Central drug catalog with SNOMED/RxNorm coding
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.drug_master(
  drug_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES emr.tenants(id) ON DELETE CASCADE,
  generic_name text NOT NULL,
  brand_names jsonb[] DEFAULT '{}',
  strength text,
  dosage_form varchar(64), -- tablet/capsule/injection/cream/etc
  route varchar(64), -- oral/IV/IM/subcutaneous/etc
  manufacturer text,
  drug_class text,
  ndc_code varchar(32), -- National Drug Code
  rxnorm_code varchar(32), -- RxNorm CUI
  snomed_code varchar(64), -- SNOMED CT code
  barcode varchar(128),
  schedule_type varchar(16) CHECK (schedule_type IN ('OTC', 'Prescription', 'Controlled-II', 'Controlled-III', 'Controlled-IV', 'Controlled-V')),
  storage_conditions text,
  reorder_threshold numeric(10,2) DEFAULT 0,
  high_alert_flag boolean DEFAULT false,
  look_alike_sound_alike_flag boolean DEFAULT false,
  pregnancy_category varchar(8) CHECK (pregnancy_category IN ('A', 'B', 'C', 'D', 'X', 'N')),
  controlled_substance_act_schedule varchar(16),
  therapeutic_class varchar(64),
  pharmacological_class varchar(64),
  mechanism_of_action text,
  indication text,
  contraindications text,
  warnings text,
  adverse_reactions text[],
  drug_interactions text[],
  renal_adjustment_required boolean DEFAULT false,
  hepatic_adjustment_required boolean DEFAULT false,
  pediatric_safe boolean DEFAULT true,
  geriatric_caution boolean DEFAULT false,
  black_box_warning boolean DEFAULT false,
  REMS_required boolean DEFAULT false,
  biosimilar boolean DEFAULT false,
  narrow_therapeutic_index boolean DEFAULT false,
  refrigeration_required boolean DEFAULT false,
  light_sensitive boolean DEFAULT false,
  fhir_medication_ref uuid,
  status varchar(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued', 'recalled')),
  recall_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, drug_id)
);

-- Indexes
CREATE INDEX idx_drug_master_tenant ON emr.drug_master(tenant_id);
CREATE INDEX idx_drug_master_generic ON emr.drug_master(generic_name);
CREATE INDEX idx_drug_master_rxnorm ON emr.drug_master(rxnorm_code);
CREATE INDEX idx_drug_master_ndc ON emr.drug_master(ndc_code);
CREATE INDEX idx_drug_master_snomed ON emr.drug_master(snomed_code);
CREATE INDEX idx_drug_master_high_alert ON emr.drug_master(high_alert_flag) WHERE high_alert_flag = true;

-- =====================================================
-- DRUG INTERACTIONS TABLE
-- Drug-drug, drug-allergy, drug-food interactions
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.drug_interactions(
  interaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a uuid NOT NULL REFERENCES emr.drug_master(drug_id) ON DELETE CASCADE,
  drug_b uuid NOT NULL REFERENCES emr.drug_master(drug_id) ON DELETE CASCADE,
  severity varchar(16) NOT NULL CHECK (severity IN ('contraindicated', 'major', 'moderate', 'minor', 'unknown')),
  description text NOT NULL,
  mechanism text,
  management text,
  clinical_effects text,
  onset_time varchar(64),
  risk_factors text[],
  monitoring_parameters text[],
  patient_management text[],
  discussion_references text[],
  fhir_interaction_ref jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (drug_a, drug_b)
);

-- Indexes
CREATE INDEX idx_drug_interactions_drug_a ON emr.drug_interactions(drug_a);
CREATE INDEX idx_drug_interactions_drug_b ON emr.drug_interactions(drug_b);
CREATE INDEX idx_drug_interactions_severity ON emr.drug_interactions(severity);

-- =====================================================
-- DRUG ALLERGIES TABLE (Patient-specific)
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.drug_allergies (
  allergy_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  drug_id uuid REFERENCES emr.drug_master(drug_id) ON DELETE SET NULL,
  allergen_type varchar(32) DEFAULT 'drug' CHECK (allergen_type IN ('drug', 'food', 'environmental', 'latex', 'other')),
  substance_text text, -- For non-coded allergens
  reaction_severity varchar(16) CHECK (reaction_severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
  reaction_description text,
  reaction_manifestation text[],
  onset_date date,
  recorded_date timestamptz DEFAULT now(),
  verified boolean DEFAULT false,
  verification_status varchar(32) DEFAULT 'unconfirmed' CHECK (verification_status IN ('unconfirmed', 'confirmed', 'refuted', 'entered-in-error')),
  criticality varchar(16) CHECK (criticality IN ('low', 'high', 'unable-to-assess')),
  type varchar(16) CHECK (type IN ('allergy', 'intolerance')),
  category varchar(32)[],
  note text,
  last_occurrence_date date,
  fhir_allergy_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, allergy_id)
);

-- Indexes
CREATE INDEX idx_drug_allergies_patient ON emr.drug_allergies(patient_id);
CREATE INDEX idx_drug_allergies_drug ON emr.drug_allergies(drug_id);
CREATE INDEX idx_drug_allergies_severity ON emr.drug_allergies(reaction_severity);

-- =====================================================
-- PRESCRIPTION ITEMS TABLE (Line items for prescriptions)
-- FHIR MedicationRequest.dosageInstruction
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.prescription_items (
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES emr.prescriptions(id) ON DELETE CASCADE,
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id) ON DELETE RESTRICT,
  sequence integer NOT NULL,
  dose text,
  dose_unit varchar(32),
  frequency text, -- BID/TID/QID/Q6H/etc
  frequency_period varchar(32),
  route varchar(64),
  administration_timing varchar(64), -- before_meals/with_food/at_bedtime/etc
  duration_days integer,
  quantity_prescribed numeric(10,2),
  quantity_dispensed numeric(10,2),
  instructions text, -- Patient-facing SIG
  sig_code varchar(32), -- Standard SIG codes
  refills_allowed integer DEFAULT 0,
  refills_remaining integer DEFAULT 0,
  days_supply integer,
  status varchar(32) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'on-hold', 'discontinued')),
  dispense_as_written boolean DEFAULT false,
  substitution_allowed boolean DEFAULT true,
  prior_authorization_required boolean DEFAULT false,
  compound_indicator boolean DEFAULT false,
  expected_cost numeric(12,2),
  actual_cost numeric(12,2),
  insurance_coverage_amount numeric(12,2),
  patient_pay_amount numeric(12,2),
  pharmacy_npi varchar(32), -- NPI of dispensing pharmacy
  dispensed_quantity numeric(10,2),
  dispensed_date timestamptz,
  dispensed_by uuid REFERENCES emr.users(id),
  fhir_item_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_prescription_items_prescription ON emr.prescription_items(prescription_id);
CREATE INDEX idx_prescription_items_drug ON emr.prescription_items(drug_id);
CREATE INDEX idx_prescription_items_status ON emr.prescription_items(status);

-- =====================================================
-- MEDICATION ADMINISTRATION RECORD (MAR) TABLE
-- FHIR MedicationAdministration Resource
-- Nurse medication administration for inpatients
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.medication_administrations(
  administration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  prescription_item_id uuid REFERENCES emr.prescription_items(item_id) ON DELETE SET NULL,
  status varchar(32) NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'not-done', 'completed', 'entered-in-error', 'stopped', 'unknown')),
  category varchar(32) DEFAULT 'inpatient' CHECK (category IN ('inpatient', 'outpatient', 'community', 'discharge')),
  medication_id uuid REFERENCES emr.drug_master(drug_id) ON DELETE SET NULL,
  medication_text text, -- For non-coded medications
  dose_given numeric(10,2),
  dose_unit varchar(32),
  route varchar(64),
  method varchar(64), -- bolus/infusion/push/etc
  approach_site_code varchar(64),
  administration_datetime timestamptz NOT NULL,
  effective_datetime timestamptz,
  nurse_id uuid NOT NULL REFERENCES emr.users(id) ON DELETE RESTRICT,
  performer_role varchar(32), -- RN/LPN/UAP/etc
  witness_id uuid REFERENCES emr.users(id), -- For controlled substances
  device_id uuid, -- IV pump ID
  location_id uuid, -- Ward/room/bed
  reason_given_code varchar(64), -- If not administered
  reason_not_given_text text,
  subject_expected boolean, -- Was patient present
  additional_instruction text[],
  parent_administration_id uuid REFERENCES emr.medication_administrations(administration_id),
  part_of_plan_of_care_id uuid,
  event_history_ids uuid[],
  fhir_administration_ref uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, administration_id)
);

-- Indexes
CREATE INDEX idx_medication_administrations_patient ON emr.medication_administrations(patient_id);
CREATE INDEX idx_medication_administrations_encounter ON emr.medication_administrations(encounter_id);
CREATE INDEX idx_medication_administrations_status ON emr.medication_administrations(status);
CREATE INDEX idx_medication_administrations_datetime ON emr.medication_administrations(administration_datetime DESC);

-- =====================================================
-- MEDICATION SCHEDULES TABLE
-- Scheduled doses for inpatient medications
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.medication_schedules (
  schedule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  prescription_item_id uuid NOT NULL REFERENCES emr.prescription_items(item_id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  scheduled_time timestamptz NOT NULL,
  scheduled_dose numeric(10,2),
  scheduled_unit varchar(32),
  status varchar(32) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'administered', 'delayed', 'missed', 'refused', 'held', 'not-indicated')),
  ward_id uuid,
  bed_number varchar(16),
  nurse_assigned_id uuid REFERENCES emr.users(id),
  administration_id uuid REFERENCES emr.medication_administrations(administration_id) ON DELETE SET NULL,
  hold_reason text,
  hold_order_id uuid,
  priority_override varchar(32),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_medication_schedules_patient ON emr.medication_schedules(patient_id);
CREATE INDEX idx_medication_schedules_time ON emr.medication_schedules(scheduled_time);
CREATE INDEX idx_medication_schedules_status ON emr.medication_schedules(status);
CREATE INDEX idx_medication_schedules_ward ON emr.medication_schedules(ward_id);

-- =====================================================
-- DRUG BATCHES TABLE (Inventory lots with expiry)
-- FHIR Medication.batch + Lot number + Expiry
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.drug_batches (
  batch_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id) ON DELETE CASCADE,
  batch_number varchar(64) NOT NULL,
  lot_number varchar(64),
  quantity_received numeric(10,2) NOT NULL DEFAULT 0,
  quantity_remaining numeric(10,2) NOT NULL DEFAULT 0,
  quantity_quarantined numeric(10,2) DEFAULT 0,
  quantity_damaged numeric(10,2) DEFAULT 0,
  expiry_date date NOT NULL,
  manufacturing_date date,
  purchase_price numeric(12,2),
  selling_price numeric(12,2),
  vendor_id uuid REFERENCES emr.vendors(vendor_id) ON DELETE SET NULL,
  location varchar(64), -- Shelf/bin location
  status varchar(32) DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'expired', 'recalled', 'depleted')),
  received_date timestamptz DEFAULT now(),
  received_by uuid REFERENCES emr.users(id),
  quarantine_reason text,
  recall_notice_id uuid,
  certificate_of_analysis_url text,
  temperature_log jsonb, -- For refrigerated items
  fhir_lot_ref jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, batch_id),
  UNIQUE (tenant_id, drug_id, batch_number)
);

-- Indexes
CREATE INDEX idx_drug_batches_drug ON emr.drug_batches(drug_id);
CREATE INDEX idx_drug_batches_expiry ON emr.drug_batches(expiry_date);
CREATE INDEX idx_drug_batches_status ON emr.drug_batches(status);
CREATE INDEX idx_drug_batches_location ON emr.drug_batches(location);

-- =====================================================
-- PHARMACY INVENTORY LEDGER TABLE
-- Track all stock movements (receipts, dispenses, adjustments)
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.pharmacy_inventory (
  inventory_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES emr.drug_batches(batch_id) ON DELETE CASCADE,
  transaction_type varchar(32) NOT NULL CHECK (transaction_type IN ('receipt', 'dispense', 'adjustment', 'transfer', 'return', 'damage', 'theft', 'expiry')),
  quantity_change numeric(10,2) NOT NULL,
  quantity_balance numeric(10,2) NOT NULL,
  reference_type varchar(32), -- prescription/ward_transfer/purchase_order/adjustment
  reference_id uuid, -- prescription_item_id/purchase_order_id/ etc
  performed_by uuid NOT NULL REFERENCES emr.users(id) ON DELETE RESTRICT,
  notes text,
  adjustment_reason varchar(64),
  cost_impact numeric(12,2),
  fhir_supply_ref uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, inventory_id)
);

-- Indexes
CREATE INDEX idx_pharmacy_inventory_batch ON emr.pharmacy_inventory(batch_id);
CREATE INDEX idx_pharmacy_inventory_transaction ON emr.pharmacy_inventory(transaction_type);
CREATE INDEX idx_pharmacy_inventory_created ON emr.pharmacy_inventory(created_at DESC);

-- =====================================================
-- STOCK MOVEMENTS TABLE (Inter-location transfers)
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.stock_movements (
  movement_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES emr.drug_batches(batch_id) ON DELETE CASCADE,
  from_location varchar(64), -- Main pharmacy/ward Pyxis/satellite
  to_location varchar(64),
  quantity numeric(10,2) NOT NULL,
  movement_type varchar(32) NOT NULL CHECK (movement_type IN ('transfer', 'return', 'recall', 'relocation')),
  reason text,
  transferred_by uuid REFERENCES emr.users(id),
  received_by uuid REFERENCES emr.users(id),
  transfer_document_id varchar(64),
  fhir_movement_ref uuid,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_stock_movements_batch ON emr.stock_movements(batch_id);
CREATE INDEX idx_stock_movements_from ON emr.stock_movements(from_location);
CREATE INDEX idx_stock_movements_to ON emr.stock_movements(to_location);

-- =====================================================
-- VENDORS TABLE (Pharmaceutical suppliers)
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.vendors(
  vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES emr.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  vendor_code varchar(64) NOT NULL,
  contact_person text,
  email text,
  phone varchar(32),
  fax varchar(32),
  mobile varchar(32),
  address text,
  city text,
  state varchar(64),
  zip_code varchar(16),
  country varchar(64) DEFAULT 'USA',
  license_number varchar(64),
  DEA_number varchar(64), -- For controlled substance distributors
  NPI varchar(32), -- National Provider Identifier
  tax_id varchar(32),
  payment_terms varchar(64), -- Net 30/Net 60/COD/etc
  credit_limit numeric(12,2),
  drug_supply_list uuid[], -- Drugs this vendor supplies
  preferred_vendor boolean DEFAULT false,
  active boolean DEFAULT true,
  rating numeric(3,2) DEFAULT 5.0,
  delivery_lead_time_days integer DEFAULT 3,
  minimum_order_value numeric(12,2),
  shipping_method varchar(64),
  return_policy text,
  quality_certifications text[], -- GMP/FDA-registered/etc
  fhir_organization_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, vendor_id),
  UNIQUE (tenant_id, vendor_code)
);

-- Indexes
CREATE INDEX idx_vendors_tenant ON emr.vendors(tenant_id);
CREATE INDEX idx_vendors_preferred ON emr.vendors(preferred_vendor) WHERE preferred_vendor = true;
CREATE INDEX idx_vendors_active ON emr.vendors(active) WHERE active = true;

-- =====================================================
-- PURCHASE ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.purchase_orders(
  po_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES emr.vendors(vendor_id) ON DELETE RESTRICT,
  po_number varchar(64) NOT NULL UNIQUE,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery date,
  actual_delivery date,
  status varchar(32) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged', 'partially_received', 'received', 'cancelled')),
  total_amount numeric(12,2) DEFAULT 0,
  freight_charges numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  grand_total numeric(12,2) DEFAULT 0,
  payment_status varchar(32) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  ordered_by uuid REFERENCES emr.users(id),
  approved_by uuid REFERENCES emr.users(id),
  approved_date timestamptz,
  receiving_warehouse varchar(64),
  shipping_address text,
  special_instructions text,
  carrier_tracking_number varchar(128),
  carrier_name varchar(64),
  fhir_supply_request_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, po_id)
);

-- Indexes
CREATE INDEX idx_purchase_orders_tenant ON emr.purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_vendor ON emr.purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_status ON emr.purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON emr.purchase_orders(order_date DESC);

-- =====================================================
-- PURCHASE ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.purchase_order_items (
  po_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES emr.purchase_orders(po_id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id) ON DELETE RESTRICT,
  quantity_ordered numeric(10,2) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  amount numeric(12,2) NOT NULL,
  quantity_received numeric(10,2) DEFAULT 0,
  quantity_rejected numeric(10,2) DEFAULT 0,
  batch_number varchar(64),
  expiry_date date,
  ndc_received varchar(32),
  rejection_reason text,
  fhir_item_ref uuid,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_purchase_order_items_po ON emr.purchase_order_items(po_id);
CREATE INDEX idx_purchase_order_items_drug ON emr.purchase_order_items(drug_id);

-- =====================================================
-- WARD STOCK TABLE (Inpatient ward-level medication supply)
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.ward_stock (
  ward_stock_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  ward_id uuid NOT NULL, -- Nursing unit/ward
  ward_name varchar(64),
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id) ON DELETE CASCADE,
  batch_id uuid REFERENCES emr.drug_batches(batch_id) ON DELETE SET NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0,
  par_level numeric(10,2), -- Minimum stock level
  reorder_point numeric(10,2),
  location varchar(64), -- Pyxis cabinet/shelf/bin
  last_counted timestamptz,
  counted_by uuid REFERENCES emr.users(id),
  requires_refrigeration boolean DEFAULT false,
  temperature_min numeric(5,2),
  temperature_max numeric(5,2),
  current_temperature numeric(5,2),
  last_temperature_check timestamptz,
  controlled_substance_inventory_required boolean DEFAULT false,
  last_controlled_substance_count timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, ward_id, drug_id)
);

-- Indexes
CREATE INDEX idx_ward_stock_ward ON emr.ward_stock(ward_id);
CREATE INDEX idx_ward_stock_drug ON emr.ward_stock(drug_id);
CREATE INDEX idx_ward_stock_location ON emr.ward_stock(location);

-- =====================================================
-- PATIENT MEDICATION ALLOCATIONS TABLE
-- Track medications allocated to specific patients
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.patient_medication_allocations (
  allocation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id) ON DELETE RESTRICT,
  batch_id uuid REFERENCES emr.drug_batches(batch_id) ON DELETE SET NULL,
  allocated_quantity numeric(10,2) NOT NULL,
  dispensed_quantity numeric(10,2) DEFAULT 0,
  returned_quantity numeric(10,2) DEFAULT 0,
  status varchar(32) DEFAULT 'allocated' CHECK (status IN ('allocated', 'dispensed', 'returned', 'wasted', 'lost')),
  allocated_date timestamptz DEFAULT now(),
  allocated_by uuid REFERENCES emr.users(id),
  dispensed_date timestamptz,
  dispensed_by uuid REFERENCES emr.users(id),
  returned_date timestamptz,
  returned_by uuid REFERENCES emr.users(id),
  return_reason text,
  waste_witness_id uuid REFERENCES emr.users(id), -- For controlled substance waste
  waste_quantity numeric(10,2),
  waste_reason text,
  charge_capture_status varchar(32) DEFAULT 'pending' CHECK (charge_capture_status IN ('pending', 'captured', 'failed')),
  invoice_item_id uuid,
  notes text,
  fhir_allocation_ref uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_patient_allocations_patient ON emr.patient_medication_allocations(patient_id);
CREATE INDEX idx_patient_allocations_drug ON emr.patient_medication_allocations(drug_id);
CREATE INDEX idx_patient_allocations_status ON emr.patient_medication_allocations(status);

-- =====================================================
-- PHARMACY ALERTS TABLE
-- Low stock, expiring stock, recalls, interactions
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.pharmacy_alerts (
  alert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  alert_type varchar(32) NOT NULL CHECK (alert_type IN ('low-stock', 'expiring-soon', 'expired', 'recalled', 'drug-interaction', 'allergy-alert', 'duplicate-therapy', 'high-alert-med', 'controlled-substance-due')),
  severity varchar(16) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title text NOT NULL,
  description text,
  related_entity_type varchar(32), -- drug/batch/prescription/patient
  related_entity_id uuid,
  drug_id uuid REFERENCES emr.drug_master(drug_id),
  patient_id uuid REFERENCES emr.patients(id),
  prescription_id uuid REFERENCES emr.prescriptions(id),
  batch_id uuid REFERENCES emr.drug_batches(batch_id),
  action_required text,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES emr.users(id),
  acknowledged_at timestamptz,
  expires_at timestamptz,
  fhir_flag_ref uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, alert_id)
);

-- Indexes
CREATE INDEX idx_pharmacy_alerts_tenant ON emr.pharmacy_alerts(tenant_id);
CREATE INDEX idx_pharmacy_alerts_type ON emr.pharmacy_alerts(alert_type);
CREATE INDEX idx_pharmacy_alerts_severity ON emr.pharmacy_alerts(severity);
CREATE INDEX idx_pharmacy_alerts_acknowledged ON emr.pharmacy_alerts(acknowledged) WHERE acknowledged = false;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
DROP TRIGGER IF EXISTS trg_drug_master_set_updated_at ON emr.drug_master;
CREATE TRIGGER trg_drug_master_set_updated_at BEFORE UPDATE ON emr.drug_master 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_drug_allergies_set_updated_at ON emr.drug_allergies;
CREATE TRIGGER trg_drug_allergies_set_updated_at BEFORE UPDATE ON emr.drug_allergies 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_prescription_items_set_updated_at ON emr.prescription_items;
CREATE TRIGGER trg_prescription_items_set_updated_at BEFORE UPDATE ON emr.prescription_items 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_medication_administrations_set_updated_at ON emr.medication_administrations;
CREATE TRIGGER trg_medication_administrations_set_updated_at BEFORE UPDATE ON emr.medication_administrations 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_medication_schedules_set_updated_at ON emr.medication_schedules;
CREATE TRIGGER trg_medication_schedules_set_updated_at BEFORE UPDATE ON emr.medication_schedules 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_drug_batches_set_updated_at ON emr.drug_batches;
CREATE TRIGGER trg_drug_batches_set_updated_at BEFORE UPDATE ON emr.drug_batches 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_vendors_set_updated_at ON emr.vendors;
CREATE TRIGGER trg_vendors_set_updated_at BEFORE UPDATE ON emr.vendors 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_purchase_orders_set_updated_at ON emr.purchase_orders;
CREATE TRIGGER trg_purchase_orders_set_updated_at BEFORE UPDATE ON emr.purchase_orders 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ward_stock_set_updated_at ON emr.ward_stock;
CREATE TRIGGER trg_ward_stock_set_updated_at BEFORE UPDATE ON emr.ward_stock 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_patient_medication_allocations_set_updated_at ON emr.patient_medication_allocations;
CREATE TRIGGER trg_patient_medication_allocations_set_updated_at BEFORE UPDATE ON emr.patient_medication_allocations 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

COMMIT;
