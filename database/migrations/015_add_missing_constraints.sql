-- Migration: Add Missing Unique Constraints (V2)
-- Description: Adds UNIQUE constraints to users (tenant_id, email) and patients (tenant_id, mrn) 
-- with robust existence checks to support ON CONFLICT operations in seeding scripts.

BEGIN;

-- 1. Ensure users has unique constraint for multi-tenancy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_per_tenant'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT unique_user_per_tenant UNIQUE (tenant_id, email);
    END IF;
END $$;

-- 2. Ensure patients has unique constraint for multi-tenancy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_patient_mrn_per_tenant'
    ) THEN
        ALTER TABLE patients 
        ADD CONSTRAINT unique_patient_mrn_per_tenant UNIQUE (tenant_id, mrn);
    END IF;
END $$;

COMMIT;
