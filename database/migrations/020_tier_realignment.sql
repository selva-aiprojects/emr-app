-- =============================================================
-- Migration 020: Tier Realignment
-- Updates subscription catalog module keys to match new requirements.
-- =============================================================

UPDATE emr.subscription_catalog
SET module_keys = '["dashboard","patients","appointments","emr","insurance","billing","reports","support","communication","hospital_settings"]'::jsonb,
    features = '["Out-patient Workflow","Insurance Coverage","Basic Day Care","Standard Reports"]'::jsonb
WHERE plan_id = 'free';

UPDATE emr.subscription_catalog
SET module_keys = '["dashboard","patients","appointments","emr","insurance","billing","reports","support","communication","hospital_settings","inpatient","bed_management","service_catalog","departments","documents"]'::jsonb,
    features = '["Standard Inpatient Care","Bed Management","Document Management","Standard Support"]'::jsonb
WHERE plan_id = 'basic'; -- Map 'basic' to what user calls 'Standard/Pro'

UPDATE emr.subscription_catalog
SET module_keys = '["dashboard","patients","appointments","emr","insurance","billing","reports","support","communication","hospital_settings","inpatient","bed_management","service_catalog","departments","documents","pharmacy","inventory","ambulance","donor","accounts_receivable","accounts_payable","financial_ledger","employees","attendance","payroll_service","ai_vision","document_vault"]'::jsonb,
    features = '["Full HIS + HRMS + FinTech","AI Assisted Analytics","Pharmacy & Stock","Ambulance & Blood Bank","24/7 Dedicated Support"]'::jsonb
WHERE plan_id = 'enterprise';

-- Add 'professional' as an alias or update it if needed
UPDATE emr.subscription_catalog
SET module_keys = '["dashboard","patients","appointments","emr","insurance","billing","reports","support","communication","hospital_settings","inpatient","bed_management","service_catalog","departments","documents"]'::jsonb,
    features = '["Standard Inpatient Care","Bed Management","Document Management","Standard Support"]'::jsonb
WHERE plan_id = 'professional';
