-- ============================================================
-- MedFlow EMR- Pharmacy Module Tables
-- Run this SECOND in Neon SQL Editor (after 01_fhir_tables.sql)
-- ============================================================

BEGIN;

-- Drug Master with comprehensive medication metadata
CREATE TABLE IF NOT EXISTS emr.drug_master(
  drug_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES emr.tenants(id),
  generic_name text NOT NULL,
  brand_names text[] DEFAULT '{}',
  strength text,
  dosage_form varchar(64),
  route varchar(64),
  manufacturer text,
  ndc_code varchar(32),
  rxnorm_code varchar(32),
  snomed_code varchar(64),
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
CREATE TABLE IF NOT EXISTS emr.drug_interactions(
  interaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  drug_b uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  severity varchar(32) NOT NULL CHECK (severity IN ('contraindicated', 'major', 'moderate', 'minor')),
  description text NOT NULL,
  mechanism text,
  management text,
  evidence_level varchar(16),
  created_at timestamptz DEFAULT now()
);

-- Patient Drug Allergies
CREATE TABLE IF NOT EXISTS emr.drug_allergies(
  allergy_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  patient_id uuid NOT NULL REFERENCES emr.patients(id),
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  reaction_severity varchar(32) CHECK (reaction_severity IN ('mild', 'moderate', 'severe', 'life-threatening', 'anaphylaxis')),
  reaction_description text,
  criticality varchar(16) CHECK (criticality IN ('low', 'high', 'unable-to-assess')),
  verification_status varchar(32) CHECK (verification_status IN ('unconfirmed', 'provisional', 'confirmed', 'refuted', 'entered-in-error')),
  first_occurrence date,
  recorded_date timestamptz DEFAULT now(),
  recorded_by uuid REFERENCES emr.users(id),
  created_at timestamptz DEFAULT now()
);

-- Prescription Items
CREATE TABLE IF NOT EXISTS emr.prescription_items(
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES emr.prescriptions(id) ON DELETE CASCADE,
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  sequence integer NOT NULL,
  dose numeric NOT NULL,
  dose_unit varchar(64) NOT NULL,
  frequency varchar(64) NOT NULL,
  route varchar(64),
  administration_timing varchar(64),
  duration_days integer,
  quantity_prescribed numeric NOT NULL,
  quantity_dispensed numeric,
  instructions text,
  sig_code varchar(255),
  refills_allowed integer DEFAULT 0,
  days_supply integer DEFAULT 30,
  substitution_allowed boolean DEFAULT true,
  dispense_as_written_flag boolean DEFAULT false,
  status varchar(32) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'on-hold', 'expired')),
  prescribed_date timestamptz DEFAULT now(),
  dispensed_date timestamptz,
  last_fill_date timestamptz,
  next_fill_date timestamptz,
  dispensed_by uuid REFERENCES emr.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medication Administration Record (MAR)
CREATE TABLE IF NOT EXISTS emr.medication_administrations(
  administration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  patient_id uuid NOT NULL REFERENCES emr.patients(id),
  encounter_id uuid REFERENCES emr.encounters(id),
  prescription_item_id uuid REFERENCES emr.prescription_items(item_id),
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  scheduled_datetime timestamptz NOT NULL,
  administered_datetime timestamptz,
  dose_administered numeric,
  dose_unit varchar(64),
  route varchar(64),
  site varchar(255),
  administered_by uuid REFERENCES emr.users(id),
  verified_by uuid REFERENCES emr.users(id),
  status varchar(32) NOT NULL CHECK (status IN ('scheduled', 'administered', 'missed', 'held', 'refused', 'not-applicable')),
  hold_reason varchar(255),
  refusal_reason varchar(255),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medication Schedules
CREATE TABLE IF NOT EXISTS emr.medication_schedules(
  schedule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  patient_id uuid NOT NULL REFERENCES emr.patients(id),
  encounter_id uuid REFERENCES emr.encounters(id),
  prescription_item_id uuid REFERENCES emr.prescription_items(item_id),
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id),
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

-- Drug Batches/Lots
CREATE TABLE IF NOT EXISTS emr.drug_batches(
  batch_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  batch_number varchar(64) NOT NULL,
  serial_number varchar(64),
  quantity_received numeric NOT NULL,
  quantity_remaining numeric NOT NULL,
  quantity_dispensed numeric DEFAULT 0,
  unit_cost numeric(12,2),
  purchase_price numeric(12,2),
  expiry_date date NOT NULL,
  manufacturing_date date,
  received_date timestamptz DEFAULT now(),
  supplier varchar(255),
  location varchar(64),
  status varchar(32) DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'recalled', 'expired', 'depleted')),
  recall_notice text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pharmacy Inventory Transactions
