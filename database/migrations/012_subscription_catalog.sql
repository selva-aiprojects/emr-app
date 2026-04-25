-- =============================================================
-- Migration 012: Subscription Catalog Table
-- Stores the platform-level pricing and module-access matrix
-- TARGET: nexus (Master Plane)
-- =============================================================

-- Create the table in nexus
CREATE TABLE IF NOT EXISTS nexus.subscription_catalog (
    plan_id         varchar(32)  PRIMARY KEY,        -- 'free' | 'basic' | 'professional' | 'enterprise'
    name            varchar(64)  NOT NULL,            -- Display name, e.g. 'Starter'
    cost            varchar(16)  NOT NULL DEFAULT '0',-- Monthly price (string to support "0", "199", etc.)
    period          varchar(32)  NOT NULL DEFAULT 'per mo',
    color           varchar(32)  NOT NULL DEFAULT 'slate',
    module_keys     jsonb        NOT NULL DEFAULT '[]'::jsonb,  -- Array of allowed module key strings
    features        jsonb        NOT NULL DEFAULT '[]'::jsonb,  -- Array of marketing bullet strings
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now()
);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION nexus.update_subscription_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscription_catalog_updated_at ON nexus.subscription_catalog;
CREATE TRIGGER trg_subscription_catalog_updated_at
BEFORE UPDATE ON nexus.subscription_catalog
FOR EACH ROW EXECUTE FUNCTION nexus.update_subscription_catalog_updated_at();

-- Seed default plans (idempotent)
INSERT INTO nexus.subscription_catalog (plan_id, name, cost, period, color, module_keys, features)
VALUES
  (
    'free', 'Starter', '0', 'Forever', 'slate',
    '["dashboard","patients","appointments","emr","reports","support","communication","hospital_settings"]'::jsonb,
    '["Community Support","Standard Reports","Up to 5 Users"]'::jsonb
  ),
  (
    'basic', 'Basic', '199', 'per mo', 'blue',
    '["dashboard","patients","appointments","emr","reports","support","communication","documents","inventory","pharmacy","ambulance","lab","hospital_settings","departments"]'::jsonb,
    '["Email Support","Advanced Analytics","Up to 25 Users"]'::jsonb
  ),
  (
    'professional', 'Professional', '499', 'per mo', 'indigo',
    '["dashboard","patients","appointments","emr","reports","support","communication","documents","inventory","pharmacy","ambulance","lab","inpatient","billing","accounts","insurance","service_catalog","hospital_settings","departments","bed_management"]'::jsonb,
    '["24/7 Support","Custom Branding","Unlimited Users"]'::jsonb
  ),
  (
    'enterprise', 'Enterprise', '1299', 'per mo', 'emerald',
    '["dashboard","patients","appointments","emr","reports","admin","users","support","communication","documents","inventory","pharmacy","ambulance","lab","inpatient","billing","accounts","accounts_receivable","accounts_payable","insurance","service_catalog","hospital_settings","departments","bed_management","employees","hr","payroll","donor","ai_analysis","document_vault"]'::jsonb,
    '["Dedicated Server","AI Assistance Matrix","99.9% SLM Guarantee"]'::jsonb
  )
ON CONFLICT (plan_id) DO NOTHING;
