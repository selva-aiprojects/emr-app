-- Fix Institutional Branding columns for HospitalSettingsPage save
-- Safe ADD IF NOT EXISTS pattern (Postgres 9.6+)

-- tenants (primary)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS theme jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS billing_config jsonb DEFAULT '{}';

-- management_tenants (sync target)
ALTER TABLE management_tenants 
ADD COLUMN IF NOT EXISTS theme jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS billing_config jsonb DEFAULT '{}';

-- Verify
SELECT 'tenants columns check' as table_check, 
  string_agg(column_name, ', ') FILTER (WHERE column_name IN ('theme','features','billing_config')) as branding_cols
FROM information_schema.columns 
WHERE table_schema = 'emr' AND table_name = 'tenants';

SELECT 'management_tenants columns check' as table_check, 
  string_agg(column_name, ', ') FILTER (WHERE column_name IN ('theme','features','billing_config')) as branding_cols
FROM information_schema.columns 
WHERE table_schema = 'emr' AND table_name = 'management_tenants';

-- Test sample update (use your tenant id)
-- UPDATE tenants SET theme = '{"primary": "#0f5a6e"}' WHERE id::text = 'your-tenant-uuid' RETURNING id, theme;
