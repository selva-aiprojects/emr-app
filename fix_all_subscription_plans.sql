-- Complete subscription catalog fix - Add all missing plans
INSERT INTO nexus.subscription_catalog (plan_id, name, cost, period, color, module_keys, features)
VALUES
  (
    'basic', 'Basic', '1999', 'per mo', 'slate',
    '["dashboard","patients","appointments","emr","reports","support","communication","documents","hospital_settings"]'::jsonb,
    '["Community Support","Standard Reports","Up to 5 Users"]'::jsonb
  ),
  (
    'standard', 'Standard', '4999', 'per mo', 'blue',
    '["dashboard","patients","appointments","emr","reports","support","communication","documents","inventory","pharmacy","ambulance","lab","hospital_settings","departments"]'::jsonb,
    '["Email Support","Advanced Analytics","Up to 25 Users"]'::jsonb
  ),
  (
    'professional', 'Professional', '7999', 'per mo', 'indigo',
    '["dashboard","patients","appointments","emr","reports","support","communication","documents","inventory","pharmacy","ambulance","lab","inpatient","billing","accounts","insurance","service_catalog","hospital_settings","departments","bed_management","feature_flags","system_settings"]'::jsonb,
    '["24/7 Support","Custom Branding","Unlimited Users"]'::jsonb
  ),
  (
    'enterprise', 'Enterprise', '14999', 'per mo', 'emerald',
    '["dashboard","patients","appointments","emr","reports","admin","users","support","communication","documents","inventory","pharmacy","ambulance","lab","inpatient","billing","accounts","accounts_receivable","accounts_payable","insurance","service_catalog","hospital_settings","departments","bed_management","employees","hr","payroll","donor","ai_analysis","document_vault","feature_flags","system_settings"]'::jsonb,
    '["Dedicated Server","AI Assistance Matrix","99.9% SLA Guarantee"]'::jsonb
  )
ON CONFLICT (plan_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  cost = EXCLUDED.cost,
  period = EXCLUDED.period,
  color = EXCLUDED.color,
  module_keys = EXCLUDED.module_keys,
  features = EXCLUDED.features,
  updated_at = now();
