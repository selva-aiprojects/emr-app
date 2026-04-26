-- Add missing standard subscription tier
INSERT INTO nexus.subscription_catalog (plan_id, name, cost, period, color, module_keys, features)
VALUES (
  'standard', 'Standard', '4999', 'per mo', 'blue',
  '["dashboard","patients","appointments","emr","reports","support","communication","documents","inventory","pharmacy","ambulance","lab","hospital_settings","departments"]'::jsonb,
  '["Email Support","Advanced Analytics","Up to 25 Users"]'::jsonb
) ON CONFLICT (plan_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  cost = EXCLUDED.cost,
  period = EXCLUDED.period,
  color = EXCLUDED.color,
  module_keys = EXCLUDED.module_keys,
  features = EXCLUDED.features,
  updated_at = now();
