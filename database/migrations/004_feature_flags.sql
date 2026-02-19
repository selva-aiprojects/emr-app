-- Feature Flag Database Schema for EMR Application (Consolidated)
-- This migration adds support for tenant-specific feature flags and subscription tiers within the 'emr' schema

-- Ensure the emr schema exists
CREATE SCHEMA IF NOT EXISTS emr;

-- Add subscription_tier to emr.tenants table if column doesn't exist
ALTER TABLE emr.tenants 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'Basic' CHECK (subscription_tier IN ('Basic', 'Professional', 'Enterprise'));

-- Add theme and features columns to emr.tenants if they don't exist (matching old usage)
ALTER TABLE emr.tenants
ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{"primary": "#0f5a6e", "accent": "#f57f17"}',
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- Create emr.tenant_features table for custom feature flag assignments
CREATE TABLE IF NOT EXISTS emr.tenant_features (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    feature_flag VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, feature_flag)
);

-- Create emr.feature_flag_audit table for tracking changes
CREATE TABLE IF NOT EXISTS emr.feature_flag_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES emr.tenants(id) ON DELETE SET NULL,
    feature_flag VARCHAR(100) NOT NULL,
    old_value BOOLEAN,
    new_value BOOLEAN NOT NULL,
    changed_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create emr.global_kill_switches table for emergency feature disabling
CREATE TABLE IF NOT EXISTS emr.global_kill_switches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag VARCHAR(100) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    reason TEXT,
    created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default global kill switches for high-risk features
INSERT INTO emr.global_kill_switches (feature_flag, enabled, reason) VALUES
('permission-hr_payroll-access', false, 'Payroll module kill switch - disable in case of critical bugs'),
('permission-accounts-access', false, 'Accounts module kill switch - disable in case of critical bugs')
ON CONFLICT (feature_flag) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON emr.tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_feature_flag ON emr.tenant_features(feature_flag);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_tenant_id ON emr.feature_flag_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_created_at ON emr.feature_flag_audit(created_at);

-- Set up triggers for updated_at in emr schema
DROP TRIGGER IF EXISTS update_tenant_features_updated_at ON emr.tenant_features;
CREATE TRIGGER update_tenant_features_updated_at 
    BEFORE UPDATE ON emr.tenant_features 
    FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS update_global_kill_switches_updated_at ON emr.global_kill_switches;
CREATE TRIGGER update_global_kill_switches_updated_at 
    BEFORE UPDATE ON emr.global_kill_switches 
    FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

-- Create view for easy feature flag queries within emr schema
CREATE OR REPLACE VIEW emr.tenant_feature_status AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.subscription_tier,
    all_flags.feature_flag,
    COALESCE(tf.enabled, false) as custom_enabled,
    COALESCE(gks.enabled, false) as kill_switch_active,
    CASE 
        WHEN gks.enabled = true THEN false
        WHEN tf.enabled = true THEN true
        ELSE (
            CASE t.subscription_tier
                WHEN 'Basic' THEN all_flags.feature_flag = 'permission-core_engine-access'
                WHEN 'Professional' THEN all_flags.feature_flag IN ('permission-core_engine-access', 'permission-customer_support-access')
                WHEN 'Enterprise' THEN true  -- All features enabled for Enterprise
                ELSE false
            END
        )
    END as effective_enabled
FROM emr.tenants t
CROSS JOIN (
    SELECT 'permission-core_engine-access' as feature_flag
    UNION
    SELECT 'permission-hr_payroll-access' as feature_flag
    UNION
    SELECT 'permission-accounts-access' as feature_flag
    UNION
    SELECT 'permission-customer_support-access' as feature_flag
) all_flags
LEFT JOIN emr.tenant_features tf ON t.id = tf.tenant_id AND all_flags.feature_flag = tf.feature_flag
LEFT JOIN emr.global_kill_switches gks ON all_flags.feature_flag = gks.feature_flag
WHERE t.status = 'active';

COMMENT ON TABLE emr.tenant_features IS 'Stores custom feature flag assignments per tenant';
COMMENT ON TABLE emr.feature_flag_audit IS 'Audit log for all feature flag changes';
COMMENT ON TABLE emr.global_kill_switches IS 'Emergency kill switches for high-risk features';
COMMENT ON VIEW emr.tenant_feature_status IS 'Computed view showing effective feature flag status per tenant';
