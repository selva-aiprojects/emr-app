-- Migration: Inventory Constraints Fix
-- Description: Adds UNIQUE constraints to inventory_items, wards, and beds 
-- to support ON CONFLICT operations in seeding scripts.

BEGIN;

-- 1. Ensure inventory_items has unique constraint for multi-tenancy (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'nexus') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_inventory_item_per_tenant') THEN
            ALTER TABLE nexus.inventory_items 
            ADD CONSTRAINT unique_inventory_item_per_tenant UNIQUE (tenant_id, item_code);
        END IF;
    END IF;
END $$;

-- 2. Ensure wards has unique constraint for multi-tenancy
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_ward_per_tenant') THEN
        ALTER TABLE nexus.wards 
        ADD CONSTRAINT unique_ward_per_tenant UNIQUE (tenant_id, name);
    END IF;
END $$;

-- 3. Ensure beds has unique constraint for multi-tenancy
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_bed_per_ward_tenant') THEN
        ALTER TABLE nexus.beds 
        ADD CONSTRAINT unique_bed_per_ward_tenant UNIQUE (tenant_id, ward_id, bed_number);
    END IF;
END $$;

COMMIT;
