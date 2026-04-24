-- Fix: Create missing Patient table based on Prisma schema
-- The Clinical Assessment is failing because the Patient table doesn't exist

BEGIN;

-- Create the Patient table based on Prisma schema
CREATE TABLE IF NOT EXISTS emr.patients (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    mrn VARCHAR(64),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    date_of_birth TIMESTAMPTZ,
    gender VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    blood_type VARCHAR(10),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    insurance TEXT,
    medical_history JSONB,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES emr.users(id),
    approval_status VARCHAR(16) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    last_modified_by UUID REFERENCES emr.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON emr.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON emr.patients(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_archived ON emr.patients(tenant_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_patients_email ON emr.patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_name ON emr.patients(first_name, last_name);

-- Add foreign key constraint for tenant
ALTER TABLE emr.patients 
ADD CONSTRAINT IF NOT EXISTS fk_patients_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;

COMMIT;

-- Note: Sample patient insertion removed to avoid syntax issues
