-- Create Patient table with simplified syntax
BEGIN;

-- Create the Patient table
CREATE TABLE IF NOT EXISTS emr.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
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
    archived_by UUID,
    approval_status VARCHAR(16) DEFAULT 'approved',
    last_modified_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON emr.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON emr.patients(mrn);

COMMIT;
