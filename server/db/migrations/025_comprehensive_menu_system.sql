-- ============================================================
-- Migration: 025. Comprehensive Menu System
-- Targets: nexus.menu_header, nexus.menu_item, nexus.role_menu_access
-- ============================================================

-- Clean start for navigation system
DROP TABLE IF EXISTS nexus.role_menu_access CASCADE;
DROP TABLE IF EXISTS nexus.menu_item CASCADE;
DROP TABLE IF EXISTS nexus.menu_header CASCADE;

-- 1. Create Menu Header Table
CREATE TABLE IF NOT EXISTS nexus.menu_header (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    tenant_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Menu Item Table
CREATE TABLE IF NOT EXISTS nexus.menu_item (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    header_id VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    route VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    requires_subscription BOOLEAN DEFAULT false,
    subscription_plans JSONB DEFAULT '[]', -- ['free', 'basic', 'professional', 'enterprise']
    workflow_data JSONB DEFAULT '{}',
    tenant_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Role Menu Access Table
CREATE TABLE IF NOT EXISTS nexus.role_menu_access (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    role_name VARCHAR(50) NOT NULL,
    menu_item_id VARCHAR(255),
    is_visible BOOLEAN DEFAULT true,
    tenant_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (role_name, menu_item_id, tenant_id)
);

-- 4. Seed Global Menu Structure
-- Headers
INSERT INTO nexus.menu_header (name, code, icon_name, sort_order) VALUES
('Patient Care', 'patient_care', 'UserPlus', 1),
('Clinical Services', 'clinical_services', 'Stethoscope', 2),
('Operations', 'operations', 'Settings', 3),
('Administration', 'administration', 'Shield', 4),
('Reports', 'reports_header', 'BarChart3', 5)
ON CONFLICT (code) DO NOTHING;

-- Items for Patient Care
DO $$
DECLARE
    h_id VARCHAR(255);
BEGIN
    SELECT id INTO h_id FROM nexus.menu_header WHERE code = 'patient_care';
    
    INSERT INTO nexus.menu_item (header_id, name, code, icon_name, route, sort_order) VALUES
    (h_id, 'Registration', 'registration', 'UserPlus', '/registration', 1),
    (h_id, 'OPD Desk', 'opd_desk', 'Stethoscope', '/opd', 2),
    (h_id, 'Appointments', 'appointments', 'Calendar', '/appointments', 3)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Items for Clinical Services
DO $$
DECLARE
    h_id VARCHAR(255);
BEGIN
    SELECT id INTO h_id FROM nexus.menu_header WHERE code = 'clinical_services';
    
    INSERT INTO nexus.menu_item (header_id, name, code, icon_name, route, sort_order) VALUES
    (h_id, 'Doctor Workspace', 'doctor_workspace', 'Briefcase', '/doctor-workspace', 1),
    (h_id, 'Patient Records', 'records', 'FileText', '/records', 2),
    (h_id, 'Laboratory', 'lab', 'FlaskConical', '/lab', 3),
    (h_id, 'Pharmacy', 'pharmacy', 'Pill', '/pharmacy', 4)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Items for Administration
DO $$
DECLARE
    h_id VARCHAR(255);
BEGIN
    SELECT id INTO h_id FROM nexus.menu_header WHERE code = 'administration';
    
    INSERT INTO nexus.menu_item (header_id, name, code, icon_name, route, sort_order) VALUES
    (h_id, 'Master Data Hub', 'admin_masters', 'Database', '/admin/masters', 1),
    (h_id, 'User Management', 'users', 'Users', '/admin/users', 2),
    (h_id, 'Tenant Settings', 'hospital_settings', 'Settings', '/admin/settings', 3)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- 5. Seed Default Role Access (Admin gets everything)
INSERT INTO nexus.role_menu_access (role_name, menu_item_id, is_visible)
SELECT 'Admin', id, true FROM nexus.menu_item
ON CONFLICT (role_name, menu_item_id, tenant_id) DO NOTHING;
