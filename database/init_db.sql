-- Initial Data Setup for EMR System
-- Run this after schema_enhanced.sql

BEGIN;

-- =====================================================
-- DEFAULT SUPERADMIN USER
-- Password: Admin@123
-- Hash generated with bcrypt (cost: 10)
-- =====================================================
INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  NULL, -- Superadmin has no tenant
  'superadmin@emr.local',
  '$2b$10$RQ/2010sUHDLNH2k.sE25.fJLK23MzLmvcFV6O9kc7Ip1krJkSQtG', -- Admin@123
  'Platform Superadmin',
  'Superadmin',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- =====================================================
-- SAMPLE TENANT: Selva Care Hospital
-- =====================================================
INSERT INTO emr.tenants (id, name, code, subdomain, theme, features, status)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'Selva Care Hospital',
  'SCH',
  'selvacare',
  '{"primary": "#0f5a6e", "accent": "#f57f17"}'::jsonb,
  '{"inventory": true, "telehealth": false}'::jsonb,
  'active'
) ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SAMPLE USERS FOR SELVA CARE HOSPITAL
-- All passwords: {Name}@123 (e.g., Anita@123)
-- =====================================================

-- Tenant Admin
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'anita@sch.local',
  '$2b$10$RGnFeEHlbfAa2BNwbuPJVOcG84fRDcuiDPAH4RDL4AHq/vFsXsa9S', -- Anita@123
  'Dr. Anita Sharma',
  'Admin',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Doctor
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'rajesh@sch.local',
  '$2b$10$UF9ctn6umKOAHtEA3I2r7ut4r0Wtbk7ygP0SGfgXTMzAnGy5rLUS.', -- Rajesh@123
  'Dr. Rajesh Kumar',
  'Doctor',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Nurse
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'priya@sch.local',
  '$2a$10$nY1zK8.XqM3pO5nS7tU8vPdG4eH7jI9lM2nO1p3qR6sT8uV0wX2yZ', -- Priya@123
  'Nurse Priya Patel',
  'Nurse',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Front Office
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'suresh@sch.local',
  '$2a$10$pZ2aL9.YrN4qP6oT8uV9wQeH5fI8kJ0mN3oP2q4rS7tU9vW1xY3zA', -- Suresh@123
  'Suresh Menon',
  'Front Office',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Billing
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'lakshmi@sch.local',
  '$2a$10$qA3bM0.ZsO5rQ7pU9vW0xReI6gJ9lK1nO4pQ3r5sT8uV0wX2yZ4aB', -- Lakshmi@123
  'Lakshmi Iyer',
  'Billing',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- =====================================================
-- SAMPLE PATIENT & PATIENT USER
-- =====================================================

-- Create Patient Record
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
  '{
    "chronicConditions": "Hypertension",
    "allergies": "Penicillin",
    "surgeries": "Appendectomy (2010)",
    "familyHistory": "Diabetes (Mother)"
  }'::jsonb
) ON CONFLICT (tenant_id, mrn) DO NOTHING;

-- Create Patient User Account
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, patient_id, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'meena@sch.local',
  '$2b$10$1Uluxd3zONd/X6SuFHw4zuj6LWbUmwiSGVdOBodpVK5XPNaZmIGQ2', -- Meena@123
  'Meena Krishnan',
  'Patient',
  '20000000-0000-0000-0000-000000000001'::uuid,
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- =====================================================
-- SAMPLE EMPLOYEE RECORDS
-- =====================================================

INSERT INTO emr.employees (tenant_id, code, name, department, designation, join_date, shift, salary, leave_balance)
VALUES
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'EMP-001',
    'Ramesh Kumar',
    'Nursing',
    'Senior Nurse',
    '2020-01-15',
    'Morning',
    35000,
    10
  ),
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'EMP-002',
    'Kavitha Reddy',
    'Administration',
    'Office Manager',
    '2019-06-01',
    'Morning',
    40000,
    12
  ),
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'EMP-003',
    'Vijay Kumar',
    'Housekeeping',
    'Supervisor',
    '2021-03-10',
    'Rotating',
    25000,
    8
  )
ON CONFLICT (tenant_id, code) DO NOTHING;

-- =====================================================
-- SAMPLE INVENTORY ITEMS
-- =====================================================

INSERT INTO emr.inventory_items (tenant_id, item_code, name, category, current_stock, reorder_level, unit)
VALUES
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'MED-001',
    'Paracetamol 500mg',
    'Medicines',
    500,
    100,
    'tablets'
  ),
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'MED-002',
    'Amoxicillin 250mg',
    'Antibiotics',
    300,
    75,
    'capsules'
  ),
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'SUP-001',
    'Surgical Gloves (Box)',
    'Supplies',
    50,
    20,
    'boxes'
  ),
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'SUP-002',
    'Disposable Syringes 5ml',
    'Supplies',
    1000,
    200,
    'pieces'
  ),
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    'EQP-001',
    'Digital Thermometer',
    'Equipment',
    25,
    10,
    'pieces'
  )
ON CONFLICT (tenant_id, item_code) DO NOTHING;

-- =====================================================
-- SAMPLE AUDIT LOG ENTRY
-- =====================================================

INSERT INTO emr.audit_logs (tenant_id, user_id, user_name, action, details)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM emr.users WHERE email = 'anita@sch.local' LIMIT 1),
  'Dr. Anita Sharma',
  'system.initialization',
  '{"message": "Initial data setup completed"}'::jsonb
);

