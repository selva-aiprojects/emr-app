-- Add doctor availability reference to appointments table
-- This links appointments to specific availability slots

ALTER TABLE emr.appointments 
ADD COLUMN IF NOT EXISTS doctor_availability_id UUID REFERENCES emr.doctor_availability(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_availability ON emr.appointments(doctor_availability_id);

-- Add comment
COMMENT ON COLUMN emr.appointments.doctor_availability_id IS 'Reference to the specific doctor availability slot for this appointment';
