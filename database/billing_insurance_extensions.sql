-- =====================================================
-- Advanced Billing & Insurance Extensions
-- Database Schema Extensions for MedFlow EMR
-- =====================================================
-- Adds support for concessions, credit billing, approvals,
-- insurance pre-authorization, and corporate billing
-- =====================================================

-- Create custom extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CONCESSIONS & DISCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS concessions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    bill_id TEXT REFERENCES billing(id) ON DELETE CASCADE,
    concession_type TEXT NOT NULL CHECK (concession_type IN ('doctor', 'hospital', 'charity', 'vip', 'staff')),
    amount DECIMAL(10,2),
    percentage DECIMAL(5,2),
    reason TEXT NOT NULL,
    applied_by TEXT NOT NULL REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approval_level INTEGER DEFAULT 1,
    comments TEXT,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT concession_amount_check CHECK (
        (amount IS NOT NULL AND amount > 0) OR
        (percentage IS NOT NULL AND percentage > 0 AND percentage <= 100)
    ),
    CONSTRAINT concession_not_both CHECK (
        NOT (amount IS NOT NULL AND percentage IS NOT NULL)
    )
);

-- =====================================================
-- 2. CREDIT NOTES & RECEIVABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS credit_notes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    original_bill_id TEXT REFERENCES billing(id),
    credit_amount DECIMAL(10,2) NOT NULL CHECK (credit_amount > 0),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'utilized', 'expired', 'cancelled')),
    expiry_date DATE,
    utilized_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (credit_amount - utilized_amount) STORED,
    created_by TEXT NOT NULL REFERENCES users(id),
    utilized_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT credit_remaining_check CHECK (remaining_amount >= 0)
);

-- Credit note utilization tracking
CREATE TABLE IF NOT EXISTS credit_note_utilizations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_id TEXT NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
    bill_id TEXT REFERENCES billing(id) ON DELETE CASCADE,
    utilized_amount DECIMAL(10,2) NOT NULL CHECK (utilized_amount > 0),
    utilized_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. BILLING APPROVALS
-- =====================================================

CREATE TABLE IF NOT EXISTS bill_approvals (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bill_id TEXT NOT NULL REFERENCES billing(id) ON DELETE CASCADE,
    approval_type TEXT NOT NULL CHECK (approval_type IN ('discount', 'refund', 'write_off', 'modification', 'cancellation')),
    requested_by TEXT NOT NULL REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    approval_level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    comments TEXT,
    escalation_reason TEXT,
    escalated_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval workflow configuration
CREATE TABLE IF NOT EXISTS approval_workflows (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN ('discount', 'refund', 'write_off', 'modification', 'cancellation')),
    min_amount DECIMAL(10,2) NOT NULL,
    max_amount DECIMAL(10,2),
    required_role TEXT NOT NULL,
    approval_level INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. INSURANCE PRE-AUTHORIZATION
-- =====================================================

CREATE TABLE IF NOT EXISTS insurance_providers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    pre_auth_required BOOLEAN DEFAULT true,
    claim_submission_method TEXT DEFAULT 'electronic' CHECK (claim_submission_method IN ('electronic', 'manual', 'api')),
    processing_time_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS insurance_pre_auth (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    admission_id TEXT REFERENCES encounters(id),
    insurance_provider_id TEXT NOT NULL REFERENCES insurance_providers(id),
    policy_number TEXT NOT NULL,
    pre_auth_number TEXT,
    requested_amount DECIMAL(10,2) NOT NULL,
    approved_amount DECIMAL(10,2),
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'partially_approved', 'rejected', 'expired')),
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approval_date DATE,
    expiry_date DATE,
    diagnosis_codes TEXT[], -- ICD-10 codes
    procedure_codes TEXT[], -- CPT codes
    remarks TEXT,
    requested_by TEXT NOT NULL REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revised pre-authorizations
