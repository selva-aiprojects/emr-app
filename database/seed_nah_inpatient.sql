-- Inpatient and Operational Data Seeding for New Age Hospital (NAH) - V12 (Safe Appointments)
BEGIN;

-- DEPARTMENTS
INSERT INTO departments (tenant_id, name, code, status)
SELECT 'f998a8f5-95b9-4fd7-a583-63cf574d65ed', n, c, 'active'
FROM (VALUES ('Cardiology', 'CARD'), ('Neurology', 'NEUR'), ('Orthopedics', 'ORTH'), ('Pediatrics', 'PEDS'), ('Emergency', 'ER')) AS d(n, c)
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed' AND code = d.c);

-- WARDS
INSERT INTO wards (tenant_id, name, type, base_rate, status)
SELECT 'f998a8f5-95b9-4fd7-a583-63cf574d65ed', n, t, r, 'Active'
FROM (VALUES ('General Ward A', 'General', 1500), ('ICU North', 'ICU', 5000), ('Maternity Suite', 'Private', 3500)) AS w(n, t, r)
WHERE NOT EXISTS (SELECT 1 FROM wards WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed' AND name = w.n);

-- BEDS
INSERT INTO beds (tenant_id, ward_id, bed_number, status)
SELECT 
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed',
  w.id,
  'BED-' || s.i,
  CASE WHEN s.i % 3 = 0 THEN 'Occupied' ELSE 'Available' END
FROM wards w, generate_series(1, 10) s(i)
WHERE w.tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'
AND NOT EXISTS (
  SELECT 1 FROM beds b 
  WHERE b.tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed' 
  AND b.ward_id = w.id 
  AND b.bed_number = 'BED-' || s.i
);

-- SERVICES
INSERT INTO services (tenant_id, name, code, category, base_rate, tax_percent, status)
SELECT 'f998a8f5-95b9-4fd7-a583-63cf574d65ed', n, c, cat, r, 18, 'active'
FROM (VALUES 
  ('OPD Consultation', 'SRV-001', 'Consultation', 500), 
  ('CBC Blood Test', 'SRV-002', 'Laboratory', 250), 
  ('X-Ray Chest', 'SRV-003', 'Radiology', 1200), 
  ('MRI Brain', 'SRV-004', 'Radiology', 15000)
) AS s(n, c, cat, r)
WHERE NOT EXISTS (SELECT 1 FROM services WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed' AND code = s.c);

-- EMPLOYEES
INSERT INTO employees (tenant_id, name, code, designation, department)
SELECT 'f998a8f5-95b9-4fd7-a583-63cf574d65ed', 'Dr. Michael Chen', 'EMP-001', 'CMO', 'Cardiology'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed' AND code = 'EMP-001');

INSERT INTO employees (tenant_id, name, code, designation, department)
SELECT 'f998a8f5-95b9-4fd7-a583-63cf574d65ed', 'Emily Rodriguez', 'EMP-002', 'Head Nurse', 'Emergency'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed' AND code = 'EMP-002');

-- APPOINTMENTS (provider_id instead of doctor_id, removed type)
INSERT INTO appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason)
SELECT 
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed',
  id,
  '20000000-0000-0000-0000-000000000102',
  CURRENT_DATE + interval '9 hours',
  CURRENT_DATE + interval '10 hours',
  'scheduled',
  'Follow-up'
FROM patients
WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'
AND id NOT IN (SELECT patient_id FROM appointments WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed')
LIMIT 5;

COMMIT;
