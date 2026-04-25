-- Migration: Add Doctor Desk to Menu System and Fix Vitals Schema
-- Standardized for institutional shards

-- 1. Ensure Encounters Schema is correct in the SHARD (not nexus)
DO $$ 
BEGIN 
    -- Notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'notes') THEN
        ALTER TABLE encounters ADD COLUMN notes TEXT;
    END IF;

    -- Ward/Bed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'ward_id') THEN
        ALTER TABLE encounters ADD COLUMN ward_id VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'bed_id') THEN
        ALTER TABLE encounters ADD COLUMN bed_id VARCHAR(255);
    END IF;

    -- Vitals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'bp') THEN
        ALTER TABLE encounters ADD COLUMN bp VARCHAR(32);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'hr') THEN
        ALTER TABLE encounters ADD COLUMN hr VARCHAR(32);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'temperature') THEN
        ALTER TABLE encounters ADD COLUMN temperature VARCHAR(32);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'oxygen_saturation') THEN
        ALTER TABLE encounters ADD COLUMN oxygen_saturation VARCHAR(32);
    END IF;

    -- Discharge
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'discharge_type') THEN
        ALTER TABLE encounters ADD COLUMN discharge_type VARCHAR(64);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'discharge_summary') THEN
        ALTER TABLE encounters ADD COLUMN discharge_summary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'follow_up_required') THEN
        ALTER TABLE encounters ADD COLUMN follow_up_required BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Add Doctor Desk to SHARD menu system
INSERT INTO menu_item (tenant_id, label, icon, path, sort_order)
SELECT id, 'Doctor Desk', 'Stethoscope', '/doctor-workspace', 10 
FROM nexus.tenants WHERE code = 'NHGL'
ON CONFLICT DO NOTHING;
