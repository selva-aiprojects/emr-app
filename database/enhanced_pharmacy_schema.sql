-- Enhanced Pharmacy Module Tables for Healthcare Standards
-- Compliance with Pharmacy Act, Drug Control, and Healthcare Standards

-- 1. Enhanced Pharmacy Inventory Table
CREATE TABLE IF NOT EXISTS pharmacy_inventory_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  drug_id uuid NOT NULL REFERENCES drug_master(id),
  batch_number varchar(50) NOT NULL,
  manufacturer varchar(200) NOT NULL,
  supplier_name varchar(200),
  supplier_license varchar(50),
  expiry_date date NOT NULL,
  manufacturing_date date,
  mrp decimal(10,2) NOT NULL, -- Maximum Retail Price
  purchase_rate decimal(10,2) NOT NULL,
  sale_rate decimal(10,2) NOT NULL,
  gst_percentage decimal(5,2) DEFAULT 0,
  hsn_code varchar(10), -- HSN/SAC Code for GST
  pack_size varchar(50), -- e.g., 10 tablets, 100ml bottle
  units_per_pack integer NOT NULL,
  current_stock integer NOT NULL DEFAULT 0,
  minimum_stock_level integer DEFAULT 10,
  maximum_stock_level integer DEFAULT 1000,
  reorder_level integer DEFAULT 20,
  storage_location varchar(100), -- Rack/Shelf location
  storage_conditions varchar(200), -- Temperature, humidity requirements
  schedule_category varchar(20) CHECK (schedule_category IN ('H1', 'H', 'H2', 'H3', 'X', 'OTC')),
  is_narcotic boolean DEFAULT false,
  is_psychotropic boolean DEFAULT false,
  is_antibiotic boolean DEFAULT false,
  requires_prescription boolean DEFAULT true,
  barcode varchar(100),
  qr_code varchar(200),
  status varchar(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED', 'RECALLED')),
  last_verified_date date,
  verified_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, drug_id, batch_number)
);

-- 2. Enhanced Prescriptions Table (Pharmacy Act Compliant)
CREATE TABLE IF NOT EXISTS prescriptions_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  prescription_number varchar(50) UNIQUE NOT NULL, -- Auto-generated
  patient_id uuid NOT NULL REFERENCES patients(id),
  encounter_id uuid REFERENCES encounters(id),
  doctor_id uuid NOT NULL REFERENCES users(id),
  doctor_registration varchar(50), -- Medical Council Registration
  prescription_date date NOT NULL,
  validity_days integer DEFAULT 30, -- Prescription validity period
  is_duplicate boolean DEFAULT false,
  original_prescription_id uuid REFERENCES prescriptions_enhanced(id),
  patient_weight_kg decimal(5,2),
  patient_age_years integer,
  patient_gender varchar(10),
  known_allergies text[],
  chronic_conditions text[],
  current_medications text[],
  diagnosis_icd10_codes text[],
  special_instructions text,
  doctor_digital_signature boolean DEFAULT false,
  status varchar(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'DUPLICATE')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Prescription Medicines Table (Detailed Drug Breakdown)
