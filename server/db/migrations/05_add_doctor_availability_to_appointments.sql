-- 05. Add doctor availability reference to appointments table
-- This links appointments to specific availability slots

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS doctor_availability_id VARCHAR(255) REFERENCES doctor_availability(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_availability ON appointments(doctor_availability_id);
