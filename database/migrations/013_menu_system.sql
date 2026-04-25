-- ============================================================
-- 013. Global Menu System & UI Framework
-- Targets: menu_items, tenant_navigation, user_preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS menu_item (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    path VARCHAR(255),
    parent_id VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    required_role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED GLOBAL MENU FOR NHGL (Core Navigation)
INSERT INTO menu_item (tenant_id, label, icon, path, sort_order)
SELECT id, 'Dashboard', 'LayoutDashboard', '/dashboard', 1 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'Registration', 'UserPlus', '/registration', 2 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'OPD Desk', 'Stethoscope', '/opd', 3 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'Pharmacy', 'Pill', '/pharmacy', 4 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'Laboratory', 'FlaskConical', '/lab', 5 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'Billing', 'Receipt', '/billing', 6 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'HRMS', 'Users', '/hrms', 7 FROM nexus.tenants WHERE code = 'NHGL'
ON CONFLICT DO NOTHING;
