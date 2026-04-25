-- Migration 013b: Add workflow_data column to menu_item
-- Standardized for institutional shards

-- 1. Ensure menu_item table exists in the current shard
CREATE TABLE IF NOT EXISTS menu_item (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    path VARCHAR(255),
    parent_id VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add workflow_data column
ALTER TABLE menu_item ADD COLUMN IF NOT EXISTS workflow_data JSONB DEFAULT '{}'::jsonb;
