-- Feature Flag Database Schema for EMR Application
-- This migration adds support for tenant-specific feature flags and subscription tiers

-- Create tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'Basic' CHECK (subscription_tier IN ('Basic', 'Professional', 'Enterprise')),
    is_active BOOLEAN DEFAULT true,
    theme JSONB DEFAULT '{"primary": "#0f5a6e", "accent": "#f57f17"}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subscription tier to tenants table if column doesn't exist
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'Basic' CHECK (subscription_tier IN ('Basic', 'Professional', 'Enterprise'));

-- Create tenant_features table for custom feature flag assignments
CREATE TABLE IF NOT EXISTS tenant_features (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_flag VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, feature_flag)
);

-- Create feature_flag_audit table for tracking changes
CREATE TABLE IF NOT EXISTS feature_flag_audit (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
    feature_flag VARCHAR(100) NOT NULL,
    old_value BOOLEAN,
    new_value BOOLEAN NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create global_kill_switches table for emergency feature disabling
CREATE TABLE IF NOT EXISTS global_kill_switches (
    id SERIAL PRIMARY KEY,
    feature_flag VARCHAR(100) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    reason TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default global kill switches for high-risk features
INSERT INTO global_kill_switches (feature_flag, enabled, reason) VALUES
('permission-hr_payroll-access', false, 'Payroll module kill switch - disable in case of critical bugs'),
('permission-accounts-access', false, 'Accounts module kill switch - disable in case of critical bugs')
ON CONFLICT (feature_flag) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_feature_flag ON tenant_features(feature_flag);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_tenant_id ON feature_flag_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_created_at ON feature_flag_audit(created_at);

-- Add updated_at trigger for tenant_features
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenant_features_updated_at 
    BEFORE UPDATE ON tenant_features 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_kill_switches_updated_at 
    BEFORE UPDATE ON global_kill_switches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger for tenant_features
CREATE OR REPLACE FUNCTION audit_feature_flag_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO feature_flag_audit (tenant_id, feature_flag, old_value, new_value, changed_by, change_reason)
        VALUES (NEW.tenant_id, NEW.feature_flag, NULL, NEW.enabled, NEW.created_by, 'Feature flag created');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.enabled IS DISTINCT FROM NEW.enabled THEN
            INSERT INTO feature_flag_audit (tenant_id, feature_flag, old_value, new_value, changed_by, change_reason)
            VALUES (NEW.tenant_id, NEW.feature_flag, OLD.enabled, NEW.enabled, NEW.updated_by, 'Feature flag updated');
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO feature_flag_audit (tenant_id, feature_flag, old_value, new_value, changed_by, change_reason)
        VALUES (OLD.tenant_id, OLD.feature_flag, OLD.enabled, NULL, OLD.updated_by, 'Feature flag deleted');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_tenant_features_changes
    AFTER INSERT OR UPDATE OR DELETE ON tenant_features
    FOR EACH ROW EXECUTE FUNCTION audit_feature_flag_changes();

-- Add some sample data for testing
-- This would typically be done in a separate seed script

-- Example: Enable additional features for a specific enterprise tenant
-- INSERT INTO tenant_features (tenant_id, feature_flag, enabled) VALUES
-- (1, 'permission-hr_payroll-access', true),
-- (1, 'permission-accounts-access', true),
-- (1, 'permission-customer_support-access', true)
-- ON CONFLICT (tenant_id, feature_flag) DO UPDATE SET enabled = EXCLUDED.enabled;

-- Create view for easy feature flag queries
CREATE OR REPLACE VIEW tenant_feature_status AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.subscription_tier,
    tf.feature_flag,
    COALESCE(tf.enabled, false) as custom_enabled,
    gks.enabled as kill_switch_active,
    CASE 
        WHEN gks.enabled = true THEN false
        WHEN tf.enabled = true THEN true
        ELSE (
            CASE t.subscription_tier
                WHEN 'Basic' THEN tf.feature_flag = 'permission-core_engine-access'
                WHEN 'Professional' THEN tf.feature_flag IN ('permission-core_engine-access', 'permission-customer_support-access')
                WHEN 'Enterprise' THEN true  -- All features enabled for Enterprise
                ELSE false
            END
        )
    END as effective_enabled
FROM tenants t
CROSS JOIN (
    SELECT DISTINCT feature_flag FROM global_kill_switches
    UNION
    SELECT 'permission-core_engine-access' as feature_flag
    UNION
    SELECT 'permission-hr_payroll-access' as feature_flag
    UNION
    SELECT 'permission-accounts-access' as feature_flag
    UNION
    SELECT 'permission-customer_support-access' as feature_flag
) all_flags
LEFT JOIN tenant_features tf ON t.id = tf.tenant_id AND all_flags.feature_flag = tf.feature_flag
LEFT JOIN global_kill_switches gks ON all_flags.feature_flag = gks.feature_flag
WHERE t.is_active = true;

COMMENT ON TABLE tenant_features IS 'Stores custom feature flag assignments per tenant';
COMMENT ON TABLE feature_flag_audit IS 'Audit log for all feature flag changes';
COMMENT ON TABLE global_kill_switches IS 'Emergency kill switches for high-risk features';
COMMENT ON VIEW tenant_feature_status IS 'Computed view showing effective feature flag status per tenant';
