-- 02. SMS/Email Communication System for OPD
-- This script (Phase 02) establishes the core patient notification framework

-- Ensure clean state for supporting tables during modernization
DROP TABLE IF EXISTS communication_templates CASCADE;
DROP TABLE IF EXISTS patient_communications CASCADE;
DROP TABLE IF EXISTS communication_settings CASCADE;
DROP TABLE IF EXISTS communication_logs CASCADE;

CREATE TABLE IF NOT EXISTS communication_templates (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('sms', 'email', 'whatsapp')),
    purpose VARCHAR(100) NOT NULL CHECK (purpose IN ('appointment_reminder', 'token_call', 'billing_reminder', 'follow_up', 'welcome', 'test_results', 'payment_confirmation')),
    subject VARCHAR(255),
    message_content TEXT NOT NULL,
    variables TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_communications (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id VARCHAR(255) REFERENCES appointments(id) ON DELETE SET NULL,
    token_id VARCHAR(255) REFERENCES opd_tokens(id) ON DELETE SET NULL,
    bill_id VARCHAR(255), -- Reference to billing ledger
    communication_type VARCHAR(50) NOT NULL,
    purpose VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    message_content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_settings (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    UNIQUE(tenant_id, setting_key)
);


-- Trigger logic
CREATE OR REPLACE FUNCTION update_communication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_communication_template_updated_at ON communication_templates;
CREATE TRIGGER trigger_communication_template_updated_at
    BEFORE UPDATE ON communication_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_communication_updated_at();

-- Idempotent Seed Logic
INSERT INTO communication_settings (tenant_id, setting_key, setting_value)
SELECT id, 'email_enabled', 'true' FROM nexus.tenants
ON CONFLICT (tenant_id, setting_key) DO NOTHING;
