CREATE TABLE IF NOT EXISTS nexus.communications (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) REFERENCES nexus.management_tenants(id) ON DELETE SET NULL,
    type VARCHAR(50) DEFAULT 'email',
    direction VARCHAR(10) DEFAULT 'outbound',
    sender TEXT,
    recipient TEXT,
    subject TEXT,
    content TEXT,
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by shard
CREATE INDEX IF NOT EXISTS idx_communications_tenant_id ON nexus.communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON nexus.communications(created_at DESC);
