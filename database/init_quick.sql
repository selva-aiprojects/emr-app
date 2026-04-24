-- Quick Test Data Loader (PostgreSQL 17 Compatible)
-- Loads essential test users only

BEGIN;

-- =====================================================
-- SUPERADMIN USER
-- Password: Admin@123
-- =====================================================
INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  NULL,
  'superadmin@emr.local',
  '$2a$10$qVEQHwCfYj7zV9LQwY6qHO6W0P4PJ2X6K3BQj9.FEpN7E8AJxQ5Ay',
  'Platform Superadmin',
  'Superadmin',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- =====================================================
-- SAMPLE TENANT
-- =====================================================
INSERT INTO emr.tenants (id, name, code, subdomain, theme, features, status)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'Selva Care Hospital',
  'SCH',
  'selvacare',
  '{"primary": "#0f5a6e", "accent": "#f57f17"}',
  '{"inventory": true, "telehealth": false}',
  'active'
) ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- TENANT USERS
-- =====================================================

-- Admin: anita@sch.local / Anita@123
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'anita@sch.local',
  '$2a$10$7hGHQj3zK9Kv8W5nQ6EgmeL8Y.PJf7LXwN0vH9V0j3qK8L1wO9E7u',
  'Dr. Anita Sharma',
  'Admin',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Doctor: rajesh@sch.local / Rajesh@123
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'rajesh@sch.local',
  '$2a$10$hY8vK5.WqL0pM4nR7sT9uOcF3dG6jH8kL1mN0o2pQ5rS7tU9vW1xY',
  'Dr. Rajesh Kumar',
  'Doctor',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Nurse: priya@sch.local / Priya@123
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'priya@sch.local',
  '$2a$10$nY1zK8.XqM3pO5nS7tU8vPdG4eH7jI9lM2nO1p3qR6sT8uV0wX2yZ',
  'Nurse Priya Patel',
  'Nurse',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Front Office: suresh@sch.local / Suresh@123
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'suresh@sch.local',
  '$2a$10$pZ2aL9.YrN4qP6oT8uV9wQeH5fI8kJ0mN3oP2q4rS7tU9vW1xY3zA',
  'Suresh Menon',
  'Front Office',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- =====================================================
-- SAMPLE PATIENT
-- =====================================================
INSERT INTO emr.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history)
VALUES (
  '20000000-0000-0000-0000-000000000001'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  'SCH-1001',
  'Meena',
  'Krishnan',
  '1985-03-15',
  'Female',
  '+91-9876543210',
  'meena@example.com',
  '123 MG Road, Chennai, TN 600001',
  'O+',
  'Ravi Krishnan: +91-9876543211',
  'Star Health Insurance - Policy #12345',
  '{"chronicConditions": "Hypertension", "allergies": "Penicillin", "surgeries": "Appendectomy (2010)", "familyHistory": "Diabetes (Mother)"}'
) ON CONFLICT (tenant_id, mrn) DO NOTHING;

-- Patient User: meena@sch.local / Meena@123
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, patient_id, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'meena@sch.local',
  '$2a$10$rB4cN1.AtP6sR8qV0wX1ySeJ7hK0mL2oP5qR4s6tU9vW1xY3zA5bC',
  'Meena Krishnan',
  'Patient',
  '20000000-0000-0000-0000-000000000001'::uuid,
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

COMMIT;

-- =====================================================
-- SHOW LOADED DATA
-- =====================================================
SELECT 'Loaded Users:' as info;
SELECT name, email, role FROM emr.users ORDER BY role, name;

SELECT 'Loaded Tenants:' as info;
SELECT name, code FROM emr.tenants;

SELECT 'Loaded Patients:' as info;
SELECT mrn, first_name, last_name FROM emr.patients;
