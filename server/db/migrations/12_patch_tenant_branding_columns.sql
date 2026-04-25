-- Migration: Add missing branding and status columns to tenant management tables
-- Standardized for institutional shards

DO $$ 
DECLARE
    v_schema TEXT;
BEGIN
    SELECT current_schema() INTO v_schema;

    -- 1. Patch current shard's tenants table (if it exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = v_schema AND table_name = 'tenants') THEN
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = v_schema AND table_name = 'tenants' AND column_name = 'logo_url') THEN
            EXECUTE 'ALTER TABLE tenants ADD COLUMN logo_url TEXT';
        END IF;
    END IF;

    -- 2. Patch nexus.management_tenants (Global registry)
    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_schema = 'nexus' AND table_name = 'management_tenants' AND column_name = 'logo_url') THEN
        ALTER TABLE nexus.management_tenants ADD COLUMN logo_url TEXT;
    END IF;
END $$;
