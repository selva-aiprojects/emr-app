-- Migration 24: Mark legacy emr.* migrations as permanently skipped
-- These migrations reference the old 'emr' schema which no longer exists.
-- The nexus schema is now the canonical location for all tables.
-- Inserting them here prevents re-execution on every boot.

INSERT INTO nexus.migrations_log (filename)
VALUES ('11_seed_pharmacy_nhgl.sql')
ON CONFLICT (filename) DO NOTHING;

INSERT INTO nexus.migrations_log (filename)
VALUES ('015_add_missing_constraints.sql')
ON CONFLICT (filename) DO NOTHING;
