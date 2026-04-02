-- =====================================================
-- EMR Application - Sample Data Seeding
-- =====================================================
-- Run this script after the main setup script
-- =====================================================

-- =====================================================
-- SAMPLE USERS
-- =====================================================

-- Insert sample users (passwords are hashed with bcrypt)
-- Note: In production, these should be properly hashed
INSERT INTO users (id, tenant_id, email, password, first_name, last_name, role) VALUES
    ('user-admin-1', 'demo-tenant-123', 'admin@hospital.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ6QGwFUvKyRHGDbe.xjQzV8K4.ABC1C', 'John', 'Admin', 'Admin'),
    ('user-doc-1', 'demo-tenant-123', 'doctor@hospital.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ6QGwFUvKyRHGDbe.xjQzV8K4.ABC1C', 'Sarah', 'Doctor', 'Doctor'),
    ('user-nurse-1', 'demo-tenant-123', 'nurse@hospital.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ6QGwFUvKyRHGDbe.xjQzV8K4.ABC1C', 'Emily', 'Nurse', 'Nurse'),
    ('user-reception-1', 'demo-tenant-123', 'reception@hospital.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ6QGwFUvKyRHGDbe.xjQzV8K4.ABC1C', 'Michael', 'Reception', 'Front Office')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE EMPLOYEES
-- =====================================================

-- Insert sample employees
INSERT INTO employees (id, tenant_id, first_name, last_name, email, phone, role, department, join_date, salary) VALUES
    ('emp-1', 'demo-tenant-123', 'Sarah', 'Doctor', 'sarah.doctor@hospital.com', '+1-555-0101', 'Doctor', 'General Medicine', '2023-01-15', 120000.00),
    ('emp-2', 'demo-tenant-123', 'John', 'Smith', 'john.smith@hospital.com', '+1-555-0102', 'Doctor', 'Emergency', '2023-02-01', 130000.00),
    ('emp-3', 'demo-tenant-123', 'Emily', 'Nurse', 'emily.nurse@hospital.com', '+1-555-0103', 'Nurse', 'General Medicine', '2023-03-10', 65000.00),
    ('emp-4', 'demo-tenant-123', 'Michael', 'Reception', 'michael.reception@hospital.com', '+1-555-0104', 'Front Office', 'General', '2023-04-05', 45000.00),
    ('emp-5', 'demo-tenant-123', 'David', 'Wilson', 'david.wilson@hospital.com', '+1-555-0105', 'Doctor', 'Pediatrics', '2023-05-20', 115000.00),
    ('emp-6', 'demo-tenant-123', 'Lisa', 'Brown', 'lisa.brown@hospital.com', '+1-555-0106', 'Doctor', 'Cardiology', '2023-06-15', 140000.00)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE PATIENTS
-- =====================================================

-- Insert sample patients
INSERT INTO patients (id, tenant_id, first_name, last_name, date_of_birth, gender, phone, email, address, blood_type, emergency_contact_name, emergency_contact_phone) VALUES
    ('pat-1', 'demo-tenant-123', 'James', 'Anderson', '1985-03-15', 'Male', '+1-555-0201', 'james.anderson@email.com', '123 Main St, City, State 12345', 'O+', 'Mary Anderson', '+1-555-0202'),
    ('pat-2', 'demo-tenant-123', 'Mary', 'Johnson', '1990-07-22', 'Female', '+1-555-0203', 'mary.johnson@email.com', '456 Oak Ave, City, State 12345', 'A+', 'Robert Johnson', '+1-555-0204'),
    ('pat-3', 'demo-tenant-123', 'Robert', 'Williams', '1978-11-30', 'Male', '+1-555-0205', 'robert.williams@email.com', '789 Pine Rd, City, State 12345', 'B+', 'Susan Williams', '+1-555-0206'),
    ('pat-4', 'demo-tenant-123', 'Susan', 'Brown', '1995-05-18', 'Female', '+1-555-0207', 'susan.brown@email.com', '321 Elm St, City, State 12345', 'AB+', 'James Brown', '+1-555-0208'),
    ('pat-5', 'demo-tenant-123', 'William', 'Davis', '1982-09-10', 'Male', '+1-555-0209', 'william.davis@email.com', '654 Maple Dr, City, State 12345', 'O-', 'Linda Davis', '+1-555-0210'),
    ('pat-6', 'demo-tenant-123', 'Linda', 'Miller', '1988-12-25', 'Female', '+1-555-0211', 'linda.miller@email.com', '987 Cedar Ln, City, State 12345', 'A-', 'Mark Miller', '+1-555-0212'),
    ('pat-7', 'demo-tenant-123', 'Mark', 'Wilson', '1975-04-08', 'Male', '+1-555-0213', 'mark.wilson@email.com', '147 Birch Way, City, State 12345', 'B-', 'Patricia Wilson', '+1-555-0214'),
    ('pat-8', 'demo-tenant-123', 'Patricia', 'Moore', '1992-08-14', 'Female', '+1-555-0215', 'patricia.moore@email.com', '258 Spruce St, City, State 12345', 'O+', 'Thomas Moore', '+1-555-0216')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE APPOINTMENTS
