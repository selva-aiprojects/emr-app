-- Check features_tiers table data
SELECT tier_key, feature_key, module_keys, enabled
FROM nexus.features_tiers 
WHERE enabled = true
ORDER BY tier_key, feature_key
LIMIT 50;
