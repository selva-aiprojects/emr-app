-- 014. EMR Workflow Menu Enhancements
-- Adds specialized clinical workflows to the menu system

-- 1. Ensure menu_item table exists (safety check)
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

-- 2. Add EMR workflow-specific menu items
INSERT INTO menu_item (tenant_id, label, icon, path, sort_order)
SELECT id, 'Doctor Workspace', 'Briefcase', '/doctor-workspace', 10 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'Patient Records', 'FileText', '/records', 11 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'Inpatient (IPD)', 'Bed', '/inpatient', 12 FROM nexus.tenants WHERE code = 'NHGL'
ON CONFLICT DO NOTHING;
