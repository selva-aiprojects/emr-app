
-- Migration: 008_infrastructure.sql
-- Description: Adds Wards and Beds for Inpatient Management

BEGIN;

-- =====================================================
-- WARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.wards (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    type varchar(32) NOT NULL CHECK (type IN ('General', 'Semi-Private', 'Private', 'ICU', 'Emergency', 'Operation Theater', 'Recovery')),
    base_rate numeric(12,2) NOT NULL DEFAULT 0,
    status varchar(16) DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

-- =====================================================
-- BEDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.beds (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    ward_id VARCHAR(255) NOT NULL REFERENCES emr.wards(id) ON DELETE CASCADE,
    bed_number varchar(16) NOT NULL,
    status varchar(16) DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Cleaning', 'Maintenance')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, ward_id, bed_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wards_tenant ON emr.wards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beds_ward ON emr.beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON emr.beds(status);

-- Update triggers
CREATE TRIGGER trg_wards_updated_at BEFORE UPDATE ON emr.wards 
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER trg_beds_updated_at BEFORE UPDATE ON emr.beds 
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

COMMIT;
