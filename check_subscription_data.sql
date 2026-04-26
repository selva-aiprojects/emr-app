-- Check current subscription catalog data
SELECT plan_id, name, cost, period, color, 
       jsonb_pretty(features) as features,
       jsonb_pretty(module_keys) as modules
FROM nexus.subscription_catalog 
ORDER BY 
  CASE plan_id
    WHEN 'free' THEN 0
    WHEN 'basic' THEN 1
    WHEN 'standard' THEN 2
    WHEN 'professional' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 5
  END;
