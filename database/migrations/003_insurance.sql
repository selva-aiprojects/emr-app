
-- Migration: 003_insurance.sql
-- Description: Adds tables for Insurance Providers and Claims Management

BEGIN;

-- =====================================================
-- INSURANCE PROVIDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.insurance_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    type varchar(32) NOT NULL CHECK (type IN ('Government', 'Private', 'Corporate')),
    coverage_limit numeric(12,2),
    contact_person text,
    phone varchar(32),
    email text,
    status varchar(16) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending Review')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

-- =====================================================
-- CLAIMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    provider_id uuid NOT NULL REFERENCES emr.insurance_providers(id) ON DELETE CASCADE,
    encounter_id VARCHAR(255) REFERENCES emr.encounters(id) ON DELETE SET NULL,
    invoice_id VARCHAR(255) REFERENCES emr.invoices(id) ON DELETE SET NULL,
    claim_number varchar(64) NOT NULL,
    amount numeric(12,2) NOT NULL,
    status varchar(24) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Submitted', 'Approved', 'Rejected', 'Settled')),
    submission_date date,
    settlement_date date,
    rejection_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, claim_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insurance_providers_tenant ON emr.insurance_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_claims_tenant_status ON emr.claims(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON emr.claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_provider ON emr.claims(provider_id);

-- Triggers
CREATE TRIGGER trg_insurance_providers_updated_at BEFORE UPDATE ON emr.insurance_providers 
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER trg_claims_updated_at BEFORE UPDATE ON emr.claims 
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

COMMIT;
