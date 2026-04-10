-- 04. Doctor Availability Tracking System
-- This script (Phase 04) establishes the core doctor availability framework

-- Ensure clean state for supporting tables during modernization
DROP TABLE IF EXISTS emr.doctor_availability CASCADE;

CREATE TABLE emr.doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES emr.departments(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 15,
    max_patients INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_doctor_availability_tenant ON emr.doctor_availability(tenant_id);
CREATE INDEX idx_doctor_availability_doctor ON emr.doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_day ON emr.doctor_availability(day_of_week);

-- Trigger logic (Corrected Syntax and Drop)
CREATE OR REPLACE FUNCTION update_doctor_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_doctor_availability_updated_at ON emr.doctor_availability;
CREATE TRIGGER trigger_doctor_availability_updated_at
    BEFORE UPDATE ON emr.doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_doctor_availability_updated_at();
