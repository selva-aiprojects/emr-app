-- Support Tickets Table for Facility Operations
CREATE TABLE IF NOT EXISTS emr.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id),
    type VARCHAR(50) NOT NULL, -- e.g., 'Maintenance', 'IT', 'Housekeeping'
    location VARCHAR(100),
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    created_by UUID REFERENCES emr.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tenant-based fetching
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON emr.support_tickets(tenant_id);

-- Audit log integration (handled via repository)
