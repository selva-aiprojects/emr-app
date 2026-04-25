-- 04. Doctor Availability Tracking System
-- This script (Phase 04) establishes the core doctor availability framework

-- Ensure clean state for supporting tables during modernization
DROP TABLE IF EXISTS doctor_availability CASCADE;

CREATE TABLE IF NOT EXISTS doctor_availability (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    doctor_id VARCHAR(255) NOT NULL REFERENCES nexus.users(id) ON DELETE CASCADE,
    department_id VARCHAR(255) REFERENCES departments(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_doctor_availability_tenant ON doctor_availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON doctor_availability(day_of_week);

-- Trigger logic
CREATE OR REPLACE FUNCTION update_doctor_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_doctor_availability_updated_at ON doctor_availability;
CREATE TRIGGER trigger_doctor_availability_updated_at
    BEFORE UPDATE ON doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_doctor_availability_updated_at();
