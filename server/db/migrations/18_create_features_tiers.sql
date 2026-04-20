CREATE TABLE IF NOT EXISTS emr.features_tiers (
  id BIGSERIAL PRIMARY KEY,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  tier_key TEXT NOT NULL,
  tier_label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  module_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feature_key, tier_key)
);

CREATE INDEX IF NOT EXISTS idx_features_tiers_tier_enabled
  ON emr.features_tiers (tier_key, enabled);

