-- =============================================================
-- Migration 021: EMR Workflow Menu Items
-- Adds granular EMR workflow items to the menu system
-- =============================================================

-- Insert granular EMR workflow items (standalone without header dependency)
DO $$
BEGIN
    -- Insert EMR menu items for BHC tenant
    INSERT INTO nexus.menu_item (id, tenant_id, label, icon, path, sort_order, workflow_data)
    VALUES
        (gen_random_uuid()::text, 'bhc-tenant-id-123', 'EMR Dashboard', 'LayoutDashboard', '/emr', 1, '{"code":"emr","description":"Overview of clinical activity"}'::jsonb),
        (gen_random_uuid()::text, 'bhc-tenant-id-123', 'New Encounter', 'Stethoscope', '/emr/new', 2, '{"code":"emr_new_encounter","description":"Start a new clinical session"}'::jsonb),
        (gen_random_uuid()::text, 'bhc-tenant-id-123', 'Encounter List', 'Activity', '/emr/list', 3, '{"code":"emr_encounter_list","description":"View history of encounters"}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET 
        label = EXCLUDED.label,
        sort_order = EXCLUDED.sort_order;

END $$;