-- =====================================================

-- Insert sample appointments
INSERT INTO appointments (id, tenant_id, patient_id, doctor_id, appointment_date, duration, status, notes) VALUES
    ('apt-1', 'demo-tenant-123', 'pat-1', 'emp-1', '2026-04-03 09:00:00', 30, 'scheduled', 'Regular checkup'),
    ('apt-2', 'demo-tenant-123', 'pat-2', 'emp-1', '2026-04-03 10:30:00', 30, 'scheduled', 'Follow-up visit'),
    ('apt-3', 'demo-tenant-123', 'pat-3', 'emp-2', '2026-04-03 14:00:00', 45, 'scheduled', 'Emergency consultation'),
    ('apt-4', 'demo-tenant-123', 'pat-4', 'emp-5', '2026-04-03 15:30:00', 30, 'scheduled', 'Pediatric checkup'),
    ('apt-5', 'demo-tenant-123', 'pat-5', 'emp-6', '2026-04-04 11:00:00', 60, 'scheduled', 'Cardiology consultation'),
    ('apt-6', 'demo-tenant-123', 'pat-6', 'emp-1', '2026-04-04 13:00:00', 30, 'completed', 'General consultation'),
    ('apt-7', 'demo-tenant-123', 'pat-7', 'emp-2', '2026-04-04 16:00:00', 30, 'cancelled', 'Patient rescheduled'),
    ('apt-8', 'demo-tenant-123', 'pat-8', 'emp-5', '2026-04-05 09:30:00', 30, 'scheduled', 'Vaccination')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE ENCOUNTERS
-- =====================================================

-- Insert sample encounters
INSERT INTO encounters (id, tenant_id, patient_id, doctor_id, encounter_date, encounter_type, chief_complaint, diagnosis, treatment_plan, prescription, notes) VALUES
    ('enc-1', 'demo-tenant-123', 'pat-1', 'emp-1', '2026-03-20 10:00:00', 'consultation', 'Annual checkup', 'Healthy', 'Continue current medications', 'None', 'Patient doing well'),
    ('enc-2', 'demo-tenant-123', 'pat-2', 'emp-1', '2026-03-25 14:30:00', 'follow-up', 'Headache', 'Tension headache', 'Pain medication as needed', 'Ibuprofen 400mg PRN', 'Stress management advised'),
    ('enc-3', 'demo-tenant-123', 'pat-3', 'emp-2', '2026-03-28 20:15:00', 'emergency', 'Chest pain', 'Musculoskeletal pain', 'Rest and pain medication', 'Acetaminophen 500mg PRN', 'Cardiac workup negative'),
    ('enc-4', 'demo-tenant-123', 'pat-4', 'emp-5', '2026-03-30 11:00:00', 'consultation', 'Fever', 'Viral infection', 'Supportive care', 'Antipyretics as needed', 'Monitor temperature'),
    ('enc-5', 'demo-tenant-123', 'pat-6', 'emp-1', '2026-04-01 13:00:00', 'consultation', 'Routine checkup', 'Healthy', 'Continue healthy lifestyle', 'None', 'No concerns')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE INVENTORY
