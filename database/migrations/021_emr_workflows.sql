-- =============================================================
-- Migration 021: EMR Workflow Menu Items
-- Adds granular EMR workflow items to the menu system
-- =============================================================

-- Get the header ID for 'Bed & Patient Care'
DO $$
DECLARE
    header_id uuid;
BEGIN
    SELECT id INTO header_id FROM emr.menu_header WHERE code = 'patient_care';

    -- Insert granular EMR workflow items
    INSERT INTO emr.menu_item (header_id, name, code, description, icon_name, route, sort_order, requires_subscription, subscription_plans)
    VALUES
        (header_id, 'EMR Dashboard', 'emr', 'Overview of clinical activity', 'LayoutDashboard', '/emr', 1, false, '[]'::jsonb),
        (header_id, 'New Encounter', 'emr_new_encounter', 'Start a new clinical session', 'Stethoscope', '/emr/new', 2, false, '[]'::jsonb),
        (header_id, 'Encounter List', 'emr_encounter_list', 'View history of encounters', 'Activity', '/emr/list', 3, false, '[]'::jsonb)
    ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        sort_order = EXCLUDED.sort_order;

    -- Grant access to default roles
    INSERT INTO emr.role_menu_access (role_name, menu_item_id, is_visible)
    SELECT r.role_name, mi.id, true
    FROM (VALUES ('admin'), ('doctor'), ('nurse')) AS r(role_name)
    CROSS JOIN emr.menu_item mi
    WHERE mi.code IN ('emr', 'emr_new_encounter', 'emr_encounter_list')
    ON CONFLICT (role_name, menu_item_id, tenant_id) DO NOTHING;

END $$;
