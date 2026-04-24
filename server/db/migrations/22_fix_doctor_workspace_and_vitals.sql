-- Migration: Add Doctor Desk to Menu System and Fix Vitals Schema
-- Resolves "Doctor desk" vanishing and previous migration failures

-- 1. Ensure Encounters Schema is correct (Robust)
DO $$ 
BEGIN 
    -- Notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'notes') THEN
        ALTER TABLE emr.encounters ADD COLUMN notes TEXT;
    END IF;

    -- Ward/Bed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'ward_id') THEN
        ALTER TABLE emr.encounters ADD COLUMN ward_id VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'bed_id') THEN
        ALTER TABLE emr.encounters ADD COLUMN bed_id VARCHAR(255);
    END IF;

    -- Vitals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'bp') THEN
        ALTER TABLE emr.encounters ADD COLUMN bp VARCHAR(32);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'hr') THEN
        ALTER TABLE emr.encounters ADD COLUMN hr VARCHAR(32);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'temperature') THEN
        ALTER TABLE emr.encounters ADD COLUMN temperature VARCHAR(32);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'oxygen_saturation') THEN
        ALTER TABLE emr.encounters ADD COLUMN oxygen_saturation VARCHAR(32);
    END IF;

    -- Discharge
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'discharge_type') THEN
        ALTER TABLE emr.encounters ADD COLUMN discharge_type VARCHAR(64);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'discharge_summary') THEN
        ALTER TABLE emr.encounters ADD COLUMN discharge_summary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'follow_up_required') THEN
        ALTER TABLE emr.encounters ADD COLUMN follow_up_required BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'follow_up_date') THEN
        ALTER TABLE emr.encounters ADD COLUMN follow_up_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'encounters' AND column_name = 'discharged_at') THEN
        ALTER TABLE emr.encounters ADD COLUMN discharged_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Add "My Workspace" Header if not exists
INSERT INTO emr.menu_header (name, code, description, sort_order, icon_name)
VALUES ('My Workspace', 'my_workspace', 'Physician primary dashboard', 0, 'User')
ON CONFLICT (code) DO NOTHING;

-- 3. Add "Doctor Desk" Item if not exists
INSERT INTO emr.menu_item (header_id, name, code, description, icon_name, route, sort_order)
SELECT id, 'Doctor Desk', 'doctor_workspace', 'Daily schedule and patient queue', 'Stethoscope', '/doctor-workspace', 1
FROM emr.menu_header WHERE code = 'my_workspace'
ON CONFLICT (code) DO NOTHING;

-- 4. Grant access to Doctor Desk for Doctors and Admins
INSERT INTO emr.role_menu_access (role_name, menu_item_id, is_visible)
SELECT r.role_name, mi.id, true
FROM (VALUES ('doctor'), ('admin'), ('superadmin')) AS r(role_name)
CROSS JOIN emr.menu_item mi
WHERE mi.code = 'doctor_workspace'
ON CONFLICT (role_name, menu_item_id, tenant_id) DO NOTHING;
