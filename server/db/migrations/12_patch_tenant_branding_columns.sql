-- Migration: Add missing branding and status columns to tenant management tables
-- This ensures that institutional branding (logo, theme) and status tracking are supported across all management layers.

DO $$ 
BEGIN
    -- 1. Patch emr.tenants (Sharded settings table)
    IF EXISTS (SELECT to_regclass('emr.tenants')) THEN
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'tenants' AND column_name = 'logo_url') THEN
            ALTER TABLE emr.tenants ADD COLUMN logo_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'tenants' AND column_name = 'status') THEN
            ALTER TABLE emr.tenants ADD COLUMN status VARCHAR(32) DEFAULT 'active';
        END IF;

        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'tenants' AND column_name = 'theme') THEN
            ALTER TABLE emr.tenants ADD COLUMN theme JSONB DEFAULT '{}';
        END IF;

        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'tenants' AND column_name = 'features') THEN
            ALTER TABLE emr.tenants ADD COLUMN features JSONB DEFAULT '{}';
        END IF;

        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'tenants' AND column_name = 'billing_config') THEN
            ALTER TABLE emr.tenants ADD COLUMN billing_config JSONB DEFAULT '{}';
        END IF;
    END IF;

    -- 2. Patch emr.management_tenants (Control plane registry)
    IF EXISTS (SELECT to_regclass('emr.management_tenants')) THEN
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'management_tenants' AND column_name = 'logo_url') THEN
            ALTER TABLE emr.management_tenants ADD COLUMN logo_url TEXT;
        END IF;

        -- Ensure theme and features are also replicated to management plane for UI consistency
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'management_tenants' AND column_name = 'theme') THEN
            ALTER TABLE emr.management_tenants ADD COLUMN theme JSONB DEFAULT '{}';
        END IF;
    END IF;
END $$;