-- =====================================================

-- Insert sample inventory items
INSERT INTO inventory (id, tenant_id, name, category, quantity, unit, min_stock, price, supplier) VALUES
    ('inv-1', 'demo-tenant-123', 'Paracetamol 500mg', 'Medicine', 1000, 'tablets', 100, 0.50, 'Pharma Corp'),
    ('inv-2', 'demo-tenant-123', 'Ibuprofen 400mg', 'Medicine', 500, 'tablets', 50, 0.75, 'MedSupply Inc'),
    ('inv-3', 'demo-tenant-123', 'Bandage', 'Medical Supplies', 200, 'pieces', 20, 1.25, 'Health Supplies Co'),
    ('inv-4', 'demo-tenant-123', 'Syringe 5ml', 'Medical Supplies', 300, 'pieces', 30, 0.80, 'Medical Devices Ltd'),
    ('inv-5', 'demo-tenant-123', 'Gloves Latex', 'Medical Supplies', 1000, 'pairs', 100, 0.15, 'Safety Products Inc'),
    ('inv-6', 'demo-tenant-123', 'Thermometer', 'Equipment', 25, 'pieces', 5, 12.50, 'Medical Equipment Co'),
    ('inv-7', 'demo-tenant-123', 'Blood Pressure Monitor', 'Equipment', 10, 'pieces', 2, 85.00, 'Health Tech Solutions'),
    ('inv-8', 'demo-tenant-123', 'Alcohol Swabs', 'Medical Supplies', 500, 'pieces', 50, 0.10, 'Sterile Products Inc')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE INVOICES
-- =====================================================

-- Insert sample invoices
INSERT INTO invoices (id, tenant_id, patient_id, user_id, invoice_number, description, amount, tax_percent, total_amount, payment_method, status, due_date) VALUES
    ('inv-1', 'demo-tenant-123', 'pat-1', 'user-admin-1', 'INV-2026-001', 'General Consultation Fee', 50.00, 5.00, 52.50, 'Cash', 'paid', '2026-04-10'),
    ('inv-2', 'demo-tenant-123', 'pat-2', 'user-admin-1', 'INV-2026-002', 'Specialist Consultation + Lab Tests', 150.00, 5.00, 157.50, 'Credit Card', 'paid', '2026-04-15'),
    ('inv-3', 'demo-tenant-123', 'pat-3', 'user-admin-1', 'INV-2026-003', 'Emergency Room Visit', 200.00, 5.00, 210.00, 'Insurance', 'unpaid', '2026-04-20'),
    ('inv-4', 'demo-tenant-123', 'pat-4', 'user-admin-1', 'INV-2026-004', 'Pediatric Consultation', 75.00, 5.00, 78.75, 'Cash', 'paid', '2026-04-25'),
    ('inv-5', 'demo-tenant-123', 'pat-5', 'user-admin-1', 'INV-2026-005', 'Cardiology Consultation + ECG', 140.00, 5.00, 147.00, 'Insurance', 'unpaid', '2026-04-30')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Sample Data Seeding Complete!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Sample users created: 4';
    RAISE NOTICE 'Sample employees created: 6';
    RAISE NOTICE 'Sample patients created: 8';
    RAISE NOTICE 'Sample appointments created: 8';
    RAISE NOTICE 'Sample encounters created: 5';
    RAISE NOTICE 'Sample inventory items: 8';
    RAISE NOTICE 'Sample invoices created: 5';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Default login credentials:';
    RAISE NOTICE 'Email: admin@hospital.com | Password: admin123';
    RAISE NOTICE 'Email: doctor@hospital.com | Password: doctor123';
    RAISE NOTICE 'Email: nurse@hospital.com | Password: nurse123';
    RAISE NOTICE 'Email: reception@hospital.com | Password: reception123';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Database is ready with sample data!';
    RAISE NOTICE '====================================================';
END $$;
