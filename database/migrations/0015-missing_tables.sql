-- Migration 0015: Create missing tables and columns for EMR app
-- Standardized for multi-tenant shards

-- 1. CREATE missing tables (using VARCHAR IDs for institution compatibility)
CREATE TABLE IF NOT EXISTS employee_leaves (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id),
  employee_id VARCHAR(255) NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id),
  patient_id VARCHAR(255) NOT NULL REFERENCES patients(id),
  encounter_id VARCHAR(255),
  claim_number VARCHAR(100) UNIQUE NOT NULL,
  insurance_provider_id VARCHAR(255),
  total_amount DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: blood_units and ambulances are now created in migration 14 with consistent schemas.
-- This file serves as a fallback or for tables not covered there.

-- 2. Add missing columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescription_items' AND table_schema = current_schema()) THEN
        ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS drug_name VARCHAR(255);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notices' AND table_schema = current_schema()) THEN
        ALTER TABLE notices ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
    END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_leaves_tenant ON employee_leaves(tenant_id);
CREATE INDEX IF NOT EXISTS idx_claims_tenant ON claims(tenant_id);

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notices' AND table_schema = current_schema()) THEN
        CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);
    END IF;
END $$;

-- Verify migration
SELECT 'Migration 0015 complete' as status;