CREATE TABLE IF NOT EXISTS emr.pharmacy_inventory(
  transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  batch_id uuid NOT NULL REFERENCES emr.drug_batches(batch_id),
  transaction_type varchar(32) NOT NULL CHECK (transaction_type IN ('receive', 'dispense', 'adjustment', 'return', 'transfer', 'discard', 'expire')),
  quantity_change numeric NOT NULL,
  quantity_balance numeric,
  reference_type varchar(32),
  reference_id uuid,
  performed_by uuid REFERENCES emr.users(id),
  notes text,
  transaction_datetime timestamptz DEFAULT now()
);

-- Vendors/Suppliers
CREATE TABLE IF NOT EXISTS emr.vendors(
  vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES emr.tenants(id),
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

-- Purchase Orders
CREATE TABLE IF NOT EXISTS emr.purchase_orders(
  order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  vendor_id uuid NOT NULL REFERENCES emr.vendors(vendor_id),
  order_number varchar(64) UNIQUE NOT NULL,
  order_date timestamptz DEFAULT now(),
  expected_delivery_date date,
  actual_delivery_date date,
  status varchar(32) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shipped', 'received', 'cancelled', 'closed')),
  total_amount numeric(12,2),
  notes text,
  ordered_by uuid REFERENCES emr.users(id),
  approved_by uuid REFERENCES emr.users(id),
  received_by uuid REFERENCES emr.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS emr.purchase_order_items(
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES emr.purchase_orders(order_id) ON DELETE CASCADE,
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  quantity_ordered numeric NOT NULL,
  quantity_received numeric,
  unit_price numeric(10,2),
  total_price numeric(10,2),
  batch_number varchar(64),
  expiry_date date,
  status varchar(32) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Ward Stock
CREATE TABLE IF NOT EXISTS emr.ward_stock(
  stock_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  ward_id uuid REFERENCES emr.tenants(id),
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  batch_id uuid REFERENCES emr.drug_batches(batch_id),
  quantity numeric NOT NULL,
  par_level numeric DEFAULT 100,
  reorder_point numeric DEFAULT 50,
  location varchar(64),
  last_count_date timestamptz,
  last_restock_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Patient Medication Allocations
CREATE TABLE IF NOT EXISTS emr.patient_medication_allocations(
  allocation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  patient_id uuid NOT NULL REFERENCES emr.patients(id),
  drug_id uuid NOT NULL REFERENCES emr.drug_master(drug_id),
  batch_id uuid REFERENCES emr.drug_batches(batch_id),
  quantity_allocated numeric NOT NULL,
  allocated_for varchar(64),
  allocated_by uuid REFERENCES emr.users(id),
  allocation_date timestamptz DEFAULT now(),
  expiry_date timestamptz,
  status varchar(32) DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'returned', 'expired')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Pharmacy Alerts
CREATE TABLE IF NOT EXISTS emr.pharmacy_alerts(
  alert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
  alert_type varchar(32) NOT NULL CHECK (alert_type IN ('low-stock', 'expiring', 'recall', 'interaction', 'allergy', 'overdue')),
  severity varchar(32) CHECK (severity IN ('critical', 'warning', 'info')),
  drug_id uuid REFERENCES emr.drug_master(drug_id),
  batch_id uuid REFERENCES emr.drug_batches(batch_id),
  patient_id uuid REFERENCES emr.patients(id),
  message text NOT NULL,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES emr.users(id),
  acknowledged_datetime timestamptz,
  created_datetime timestamptz DEFAULT now(),
  expires_datetime timestamptz
);

-- Create indexes for pharmacy module
CREATE INDEX IF NOT EXISTS idx_drug_master_generic ON emr.drug_master(generic_name);
CREATE INDEX IF NOT EXISTS idx_drug_master_rxnorm ON emr.drug_master(rxnorm_code);
CREATE INDEX IF NOT EXISTS idx_prescription_items_drug ON emr.prescription_items(drug_id, status);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_patient ON emr.medication_administrations(patient_id, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_drug_batches_expiry ON emr.drug_batches(expiry_date, status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_batch ON emr.pharmacy_inventory(batch_id, transaction_datetime);

COMMIT;

-- Verify creation
SELECT '✅ Pharmacy Tables Created' as status, COUNT(DISTINCT table_name) as count 
FROM information_schema.tables 
WHERE table_schema = 'emr' 
AND table_name LIKE 'drug%' OR table_name LIKE '%prescription%' OR table_name LIKE '%medication%' OR table_name LIKE '%pharmacy%';
