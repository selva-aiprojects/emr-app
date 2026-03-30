-- Token Queue System for Outpatients
-- This table manages token numbers for outpatient queue management

CREATE TABLE IF NOT EXISTS emr.opd_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES emr.patients(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    token_prefix VARCHAR(10) DEFAULT 'OPD',
    full_token VARCHAR(20) GENERATED ALWAYS AS (token_prefix || '-' || LPAD(token_number::text, 3, '0')) STORED,
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
    created_by UUID REFERENCES emr.users(id),
    
    UNIQUE(tenant_id, token_number, DATE(created_at))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opd_tokens_tenant ON emr.opd_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_status ON emr.opd_tokens(status);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_department ON emr.opd_tokens(department_id);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_doctor ON emr.opd_tokens(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_created_at ON emr.opd_tokens(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_opd_tokens_full_token ON emr.opd_tokens(full_token);

-- Token counters for each tenant
CREATE TABLE IF NOT EXISTS emr.opd_token_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    counter_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_token INTEGER NOT NULL DEFAULT 0,
    department_id UUID REFERENCES emr.departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, counter_date, department_id)
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opd_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS trigger_opd_token_updated_at
    BEFORE UPDATE ON emr.opd_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_opd_token_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_opd_token_counter_updated_at
    BEFORE UPDATE ON emr.opd_token_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_opd_token_updated_at();

-- Function to generate next token number
CREATE OR REPLACE FUNCTION get_next_token_number(p_tenant_id UUID, p_department_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    next_token INTEGER;
BEGIN
    -- Get or create counter for today
    INSERT INTO emr.opd_token_counters (tenant_id, counter_date, department_id, current_token)
    VALUES (p_tenant_id, CURRENT_DATE, p_department_id, 1)
    ON CONFLICT (tenant_id, counter_date, department_id) 
    DO UPDATE SET current_token = opd_token_counters.current_token + 1
    RETURNING current_token INTO next_token;
    
    RETURN next_token;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE emr.opd_tokens IS 'OPD token queue system for managing outpatient flow';
COMMENT ON COLUMN emr.opd_tokens.token_number IS 'Sequential token number for the day';
COMMENT ON COLUMN emr.opd_tokens.full_token IS 'Full token display (e.g., OPD-001)';
COMMENT ON COLUMN emr.opd_tokens.status IS 'Current status of the token in queue';
COMMENT ON COLUMN emr.opd_tokens.priority IS 'Priority level for special cases';
COMMENT ON COLUMN emr.opd_tokens.called_count IS 'Number of times this token was called';
COMMENT ON TABLE emr.opd_token_counters IS 'Daily token counters for each department';
