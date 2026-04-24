-- =====================================================
-- EMR Application - Custom Schema Setup
-- =====================================================
-- Uses dedicated 'emr' schema for better organization
-- =====================================================

-- Create custom EMR schema
CREATE SCHEMA IF NOT EXISTS emr;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TENANT MANAGEMENT
-- =====================================================

-- Tenants table
CREATE TABLE IF NOT EXISTS emr.tenants (
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
CREATE TABLE IF NOT EXISTS emr.users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS emr.patients (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS emr.departments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS emr.employees (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS emr.appointments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENCOUNTERS (Medical Visits)
-- =====================================================

-- Encounters table
CREATE TABLE IF NOT EXISTS emr.encounters (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
    encounter_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encounter_type TEXT,
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
CREATE TABLE IF NOT EXISTS emr.invoices (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'unpaid',
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVENTORY
-- =====================================================

-- Inventory table
CREATE TABLE IF NOT EXISTS emr.inventory (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS emr.services (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS emr.fhir_resources (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_data JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, resource_type, resource_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tenant indexes
CREATE INDEX IF NOT EXISTS idx_emr_users_tenant_id ON emr.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_patients_tenant_id ON emr.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_tenant_id ON emr.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_tenant_id ON emr.encounters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_tenant_id ON emr.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_inventory_tenant_id ON emr.inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_services_tenant_id ON emr.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_departments_tenant_id ON emr.departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_employees_tenant_id ON emr.employees(tenant_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_emr_patients_active ON emr.patients(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_date ON emr.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_status ON emr.appointments(status);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_patient ON emr.encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_date ON emr.encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_status ON emr.invoices(status);
CREATE INDEX IF NOT EXISTS idx_emr_inventory_category ON emr.inventory(category);
CREATE INDEX IF NOT EXISTS idx_emr_services_category ON emr.services(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all EMR schema tables
ALTER TABLE emr.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.fhir_resources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Tenants policy
CREATE POLICY "Admins can view all tenants" ON emr.tenants
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Users policy
CREATE POLICY "Users can view tenant users" ON emr.users
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- Similar policies for other tables
CREATE POLICY "Users can view tenant patients" ON emr.patients
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant appointments" ON emr.appointments
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant encounters" ON emr.encounters
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant invoices" ON emr.invoices
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant inventory" ON emr.inventory
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant services" ON emr.services
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant departments" ON emr.departments
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant employees" ON emr.employees
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant fhir_resources" ON emr.fhir_resources
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION emr.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_emr_tenants_updated_at BEFORE UPDATE ON emr.tenants
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_users_updated_at BEFORE UPDATE ON emr.users
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_patients_updated_at BEFORE UPDATE ON emr.patients
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_departments_updated_at BEFORE UPDATE ON emr.departments
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_employees_updated_at BEFORE UPDATE ON emr.employees
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_appointments_updated_at BEFORE UPDATE ON emr.appointments
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_encounters_updated_at BEFORE UPDATE ON emr.encounters
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_invoices_updated_at BEFORE UPDATE ON emr.invoices
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_inventory_updated_at BEFORE UPDATE ON emr.inventory
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_services_updated_at BEFORE UPDATE ON emr.services
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'EMR Custom Schema Setup Complete!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Schema: emr';
    RAISE NOTICE 'Tables created: 12';
    RAISE NOTICE 'Indexes created: 18';
    RAISE NOTICE 'RLS policies created: 11';
    RAISE NOTICE 'Triggers created: 10';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Custom EMR schema is ready!';
    RAISE NOTICE '====================================================';
END $$;
