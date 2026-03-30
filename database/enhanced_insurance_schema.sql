-- Enhanced Insurance Module Tables for Healthcare Standards
-- Compliance with IRDAI, ICD-10, and Healthcare Standards

-- 1. Enhanced Insurance Providers Table
CREATE TABLE IF NOT EXISTS emr.insurance_providers_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  provider_code varchar(20) UNIQUE NOT NULL, -- TPA Provider Code
  provider_name varchar(200) NOT NULL,
  provider_type varchar(50) NOT NULL CHECK (provider_type IN ('TPA', 'INSURANCE', 'GOVT_SCHEME', 'CORPORATE')),
  irdai_license varchar(50), -- IRDAI License Number
  pan_number varchar(20), -- PAN for tax compliance
  gst_number varchar(30), -- GST Registration
  contact_person varchar(100),
  contact_email varchar(100),
  contact_phone varchar(20),
  address text,
  city varchar(100),
  state varchar(100),
  pincode varchar(10),
  status varchar(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  network_type varchar(20) DEFAULT 'CASHLESS' CHECK (network_type IN ('CASHLESS', 'REIMBURSEMENT', 'BOTH')),
  settlement_period_days integer DEFAULT 30,
  co_payment_percentage decimal(5,2) DEFAULT 0,
  deductible_amount decimal(10,2) DEFAULT 0,
  max_coverage_limit decimal(12,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Insurance Claims Table (IRDAI Compliant)
CREATE TABLE IF NOT EXISTS emr.insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  claim_number varchar(50) UNIQUE NOT NULL, -- Auto-generated
  patient_id uuid NOT NULL REFERENCES emr.patients(id),
  encounter_id uuid REFERENCES emr.encounters(id),
  provider_id uuid NOT NULL REFERENCES emr.insurance_providers_enhanced(id),
  policy_number varchar(100) NOT NULL,
  policy_holder_name varchar(200),
  relationship_to_patient varchar(50), -- Self, Spouse, Child, Parent
  claim_type varchar(30) NOT NULL CHECK (claim_type IN ('CASHLESS', 'REIMBURSEMENT')),
  claim_category varchar(30) NOT NULL CHECK (claim_category IN ('HOSPITALIZATION', 'PRE_AUTHORIZATION', 'POST_HOSPITALIZATION', 'DAY_CARE')),
  preauth_number varchar(50), -- For pre-authorization claims
  admission_date timestamptz,
  discharge_date timestamptz,
  diagnosis_icd10_codes text[], -- Array of ICD-10 codes
  procedure_icd10_codes text[], -- Array of procedure codes
  total_claimed_amount decimal(12,2) NOT NULL,
  total_approved_amount decimal(12,2) DEFAULT 0,
  total_settled_amount decimal(12,2) DEFAULT 0,
  patient_share_amount decimal(12,2) DEFAULT 0,
  tpa_share_amount decimal(12,2) DEFAULT 0,
  status varchar(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_PROCESS', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'SETTLED', 'CLOSED')),
  submission_date timestamptz,
  approval_date timestamptz,
  rejection_reason text,
  remarks text,
  supporting_documents text[], -- Array of document URLs
  created_by uuid REFERENCES emr.users(id),
  updated_by uuid REFERENCES emr.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Claim Line Items Table (Detailed Breakdown)
CREATE TABLE IF NOT EXISTS emr.insurance_claim_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES emr.insurance_claims(id) ON DELETE CASCADE,
  item_type varchar(30) NOT NULL CHECK (item_type IN ('ROOM_RENT', 'ICU_CHARGES', 'DOCTOR_FEES', 'NURSING_CHARGES', 'MEDICINES', 'INVESTIGATIONS', 'PROCEDURES', 'CONSUMABLES', 'OTHERS')),
  item_description varchar(500) NOT NULL,
  icd10_code varchar(10), -- Diagnosis/Procedure code
  quantity integer NOT NULL,
  unit_rate decimal(10,2) NOT NULL,
  total_amount decimal(12,2) NOT NULL,
  approved_quantity integer DEFAULT 0,
  approved_rate decimal(10,2) DEFAULT 0,
  approved_amount decimal(12,2) DEFAULT 0,
  status varchar(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_APPROVED')),
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Claim Settlement Table
CREATE TABLE IF NOT EXISTS emr.insurance_claim_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES emr.insurance_claims(id) ON DELETE CASCADE,
  settlement_number varchar(50) UNIQUE NOT NULL,
  settlement_date timestamptz NOT NULL,
  settlement_amount decimal(12,2) NOT NULL,
  settlement_mode varchar(30) CHECK (settlement_mode IN ('CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'CASH')),
  settlement_reference varchar(100),
  tpa_reference varchar(100),
  bank_account_number varchar(50),
  bank_name varchar(100),
  ifsc_code varchar(20),
  status varchar(20) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  remarks text,
  created_by uuid REFERENCES emr.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Pre-authorization Requests Table
CREATE TABLE IF NOT EXISTS emr.insurance_preauth_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  preauth_number varchar(50) UNIQUE NOT NULL,
  patient_id uuid NOT NULL REFERENCES emr.patients(id),
  provider_id uuid NOT NULL REFERENCES emr.insurance_providers_enhanced(id),
  policy_number varchar(100) NOT NULL,
  requested_amount decimal(12,2) NOT NULL,
  approved_amount decimal(12,2) DEFAULT 0,
  diagnosis_summary text,
  proposed_treatment text,
  estimated_admission_date timestamptz,
  estimated_discharge_date timestamptz,
  icd10_codes text[],
  status varchar(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_APPROVED', 'EXPIRED')),
  approval_validity_days integer DEFAULT 15,
  approval_date timestamptz,
  expiry_date timestamptz,
  rejection_reason text,
  created_by uuid REFERENCES emr.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Audit Trail for Compliance
CREATE TABLE IF NOT EXISTS emr.insurance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL, -- CLAIM, PREAUTH, SETTLEMENT
  entity_id uuid NOT NULL,
  action_type varchar(50) NOT NULL, -- CREATE, UPDATE, SUBMIT, APPROVE, REJECT
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES emr.users(id),
  user_name varchar(100),
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now(),
  remarks text
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON emr.insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_provider ON emr.insurance_claims(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON emr.insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_claim_number ON emr.insurance_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_preauth_patient ON emr.insurance_preauth_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_preauth_status ON emr.insurance_preauth_requests(status);
