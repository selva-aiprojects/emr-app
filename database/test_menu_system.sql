-- Test script to verify menu system functionality
-- Run this to test the database-driven menu system

-- Check if menu tables exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'emr' 
    AND table_name IN ('menu_header', 'menu_item', 'role_menu_access')
ORDER BY table_name, ordinal_position;

-- Check menu headers
SELECT * FROM emr.menu_header ORDER BY sort_order;

-- Check menu items with header names
SELECT 
    mh.name as header_name,
    mi.name as item_name,
    mi.code,
    mi.icon_name,
    mi.route,
    mi.sort_order,
    mi.requires_subscription,
    mi.subscription_plans
FROM emr.menu_item mi
JOIN emr.menu_header mh ON mi.header_id = mh.id
ORDER BY mh.sort_order, mi.sort_order;

-- Check role menu access
SELECT 
    rma.role_name,
    mh.name as header_name,
    mi.name as item_name,
    mi.code,
    rma.is_visible
FROM emr.role_menu_access rma
JOIN emr.menu_item mi ON rma.menu_item_id = mi.id
JOIN emr.menu_header mh ON mi.header_id = mh.id
ORDER BY rma.role_name, mh.sort_order, mi.sort_order;

-- Test user menu for admin role
SELECT 
    mh.name as header_name,
    mi.name as item_name,
    mi.code,
    mi.icon_name,
    mi.route
FROM emr.menu_header mh
JOIN emr.menu_item mi ON mh.id = mi.header_id
LEFT JOIN emr.role_menu_access rma ON mi.id = rma.menu_item_id 
    AND rma.role_name = 'admin'
WHERE mh.is_active = true 
    AND mi.is_active = true 
    AND (rma.is_visible = true OR rma.is_visible IS NULL)
ORDER BY mh.sort_order, mi.sort_order;

-- Test subscription filtering (basic plan)
SELECT 
    mh.name as header_name,
    mi.name as item_name,
    mi.code,
    mi.requires_subscription,
    mi.subscription_plans
FROM emr.menu_header mh
JOIN emr.menu_item mi ON mh.id = mi.header_id
WHERE mh.is_active = true 
    AND mi.is_active = true 
    AND (
        NOT mi.requires_subscription 
        OR mi.subscription_plans::jsonb ? 'basic'
    )
ORDER BY mh.sort_order, mi.sort_order;
