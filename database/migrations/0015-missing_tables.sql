-- Migration 0015: Create missing tables and columns for EMR app
-- Run this on ALL tenant schemas (nhgl, city_general, ehs, etc.)

-- 1. CREATE missing tables
CREATE TABLE IF NOT EXISTS employee_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  encounter_id UUID,
  claim_number VARCHAR(100) UNIQUE NOT NULL,
  insurance_provider_id UUID,
  total_amount DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blood_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  unit_type VARCHAR(20) DEFAULT 'whole',
  expiry_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  donor_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ambulance_number VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  location VARCHAR(100),
  driver_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  patient_id UUID,
  document_type VARCHAR(50),
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  created_by UUID NOT NULL, -- REFERENCES emr.users(id)
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add missing columns
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS drug_name VARCHAR(255);

-- 3. Add created_by to notices (if missing)
ALTER TABLE notices ADD COLUMN IF NOT EXISTS created_by UUID;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_leaves_tenant ON employee_leaves(tenant_id);
CREATE INDEX IF NOT EXISTS idx_claims_tenant ON claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blood_units_tenant ON blood_units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_tenant ON ambulances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_patient ON documents(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);

-- Verify migration
SELECT 'Migration 0015 complete' as status;

