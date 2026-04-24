-- 06. Exotel SMS Provider Integration
-- This table manages Exotel SMS provider configuration and workflows

CREATE TABLE IF NOT EXISTS emr.exotel_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    account_sid VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    api_token VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.exotel_sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL,
    template_id UUID REFERENCES emr.communication_templates(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.exotel_sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES emr.exotel_sms_campaigns(id) ON DELETE SET NULL,
    communication_id UUID REFERENCES emr.patient_communications(id) ON DELETE SET NULL,
    message_sid VARCHAR(255),
    to_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exotel_configurations_tenant ON emr.exotel_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_campaigns_tenant ON emr.exotel_sms_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_tenant ON emr.exotel_sms_logs(tenant_id);

-- Trigger logic (Corrected Syntax)
CREATE OR REPLACE FUNCTION update_exotel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_exotel_configuration_updated_at
    BEFORE UPDATE ON emr.exotel_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_exotel_updated_at();

CREATE TRIGGER trigger_exotel_sms_campaign_updated_at
    BEFORE UPDATE ON emr.exotel_sms_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_exotel_updated_at();
