-- =============================================================
-- Migration 014: EMR Workflow Menu Enhancements
-- Adds EMR-specific workflow navigation support to the database menu system
-- =============================================================

-- Add EMR workflow-specific menu items for better navigation
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
    -- EMR Workflow Items (for future enhancement)
    ('New Encounter', 'emr_new_encounter', 'Create new clinical encounter', 'Plus', '/emr/new-encounter', 2, false, '[]'::jsonb),
    ('Encounter List', 'emr_encounter_list', 'View encounter history', 'History', '/emr/encounter-list', 3, false, '[]'::jsonb),
    ('Patient Search', 'emr_patient_search', 'Search and select patients', 'Users', '/emr/patient-search', 4, false, '[]'::jsonb)
) AS mi(name, code, description, icon_name, route, sort_order, requires_subscription, subscription_plans)
JOIN emr.menu_header h ON h.code = 'patient_care'
ON CONFLICT (code) DO NOTHING;

-- Update EMR menu item to include workflow navigation metadata
UPDATE emr.menu_item 
SET 
    description = 'Electronic Medical Records with workflow navigation',
    route = '/emr'
WHERE code = 'emr';

-- Add role-specific access for EMR workflow items
INSERT INTO emr.role_menu_access (role_name, menu_item_id, is_visible)
SELECT r.role_name, mi.id, true
FROM (
    VALUES 
    ('admin'), ('doctor'), ('nurse'), ('superadmin')
) AS r(role_name)
CROSS JOIN emr.menu_item mi
WHERE mi.code IN ('emr', 'emr_new_encounter', 'emr_encounter_list', 'emr_patient_search')
  AND mi.is_active = true
ON CONFLICT (role_name, menu_item_id, tenant_id) DO NOTHING;

-- Hide EMR workflow items from receptionist role (they don't need clinical workflows)
UPDATE emr.role_menu_access rma
SET is_visible = false
FROM emr.menu_item mi
WHERE rma.menu_item_id = mi.id 
  AND rma.role_name = 'receptionist'
  AND mi.code IN ('emr_new_encounter', 'emr_encounter_list', 'emr_patient_search');

-- Add menu item metadata for EMR workflow support
ALTER TABLE emr.menu_item 
ADD COLUMN IF NOT EXISTS workflow_data jsonb DEFAULT '{}'::jsonb;

-- Update EMR items with workflow metadata
UPDATE emr.menu_item 
SET workflow_data = jsonb_build_object(
    'resets_workflow', true,
    'default_workflow', 'dashboard',
    'workflow_group', 'emr'
)
WHERE code = 'emr';

UPDATE emr.menu_item 
SET workflow_data = jsonb_build_object(
    'target_workflow', 'new-encounter',
    'workflow_group', 'emr'
)
WHERE code = 'emr_new_encounter';

UPDATE emr.menu_item 
SET workflow_data = jsonb_build_object(
    'target_workflow', 'encounter-list',
    'workflow_group', 'emr'
)
WHERE code = 'emr_encounter_list';

UPDATE emr.menu_item 
SET workflow_data = jsonb_build_object(
    'target_workflow', 'patient-search',
    'workflow_group', 'emr'
)
WHERE code = 'emr_patient_search';

-- Create index for workflow data queries
CREATE INDEX IF NOT EXISTS idx_menu_item_workflow_data 
ON emr.menu_item USING gin(workflow_data);

-- Confirm updates
SELECT 
    'EMR Menu Items' as description,
    code,
    name,
    route,
    workflow_data
FROM emr.menu_item 
WHERE code LIKE 'emr%' 
ORDER BY sort_order;