CREATE TABLE IF NOT EXISTS insurance_pre_auth_revisions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    pre_auth_id TEXT NOT NULL REFERENCES insurance_pre_auth(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    previous_amount DECIMAL(10,2),
    revised_amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by TEXT NOT NULL REFERENCES users(id),
    approved_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. CORPORATE BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS corporate_clients (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    credit_limit DECIMAL(10,2),
    payment_terms TEXT DEFAULT 'net30' CHECK (payment_terms IN ('immediate', 'net15', 'net30', 'net45', 'net60', 'net90')),
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS corporate_bills (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    bill_id TEXT NOT NULL REFERENCES billing(id) ON DELETE CASCADE,
    corporate_client_id TEXT NOT NULL REFERENCES corporate_clients(id),
    bill_type TEXT DEFAULT 'ipd' CHECK (bill_type IN ('ipd', 'opd', 'emergency')),
    total_amount DECIMAL(10,2) NOT NULL,
    insurance_coverage DECIMAL(10,2) DEFAULT 0,
    corporate_coverage DECIMAL(10,2) DEFAULT 0,
    patient_responsibility DECIMAL(10,2) DEFAULT 0,
    settled_amount DECIMAL(10,2) DEFAULT 0,
    outstanding_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - settled_amount) STORED,
    settlement_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially_settled', 'settled', 'written_off')),
    due_date DATE,
    remarks TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    settled_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Corporate bill register for tracking
CREATE TABLE IF NOT EXISTS corporate_bill_register (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    corporate_client_id TEXT NOT NULL REFERENCES corporate_clients(id),
    register_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_bills INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    settled_amount DECIMAL(10,2) DEFAULT 0,
    outstanding_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - settled_amount) STORED,
    generated_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ENHANCED BILLING TABLE MODIFICATIONS
-- =====================================================

-- Add new columns to existing billing table
ALTER TABLE billing
ADD COLUMN IF NOT EXISTS concession_id TEXT REFERENCES concessions(id),
ADD COLUMN IF NOT EXISTS credit_note_id TEXT REFERENCES credit_notes(id),
ADD COLUMN IF NOT EXISTS insurance_pre_auth_id TEXT REFERENCES insurance_pre_auth(id),
ADD COLUMN IF NOT EXISTS corporate_bill_id TEXT REFERENCES corporate_bills(id),
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_approved_by TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS refund_date DATE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_approved_by TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS cancellation_date DATE,
ADD COLUMN IF NOT EXISTS final_bill_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discharge_card_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS receivable_category TEXT DEFAULT 'current' CHECK (receivable_category IN ('current', '30_days', '60_days', '90_days', '120_days_plus'));

-- Add new columns to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS insurance_coverage DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS corporate_coverage DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS patient_responsibility DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - insurance_coverage - corporate_coverage) STORED,
ADD COLUMN IF NOT EXISTS payment_method_breakdown JSONB, -- Store mixed payment methods
ADD COLUMN IF NOT EXISTS final_bill BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discharge_card_url TEXT;

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Concessions indexes
CREATE INDEX IF NOT EXISTS idx_emr_concessions_tenant_id ON concessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_concessions_patient_id ON concessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_concessions_bill_id ON concessions(bill_id);
CREATE INDEX IF NOT EXISTS idx_emr_concessions_status ON concessions(approval_status);
CREATE INDEX IF NOT EXISTS idx_emr_concessions_type ON concessions(concession_type);

-- Credit notes indexes
CREATE INDEX IF NOT EXISTS idx_emr_credit_notes_tenant_id ON credit_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_credit_notes_patient_id ON credit_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_credit_notes_status ON credit_notes(status);
CREATE INDEX IF NOT EXISTS idx_emr_credit_notes_expiry ON credit_notes(expiry_date);

-- Bill approvals indexes
CREATE INDEX IF NOT EXISTS idx_emr_bill_approvals_tenant_id ON bill_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_bill_approvals_bill_id ON bill_approvals(bill_id);
CREATE INDEX IF NOT EXISTS idx_emr_bill_approvals_status ON bill_approvals(status);
CREATE INDEX IF NOT EXISTS idx_emr_bill_approvals_type ON bill_approvals(approval_type);

-- Insurance indexes
CREATE INDEX IF NOT EXISTS idx_emr_insurance_providers_tenant_id ON insurance_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_insurance_pre_auth_tenant_id ON insurance_pre_auth(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_insurance_pre_auth_patient_id ON insurance_pre_auth(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_insurance_pre_auth_status ON insurance_pre_auth(status);
CREATE INDEX IF NOT EXISTS idx_emr_insurance_pre_auth_provider ON insurance_pre_auth(insurance_provider_id);

-- Corporate billing indexes
CREATE INDEX IF NOT EXISTS idx_emr_corporate_clients_tenant_id ON corporate_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_corporate_bills_tenant_id ON corporate_bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_corporate_bills_patient_id ON corporate_bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_corporate_bills_corporate_id ON corporate_bills(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_emr_corporate_bills_status ON corporate_bills(status);

-- Enhanced billing indexes
CREATE INDEX IF NOT EXISTS idx_emr_billing_concession_id ON billing(concession_id);
CREATE INDEX IF NOT EXISTS idx_emr_billing_credit_note_id ON billing(credit_note_id);
CREATE INDEX IF NOT EXISTS idx_emr_billing_insurance_pre_auth_id ON billing(insurance_pre_auth_id);
CREATE INDEX IF NOT EXISTS idx_emr_billing_corporate_bill_id ON billing(corporate_bill_id);
CREATE INDEX IF NOT EXISTS idx_emr_billing_receivable_category ON billing(receivable_category);
CREATE INDEX IF NOT EXISTS idx_emr_billing_final_bill ON billing(final_bill_generated);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE concessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_utilizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_pre_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_pre_auth_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_bill_register ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can view tenant concessions" ON concessions
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view tenant credit notes" ON credit_notes
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view tenant bill approvals" ON bill_approvals
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view tenant insurance providers" ON insurance_providers
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view tenant insurance pre-auth" ON insurance_pre_auth
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view tenant corporate clients" ON corporate_clients
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view tenant corporate bills" ON corporate_bills
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update credit note utilization
CREATE OR REPLACE FUNCTION update_credit_note_utilization()
RETURNS TRIGGER AS $$
BEGIN
    -- Update utilized amount in credit_notes table
    UPDATE credit_notes
    SET utilized_amount = (
        SELECT COALESCE(SUM(utilized_amount), 0)
        FROM credit_note_utilizations
        WHERE credit_note_id = NEW.credit_note_id
    )
    WHERE id = NEW.credit_note_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for credit note utilization updates
CREATE TRIGGER credit_note_utilization_trigger
    AFTER INSERT OR UPDATE OR DELETE ON credit_note_utilizations
    FOR EACH ROW EXECUTE FUNCTION update_credit_note_utilization();

-- Function to check approval workflow limits
CREATE OR REPLACE FUNCTION check_approval_limits()
RETURNS TRIGGER AS $$
DECLARE
    workflow_record RECORD;
    total_amount DECIMAL(10,2);
BEGIN
    -- Get the bill amount
    SELECT total_amount INTO total_amount
    FROM billing
    WHERE id = NEW.bill_id;

    -- Check if approval workflow exists for this amount and type
    SELECT * INTO workflow_record
    FROM approval_workflows
    WHERE tenant_id = NEW.tenant_id
      AND workflow_type = NEW.approval_type
      AND min_amount <= total_amount
      AND (max_amount IS NULL OR max_amount >= total_amount)
      AND is_active = true
    ORDER BY approval_level DESC
    LIMIT 1;

    IF FOUND THEN
        -- Set the required approval level
        NEW.approval_level = workflow_record.approval_level;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for approval workflow checking
CREATE TRIGGER approval_workflow_trigger
    BEFORE INSERT ON bill_approvals
    FOR EACH ROW EXECUTE FUNCTION check_approval_limits();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comments for documentation
COMMENT ON TABLE concessions IS 'Stores discount concessions applied to bills with approval workflows';
COMMENT ON TABLE credit_notes IS 'Credit notes for overpayments and adjustments';
COMMENT ON TABLE bill_approvals IS 'Multi-level approval workflows for billing operations';
COMMENT ON TABLE insurance_providers IS 'Insurance provider master data';
COMMENT ON TABLE insurance_pre_auth IS 'Insurance pre-authorization requests and approvals';
COMMENT ON TABLE corporate_clients IS 'Corporate/TPA client information';
COMMENT ON TABLE corporate_bills IS 'Corporate billing tracking and settlements';

COMMIT;