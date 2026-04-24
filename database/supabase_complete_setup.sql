-- =====================================================
-- EMR Application - Complete Supabase Database Setup
-- =====================================================
-- Run this script in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vfmnjnwcorlqwxqdklfi/sql
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TENANT MANAGEMENT
-- =====================================================

-- Tenants table for multi-tenancy
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    subscription_tier TEXT DEFAULT 'Free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER MANAGEMENT
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- =====================================================
-- PATIENT MANAGEMENT
-- =====================================================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    blood_type TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_history TEXT,
    allergies TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEPARTMENTS
-- =====================================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    head_of_dept TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMPLOYEES
-- =====================================================

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    department TEXT,
    join_date DATE,
    salary DECIMAL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- =====================================================
-- APPOINTMENTS
-- =====================================================

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30, -- minutes
    status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENCOUNTERS (Medical Visits)
-- =====================================================

-- Encounters table
CREATE TABLE IF NOT EXISTS encounters (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    encounter_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encounter_type TEXT, -- consultation, follow-up, emergency
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVOICE & BILLING
-- =====================================================

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'unpaid', -- unpaid, paid, partially_paid, overdue
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVENTORY
-- =====================================================

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT,
    min_stock INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    supplier TEXT,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SERVICES CATALOG
-- =====================================================

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    category TEXT,
    base_rate DECIMAL(10,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- =====================================================
-- FHIR RESOURCES
-- =====================================================

-- FHIR Resources table
CREATE TABLE IF NOT EXISTS fhir_resources (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_data JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, resource_type, resource_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tenant indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_encounters_tenant_id ON encounters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_resources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Tenants policy (only admins can see all tenants)
CREATE POLICY "Admins can view all tenants" ON tenants
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Users policy (users can only see users from their tenant)
CREATE POLICY "Users can view tenant users" ON users
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- Patients policy (users can only see patients from their tenant)
CREATE POLICY "Users can view tenant patients" ON patients
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- Appointments policy (users can only see appointments from their tenant)
CREATE POLICY "Users can view tenant appointments" ON appointments
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- Similar policies for other tables
CREATE POLICY "Users can view tenant encounters" ON encounters
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant invoices" ON invoices
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant inventory" ON inventory
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant services" ON services
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant departments" ON departments
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant employees" ON employees
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant fhir_resources" ON fhir_resources
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON encounters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample tenant
INSERT INTO tenants (id, name, email, subscription_tier) 
VALUES ('demo-tenant-123', 'Demo Hospital', 'demo@hospital.com', 'Professional')
ON CONFLICT (id) DO NOTHING;

-- Insert sample departments
INSERT INTO departments (id, tenant_id, name, description, head_of_dept) VALUES
    ('dept-1', 'demo-tenant-123', 'General Medicine', 'General medical services', 'Dr. Smith'),
    ('dept-2', 'demo-tenant-123', 'Emergency', 'Emergency medical services', 'Dr. Johnson'),
    ('dept-3', 'demo-tenant-123', 'Pediatrics', 'Pediatric care', 'Dr. Wilson'),
    ('dept-4', 'demo-tenant-123', 'Cardiology', 'Cardiac care', 'Dr. Brown')
ON CONFLICT (id) DO NOTHING;

-- Insert sample services
INSERT INTO services (id, tenant_id, name, code, category, base_rate, tax_percent, description) VALUES
    ('svc-1', 'demo-tenant-123', 'General Consultation', 'GC001', 'Consultation', 50.00, 5.00, 'General physician consultation'),
    ('svc-2', 'demo-tenant-123', 'Specialist Consultation', 'SC001', 'Consultation', 100.00, 5.00, 'Specialist doctor consultation'),
    ('svc-3', 'demo-tenant-123', 'Complete Blood Count', 'LAB001', 'Laboratory', 25.00, 5.00, 'Complete blood count test'),
    ('svc-4', 'demo-tenant-123', 'X-Ray Chest', 'RAD001', 'Radiology', 75.00, 5.00, 'Chest X-ray examination'),
    ('svc-5', 'demo-tenant-123', 'ECG', 'CARD001', 'Cardiology', 40.00, 5.00, 'Electrocardiogram'),
    ('svc-6', 'demo-tenant-123', 'Vaccination', 'IMM001', 'Immunization', 30.00, 5.00, 'Routine vaccination')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'EMR Database Setup Complete!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Tables created: 12';
    RAISE NOTICE 'Indexes created: 18';
    RAISE NOTICE 'RLS policies created: 11';
    RAISE NOTICE 'Triggers created: 10';
    RAISE NOTICE 'Sample data inserted: 1 tenant, 4 departments, 6 services';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Database is ready for EMR application!';
    RAISE NOTICE '====================================================';
END $$;
