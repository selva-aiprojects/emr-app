-- Doctor Availability Table for OPD Scheduling
-- This table manages doctor availability with 15-minute slots

CREATE TABLE IF NOT EXISTS emr.doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 15,
    is_available BOOLEAN DEFAULT true,
    max_appointments INTEGER DEFAULT 1,
    current_appointments INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'break', 'off_duty')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id),
    UNIQUE(tenant_id, doctor_id, date, start_time)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_availability_tenant_doctor ON emr.doctor_availability(tenant_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_date ON emr.doctor_availability(date);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_status ON emr.doctor_availability(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_doctor_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS trigger_doctor_availability_updated_at
    BEFORE UPDATE ON emr.doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_doctor_availability_updated_at();

-- Comment
COMMENT ON TABLE emr.doctor_availability IS 'Doctor availability schedule with 15-minute time slots for OPD appointments';
COMMENT ON COLUMN emr.doctor_availability.slot_duration_minutes IS 'Duration of each time slot in minutes (default 15)';
COMMENT ON COLUMN emr.doctor_availability.max_appointments IS 'Maximum number of appointments allowed in this time slot';
COMMENT ON COLUMN emr.doctor_availability.current_appointments IS 'Current number of appointments booked in this time slot';