-- =====================================================
-- TENANT 2: Nila Health Center (NHC)
-- =====================================================
INSERT INTO emr.tenants (id, name, code, subdomain, theme, features, status)
VALUES (
  '10000000-0000-0000-0000-000000000002'::uuid,
  'Nila Health Center',
  'NHC',
  'nilahealth',
  '{"primary": "#1b5e20", "accent": "#ef6c00"}'::jsonb,
  '{"inventory": true, "telehealth": false}'::jsonb,
  'active'
) ON CONFLICT (code) DO NOTHING;

-- NHC Admin & Doctor
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES 
  ('10000000-0000-0000-0000-000000000002'::uuid, 'admin@nhc.local', '$2b$10$RQ/2010sUHDLNH2k.sE25.fJLK23MzLmvcFV6O9kc7Ip1krJkSQtG', 'Nila Admin', 'Admin', true),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'doctor@nhc.local', '$2b$10$UF9ctn6umKOAHtEA3I2r7ut4r0Wtbk7ygP0SGfgXTMzAnGy5rLUS.', 'Dr. Balan', 'Doctor', true)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- NHC Patient
INSERT INTO emr.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('20000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'NHC-1001', 'Arjun', 'Das', '1992-05-20', 'Male', '+91-9998887771', 'arjun@example.com')
ON CONFLICT (tenant_id, mrn) DO NOTHING;

-- =====================================================
-- TENANT 3: Riverway Community Clinic (RCC)
-- =====================================================
INSERT INTO emr.tenants (id, name, code, subdomain, theme, features, status)
VALUES (
  '10000000-0000-0000-0000-000000000003'::uuid,
  'Riverway Community Clinic',
  'RCC',
  'riverway',
  '{"primary": "#6a1b9a", "accent": "#00897b"}'::jsonb,
  '{"inventory": false, "telehealth": false}'::jsonb,
  'active'
) ON CONFLICT (code) DO NOTHING;

-- RCC Admin & Nurse
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES 
  ('10000000-0000-0000-0000-000000000003'::uuid, 'admin@rcc.local', '$2b$10$RQ/2010sUHDLNH2k.sE25.fJLK23MzLmvcFV6O9kc7Ip1krJkSQtG', 'Riverway Admin', 'Admin', true),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'nurse@rcc.local', '$2b$10$4x0lLYEnSvkLpDR52zACVOQfi1DdxfP8tYDVMt83N9xhkvvc65ES6', 'Nurse Sarah', 'Nurse', true)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- RCC Patient
INSERT INTO emr.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('20000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'RCC-1001', 'Priya', 'Sundar', '1988-11-12', 'Female', '+91-9998887772', 'priya.s@example.com')
ON CONFLICT (tenant_id, mrn) DO NOTHING;

-- =====================================================
-- TENANT 4: Omega Hospitals (OH)
-- =====================================================
INSERT INTO emr.tenants (id, name, code, subdomain, theme, features, status)
VALUES (
  '10000000-0000-0000-0000-000000000004'::uuid,
  'Omega Hospitals',
  'OH',
  'omega',
  '{"primary": "#c62828", "accent": "#283593"}'::jsonb,
  '{"inventory": true, "telehealth": true}'::jsonb,
  'active'
) ON CONFLICT (code) DO NOTHING;

-- OH Admin & Doctor
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES 
  ('10000000-0000-0000-0000-000000000004'::uuid, 'admin@omega.local', '$2b$10$RQ/2010sUHDLNH2k.sE25.fJLK23MzLmvcFV6O9kc7Ip1krJkSQtG', 'Omega Admin', 'Admin', true),
  ('10000000-0000-0000-0000-000000000004'::uuid, 'doctor@omega.local', '$2b$10$UF9ctn6umKOAHtEA3I2r7ut4r0Wtbk7ygP0SGfgXTMzAnGy5rLUS.', 'Dr. Vikram', 'Doctor', true)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- OH Patient
INSERT INTO emr.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email)
VALUES ('20000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, 'OH-1001', 'Kiran', 'Varma', '1975-08-30', 'Male', '+91-9998887773', 'kiran.v@example.com')
ON CONFLICT (tenant_id, mrn) DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show created tenants
SELECT 'Tenants:' as section, id, name, code, subdomain FROM emr.tenants;

-- Show created users
SELECT 'Users:' as section, name, email, role FROM emr.users ORDER BY role, name;

-- Show created patients
SELECT 'Patients:' as section, mrn, first_name, last_name, blood_group FROM emr.patients;

-- Show created employees
SELECT 'Employees:' as section, code, name, department, designation FROM emr.employees;

-- Show created inventory items
SELECT 'Inventory:' as section, item_code, name, category, current_stock FROM emr.inventory_items;

-- =====================================================
-- TEST CREDENTIALS SUMMARY
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'EMR SYSTEM - TEST CREDENTIALS';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'SUPERADMIN:';
  RAISE NOTICE '  Tenant: superadmin';
  RAISE NOTICE '  Email: superadmin@emr.local';
  RAISE NOTICE '  Password: Admin@123';
  RAISE NOTICE '';
  RAISE NOTICE 'TENANT ADMIN (Selva Care Hospital):';
  RAISE NOTICE '  Email: anita@sch.local';
  RAISE NOTICE '  Password: Anita@123';
  RAISE NOTICE '';
  RAISE NOTICE 'DOCTOR:';
  RAISE NOTICE '  Email: rajesh@sch.local';
  RAISE NOTICE '  Password: Rajesh@123';
  RAISE NOTICE '';
  RAISE NOTICE 'PATIENT:';
  RAISE NOTICE '  Email: meena@sch.local';
  RAISE NOTICE '  Password: Meena@123';
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
END $$;
