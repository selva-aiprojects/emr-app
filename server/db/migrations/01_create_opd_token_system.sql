-- 01. Token Queue System for Outpatients
-- This script (Phase 01) establishes the core token queue infrastructure

-- Ensure clean state for supporting tables during modernization
DROP TABLE IF EXISTS emr.opd_tokens CASCADE;
DROP TABLE IF EXISTS emr.opd_token_counters CASCADE;

-- Hammer: Drop any lingering functional indexes that might block creation
DROP INDEX IF EXISTS emr.idx_opd_tokens_upper_full_token;
DROP INDEX IF EXISTS emr.idx_opd_tokens_lower_full_token;

CREATE TABLE emr.opd_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES emr.patients(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    token_prefix VARCHAR(10) DEFAULT 'OPD',
    full_token VARCHAR(20),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_progress', 'completed', 'cancelled', 'no_show')),
    priority VARCHAR(10) DEFAULT 'general' CHECK (priority IN ('urgent', 'senior_citizen', 'general', 'follow_up')),
    department_id UUID REFERENCES emr.departments(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES emr.users(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES emr.appointments(id) ON DELETE SET NULL,
    visit_type VARCHAR(20) DEFAULT 'new' CHECK (visit_type IN ('new', 'follow_up', 'emergency', 'consultation')),
    chief_complaint TEXT,
    vitals_recorded BOOLEAN DEFAULT false,
    consultation_started_at TIMESTAMP WITH TIME ZONE,
    consultation_completed_at TIMESTAMP WITH TIME ZONE,
    called_count INTEGER DEFAULT 0,
    last_called_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id)
);

-- Plain indexes (No functions used here to avoid IMMUTABLE errors)
CREATE INDEX idx_opd_tokens_tenant ON emr.opd_tokens(tenant_id);
CREATE INDEX idx_opd_tokens_status ON emr.opd_tokens(status);
CREATE INDEX idx_opd_tokens_department ON emr.opd_tokens(department_id);
CREATE INDEX idx_opd_tokens_doctor ON emr.opd_tokens(doctor_id);
CREATE INDEX idx_opd_tokens_create_timestamp ON emr.opd_tokens(created_at);
CREATE INDEX idx_opd_tokens_full_token ON emr.opd_tokens(full_token);

-- Token counters for daily queue reset mapping
CREATE TABLE emr.opd_token_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    counter_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_token INTEGER NOT NULL DEFAULT 0,
    department_id UUID REFERENCES emr.departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, counter_date, department_id)
);

-- Trigger logic for token formatting
CREATE OR REPLACE FUNCTION emr.process_opd_token_v2()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.full_token = COALESCE(NEW.token_prefix, 'OPD') || '-' || LPAD(NEW.token_number::text, 3, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_opd_token_mgmt
    BEFORE INSERT OR UPDATE ON emr.opd_tokens
    FOR EACH ROW
    EXECUTE FUNCTION emr.process_opd_token_v2();
