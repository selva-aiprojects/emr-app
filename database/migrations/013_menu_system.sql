-- =============================================================
-- Migration 013: Menu System Tables
-- Creates database-driven menu configuration system with:
-- - menu_header: Groups menu items by categories (e.g., "Patient Desk", "Lab & Test Services")
-- - menu_item: Individual menu items with icons, permissions, and subscription requirements
-- - role_menu_access: Controls which roles can see which menu items
-- =============================================================

-- Create menu headers table
CREATE TABLE IF NOT EXISTS emr.menu_header (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,                 -- Display name, e.g., "Patient Desk"
    code varchar(50) NOT NULL UNIQUE,           -- Internal code, e.g., "patient_desk"
    description text,
    sort_order integer NOT NULL DEFAULT 0,     -- Order in sidebar
    is_active boolean NOT NULL DEFAULT true,
    icon_name varchar(50),                      -- Optional icon for header
    tenant_id VARCHAR(255) NULL,                -- NULL = global, specific tenant = custom
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create menu items table
CREATE TABLE IF NOT EXISTS emr.menu_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    header_id uuid NOT NULL REFERENCES emr.menu_header(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,                 -- Display name, e.g., "Patients"
    code varchar(50) NOT NULL UNIQUE,           -- Module key, e.g., "patients"
    description text,
    icon_name varchar(50) NOT NULL,             -- Lucide icon name, e.g., "Users"
    route varchar(200) NOT NULL,                 -- Frontend route, e.g., "/patients"
    sort_order integer NOT NULL DEFAULT 0,     -- Order within header
    is_active boolean NOT NULL DEFAULT true,
    requires_subscription boolean NOT NULL DEFAULT false, -- If true, check subscription_catalog
    subscription_plans jsonb DEFAULT '[]'::jsonb,        -- Array of allowed plan_ids
    tenant_id VARCHAR(255) NULL,                -- NULL = global, specific tenant = custom
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create role menu access table
CREATE TABLE IF NOT EXISTS emr.role_menu_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name varchar(50) NOT NULL,              -- Role name, e.g., "doctor", "admin"
    menu_item_id uuid NOT NULL REFERENCES emr.menu_item(id) ON DELETE CASCADE,
    is_visible boolean NOT NULL DEFAULT true,
    tenant_id VARCHAR(255) NULL,                -- NULL = global, specific tenant = custom
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(role_name, menu_item_id, tenant_id)
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION emr.update_menu_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_menu_header_updated_at ON emr.menu_header;
CREATE TRIGGER trg_menu_header_updated_at
BEFORE UPDATE ON emr.menu_header
FOR EACH ROW EXECUTE FUNCTION emr.update_menu_updated_at();

DROP TRIGGER IF EXISTS trg_menu_item_updated_at ON emr.menu_item;
CREATE TRIGGER trg_menu_item_updated_at
BEFORE UPDATE ON emr.menu_item
FOR EACH ROW EXECUTE FUNCTION emr.update_menu_updated_at();

DROP TRIGGER IF EXISTS trg_role_menu_access_updated_at ON emr.role_menu_access;
CREATE TRIGGER trg_role_menu_access_updated_at
BEFORE UPDATE ON emr.role_menu_access
FOR EACH ROW EXECUTE FUNCTION emr.update_menu_updated_at();

-- Seed default menu headers
INSERT INTO emr.menu_header (name, code, description, sort_order, icon_name) VALUES
    ('Hospital Summary', 'hospital_summary', 'Dashboard and reports overview', 1, 'LayoutDashboard'),
    ('Patient Desk', 'patient_desk', 'Patient management and appointments', 2, 'Users'),
    ('Lab & Test Services', 'lab_services', 'Laboratory and diagnostic services', 3, 'FlaskConical'),
    ('Bed & Patient Care', 'patient_care', 'Inpatient and bed management', 4, 'Bed'),
    ('Medicine & Stock', 'medicine_stock', 'Pharmacy and inventory management', 5, 'Pill'),
    ('Billing & Finance', 'billing_finance', 'Financial operations and billing', 6, 'Receipt'),
    ('Personnel & Payroll', 'personnel_payroll', 'Employee management and payroll', 7, 'UserCircle'),
    ('Institutional Ops', 'institutional_ops', 'Hospital administration and settings', 8, 'Building2'),
    ('Help & Assets', 'help_assets', 'Support and documentation', 9, 'BookOpen'),
    ('Ambulance & Emergency', 'ambulance_emergency', 'Emergency services and ambulance', 10, 'Truck')
ON CONFLICT (code) DO NOTHING;

-- Seed default menu items
INSERT INTO emr.menu_item (header_id, name, code, description, icon_name, route, sort_order, requires_subscription, subscription_plans)
SELECT 
    h.id,
    mi.name,
    mi.code,
    mi.description,
    mi.icon_name,
    mi.route,
    mi.sort_order,
    mi.requires_subscription,
    mi.subscription_plans
FROM (
    VALUES
    -- Hospital Summary
    ('Dashboard', 'dashboard', 'Main dashboard view', 'LayoutDashboard', '/dashboard', 1, false, '[]'::jsonb),
    ('Reports', 'reports', 'System reports and analytics', 'Activity', '/reports', 2, false, '[]'::jsonb),
    
    -- Patient Desk
    ('Patients', 'patients', 'Patient management', 'Users', '/patients', 1, false, '[]'::jsonb),
    ('Find Doctor', 'find_doctor', 'Doctor directory', 'Stethoscope', '/ find-doctor', 2, false, '[]'::jsonb),
    ('Doctor Availability', 'doctor_availability', 'Doctor schedules', 'Calendar', '/doctor-availability', 3, false, '[]'::jsonb),
    
    -- Lab & Test Services
    ('Laboratory', 'lab', 'Lab management', 'FlaskConical', '/lab', 1, true, '["basic","professional","enterprise"]'::jsonb),
    ('Lab Availability', 'lab_availability', 'Test availability', 'TestTube', '/lab-availability', 2, true, '["basic","professional","enterprise"]'::jsonb),
    ('AI Vision', 'ai_vision', 'AI-powered diagnostics', 'Zap', '/ai-vision', 3, true, '["professional","enterprise"]'::jsonb),
    
    -- Bed & Patient Care
    ('EMR', 'emr', 'Electronic Medical Records', 'Stethoscope', '/emr', 1, false, '[]'::jsonb),
    ('Inpatient', 'inpatient', 'Inpatient management', 'Bed', '/inpatient', 2, true, '["professional","enterprise"]'::jsonb),
    ('Bed Management', 'bed_management', 'Bed allocation', 'Bed', '/bed-management', 3, true, '["professional","enterprise"]'::jsonb),
    
    -- Medicine & Stock
    ('Pharmacy', 'pharmacy', 'Pharmacy management', 'Pill', '/pharmacy', 1, true, '["basic","professional","enterprise"]'::jsonb),
    ('Inventory', 'inventory', 'Inventory management', 'Package', '/inventory', 2, true, '["basic","professional","enterprise"]'::jsonb),
    
    -- Billing & Finance
    ('Billing', 'billing', 'Patient billing', 'Receipt', '/billing', 1, true, '["professional","enterprise"]'::jsonb),
    ('Accounts Receivable', 'accounts_receivable', 'AR management', 'FileText', '/accounts-receivable', 2, true, '["enterprise"]'::jsonb),
    ('Insurance', 'insurance', 'Insurance management', 'ShieldCheck', '/insurance', 3, true, '["professional","enterprise"]'::jsonb),
    ('Accounts', 'accounts', 'General accounting', 'FileText', '/accounts', 4, true, '["enterprise"]'::jsonb),
    ('Accounts Payable', 'accounts_payable', 'AP management', 'FileText', '/accounts-payable', 5, true, '["enterprise"]'::jsonb),
    
    -- Personnel & Payroll
    ('Employees', 'employees', 'Employee management', 'UserCircle', '/employees', 1, true, '["enterprise"]'::jsonb),
    ('Employee Master', 'employee_master', 'Employee records', 'UserCircle', '/employee-master', 2, true, '["enterprise"]'::jsonb),
    ('Attendance', 'attendance', 'Attendance tracking', 'Calendar', '/attendance', 3, true, '["enterprise"]'::jsonb),
    ('Payroll', 'payroll', 'Payroll management', 'Receipt', '/payroll', 4, true, '["enterprise"]'::jsonb),
    
    -- Institutional Ops
    ('Admin', 'admin', 'System administration', 'Database', '/admin', 1, true, '["enterprise"]'::jsonb),
    ('Users', 'users', 'User management', 'UserCircle', '/users', 2, true, '["enterprise"]'::jsonb),
    ('Hospital Settings', 'hospital_settings', 'Hospital configuration', 'Settings', '/hospital-settings', 3, false, '[]'::jsonb),
    ('Departments', 'departments', 'Department management', 'Building2', '/departments', 4, true, '["basic","professional","enterprise"]'::jsonb),
    ('Admin Masters', 'admin_masters', 'Master data management', 'Database', '/admin-masters', 5, true, '["enterprise"]'::jsonb),
    
    -- Help & Assets
    ('Support', 'support', 'Help and support', 'Settings', '/support', 1, false, '[]'::jsonb),
    ('Communication', 'communication', 'Messaging system', 'Bell', '/communication', 2, false, '[]'::jsonb),
    ('Documents', 'documents', 'Document management', 'FileText', '/documents', 3, true, '["basic","professional","enterprise"]'::jsonb),
    ('Chat', 'chat', 'Chat system', 'MessageSquare', '/chat', 4, true, '["basic","professional","enterprise"]'::jsonb),
    ('Service Catalog', 'service_catalog', 'Service catalog', 'BookOpen', '/service-catalog', 5, true, '["professional","enterprise"]'::jsonb),
    
    -- Ambulance & Emergency
    ('Ambulance', 'ambulance', 'Ambulance services', 'Truck', '/ambulance', 1, true, '["basic","professional","enterprise"]'::jsonb),
    ('Donor', 'donor', 'Blood donor management', 'Droplet', '/donor', 2, true, '["professional","enterprise"]'::jsonb)
) AS mi(name, code, description, icon_name, route, sort_order, requires_subscription, subscription_plans)
JOIN emr.menu_header h ON h.code = 
    CASE mi.name
        WHEN 'Dashboard' THEN 'hospital_summary'
        WHEN 'Reports' THEN 'hospital_summary'
        WHEN 'Patients' THEN 'patient_desk'
        WHEN 'Find Doctor' THEN 'patient_desk'
        WHEN 'Doctor Availability' THEN 'patient_desk'
        WHEN 'Laboratory' THEN 'lab_services'
        WHEN 'Lab Availability' THEN 'lab_services'
        WHEN 'AI Vision' THEN 'lab_services'
        WHEN 'EMR' THEN 'patient_care'
        WHEN 'Inpatient' THEN 'patient_care'
        WHEN 'Bed Management' THEN 'patient_care'
        WHEN 'Pharmacy' THEN 'medicine_stock'
        WHEN 'Inventory' THEN 'medicine_stock'
        WHEN 'Billing' THEN 'billing_finance'
        WHEN 'Accounts Receivable' THEN 'billing_finance'
        WHEN 'Insurance' THEN 'billing_finance'
        WHEN 'Accounts' THEN 'billing_finance'
        WHEN 'Accounts Payable' THEN 'billing_finance'
        WHEN 'Employees' THEN 'personnel_payroll'
        WHEN 'Employee Master' THEN 'personnel_payroll'
        WHEN 'Attendance' THEN 'personnel_payroll'
        WHEN 'Payroll' THEN 'personnel_payroll'
        WHEN 'Admin' THEN 'institutional_ops'
        WHEN 'Users' THEN 'institutional_ops'
        WHEN 'Hospital Settings' THEN 'institutional_ops'
        WHEN 'Departments' THEN 'institutional_ops'
        WHEN 'Admin Masters' THEN 'institutional_ops'
        WHEN 'Support' THEN 'help_assets'
        WHEN 'Communication' THEN 'help_assets'
        WHEN 'Documents' THEN 'help_assets'
        WHEN 'Chat' THEN 'help_assets'
        WHEN 'Service Catalog' THEN 'help_assets'
        WHEN 'Ambulance' THEN 'ambulance_emergency'
        WHEN 'Donor' THEN 'ambulance_emergency'
    END
ON CONFLICT (code) DO NOTHING;

-- Seed default role menu access
INSERT INTO emr.role_menu_access (role_name, menu_item_id, is_visible)
SELECT r.role_name, mi.id, true
FROM (
    VALUES 
    ('admin'), ('doctor'), ('nurse'), ('receptionist'), ('superadmin')
) AS r(role_name)
CROSS JOIN emr.menu_item mi
WHERE mi.is_active = true
ON CONFLICT (role_name, menu_item_id, tenant_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON emr.menu_header TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON emr.menu_item TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON emr.role_menu_access TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA emr TO authenticated;

-- Confirm creation
SELECT 
    'menu_header' as table_name, COUNT(*) as record_count FROM emr.menu_header
UNION ALL
SELECT 
    'menu_item' as table_name, COUNT(*) as record_count FROM emr.menu_item
UNION ALL
SELECT 
    'role_menu_access' as table_name, COUNT(*) as record_count FROM emr.role_menu_access
ORDER BY table_name;
