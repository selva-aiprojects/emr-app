-- Migration: Add Missing Unique Constraints (V2)
-- Description: Adds UNIQUE constraints to emr.users (tenant_id, email) and emr.patients (tenant_id, mrn) 
-- with robust existence checks to support ON CONFLICT operations in seeding scripts.

BEGIN;

-- 1. Ensure emr.users has unique constraint for multi-tenancy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_per_tenant'
    ) THEN
        ALTER TABLE emr.users 
        ADD CONSTRAINT unique_user_per_tenant UNIQUE (tenant_id, email);
    END IF;
END $$;

-- 2. Ensure emr.patients has unique constraint for multi-tenancy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_patient_mrn_per_tenant'
    ) THEN
        ALTER TABLE emr.patients 
        ADD CONSTRAINT unique_patient_mrn_per_tenant UNIQUE (tenant_id, mrn);
    END IF;
END $$;

COMMIT;
