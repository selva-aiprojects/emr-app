-- 06. Exotel SMS Provider Integration
-- This table manages Exotel SMS provider configuration and workflows

DROP TABLE IF EXISTS exotel_sms_logs CASCADE;
DROP TABLE IF EXISTS exotel_sms_campaigns CASCADE;
DROP TABLE IF EXISTS exotel_configurations CASCADE;

CREATE TABLE IF NOT EXISTS exotel_configurations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS exotel_sms_campaigns (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL,
    template_id VARCHAR(255) REFERENCES communication_templates(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exotel_sms_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    campaign_id VARCHAR(255) REFERENCES exotel_sms_campaigns(id) ON DELETE SET NULL,
    communication_id VARCHAR(255) REFERENCES patient_communications(id) ON DELETE SET NULL,
    message_sid VARCHAR(255),
    to_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exotel_configurations_tenant ON exotel_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_campaigns_tenant ON exotel_sms_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_tenant ON exotel_sms_logs(tenant_id);

-- Trigger logic
CREATE OR REPLACE FUNCTION update_exotel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_exotel_configuration_updated_at ON exotel_configurations;
CREATE TRIGGER trigger_exotel_configuration_updated_at
    BEFORE UPDATE ON exotel_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_exotel_updated_at();

DROP TRIGGER IF EXISTS trigger_exotel_sms_campaign_updated_at ON exotel_sms_campaigns;
CREATE TRIGGER trigger_exotel_sms_campaign_updated_at
    BEFORE UPDATE ON exotel_sms_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_exotel_updated_at();