CREATE TABLE IF NOT EXISTS prescription_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions_enhanced(id) ON DELETE CASCADE,
  drug_id uuid NOT NULL REFERENCES drug_master(id),
  brand_name varchar(200),
  generic_name varchar(200) NOT NULL,
  dosage_form varchar(50) CHECK (dosage_form IN ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS', 'INHALER', 'PATCH', 'SUPPOSITORY')),
  strength varchar(50), -- e.g., 500mg, 10mg/5ml
  route_of_administration varchar(30) CHECK (route_of_administration IN ('ORAL', 'IV', 'IM', 'SC', 'TOPICAL', 'INHALATION', 'RECTAL', 'OPHTHALMIC', 'OTIC', 'NASAL')),
  dosage_instructions text NOT NULL, -- e.g., "1-0-1", "5ml TID"
  frequency varchar(100), -- e.g., "Three times daily", "Once daily"
  duration_days integer NOT NULL,
  total_quantity decimal(10,2) NOT NULL,
  quantity_unit varchar(20) CHECK (quantity_unit IN ('TABLETS', 'CAPSULES', 'ML', 'MG', 'G', 'UNITS', 'APPLICATIONS')),
  indication text, -- Reason for prescription
  special_instructions text,
  is_prn boolean DEFAULT false, -- As needed medication
  max_daily_dose varchar(50),
  warnings text[],
  contraindications text[],
  status varchar(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPENSED', 'PARTIALLY_DISPENSED', 'CANCELLED')),
  dispensed_quantity decimal(10,2) DEFAULT 0,
  dispensed_by uuid REFERENCES users(id),
  dispensed_date timestamptz,
  batch_number varchar(50),
  expiry_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Pharmacy Dispensing Log (Drug Control Compliance)
CREATE TABLE IF NOT EXISTS pharmacy_dispensing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dispensing_number varchar(50) UNIQUE NOT NULL,
  prescription_id uuid REFERENCES prescriptions_enhanced(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  dispenser_id uuid NOT NULL REFERENCES users(id),
  pharmacist_id uuid REFERENCES users(id), -- Verified by pharmacist
  dispensing_date timestamptz DEFAULT now(),
  total_items integer NOT NULL,
  total_amount decimal(12,2) NOT NULL,
  payment_mode varchar(30) CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'INSURANCE', 'CREDIT')),
  insurance_claim_id uuid REFERENCES insurance_claims(id),
  doctor_consultation_fee decimal(10,2) DEFAULT 0,
  service_charge decimal(10,2) DEFAULT 0,
  gst_amount decimal(10,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  net_amount decimal(12,2) NOT NULL,
  rounded_amount decimal(12,2) DEFAULT 0,
  patient_signature boolean DEFAULT false,
  pharmacist_signature boolean DEFAULT false,
  emergency_dispensing boolean DEFAULT false,
  emergency_reason text,
  status varchar(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'RETURNED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Dispensing Items Log (Detailed Breakdown)
CREATE TABLE IF NOT EXISTS pharmacy_dispensing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispensing_log_id uuid NOT NULL REFERENCES pharmacy_dispensing_log(id) ON DELETE CASCADE,
  prescription_medicine_id uuid REFERENCES prescription_medicines(id),
  drug_id uuid NOT NULL REFERENCES drug_master(id),
  batch_number varchar(50) NOT NULL,
  expiry_date date NOT NULL,
  quantity_dispensed decimal(10,2) NOT NULL,
  quantity_unit varchar(20) NOT NULL,
  mrp decimal(10,2) NOT NULL,
  sale_rate decimal(10,2) NOT NULL,
  discount_percentage decimal(5,2) DEFAULT 0,
  gst_percentage decimal(5,2) DEFAULT 0,
  total_amount decimal(12,2) NOT NULL,
  storage_location varchar(100),
  remarks text,
  created_at timestamptz DEFAULT now()
);

-- 6. Drug Interactions Database
CREATE TABLE IF NOT EXISTS drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_1_id uuid NOT NULL REFERENCES drug_master(id),
  drug_2_id uuid NOT NULL REFERENCES drug_master(id),
  interaction_severity varchar(20) CHECK (interaction_severity IN ('MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATED')),
  interaction_type varchar(50) CHECK (interaction_type IN ('PHARMACODYNAMIC', 'PHARMACOKINETIC', 'CHEMICAL', 'FOOD', 'ALCOHOL')),
  interaction_description text NOT NULL,
  clinical_effects text,
  management_recommendations text,
  evidence_level varchar(20) CHECK (evidence_level IN ('THEORETICAL', 'ANIMAL', 'HUMAN', 'ESTABLISHED')),
  references text[],
  status varchar(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(drug_1_id, drug_2_id)
);

-- 7. Pharmacy Stock Movement Log
CREATE TABLE IF NOT EXISTS pharmacy_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL REFERENCES pharmacy_inventory_enhanced(id),
  movement_type varchar(30) CHECK (movement_type IN ('PURCHASE', 'SALE', 'RETURN', 'EXPIRY', 'RECALL', 'ADJUSTMENT', 'TRANSFER')),
  movement_date timestamptz DEFAULT now(),
  quantity_before integer NOT NULL,
  quantity_change integer NOT NULL, -- Positive for addition, negative for reduction
  quantity_after integer NOT NULL,
  reference_number varchar(100), -- Purchase order, invoice number, etc.
  reference_type varchar(50), -- PURCHASE_ORDER, INVOICE, DISPENSING, etc.
  reason text,
  performed_by uuid REFERENCES users(id),
  authorized_by uuid REFERENCES users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 8. Pharmacy Audit Trail (Regulatory Compliance)
CREATE TABLE IF NOT EXISTS pharmacy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL, -- PRESCRIPTION, DISPENSING, INVENTORY, etc.
  entity_id uuid NOT NULL,
  action_type varchar(50) NOT NULL, -- CREATE, UPDATE, DELETE, DISPENSE, RETURN
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES users(id),
  user_name varchar(100),
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now(),
  regulatory_flag boolean DEFAULT false, -- For regulatory reporting
  remarks text
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_drug ON pharmacy_inventory_enhanced(drug_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON pharmacy_inventory_enhanced(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_batch ON pharmacy_inventory_enhanced(batch_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions_enhanced(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions_enhanced(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescription_medicines_drug ON prescription_medicines(drug_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_log_patient ON pharmacy_dispensing_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_log_date ON pharmacy_dispensing_log(dispensing_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory ON pharmacy_stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON pharmacy_stock_movements(movement_date);
