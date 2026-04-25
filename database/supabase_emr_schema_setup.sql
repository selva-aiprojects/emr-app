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
CREATE TABLE IF NOT EXISTS nexus.tenants (
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
CREATE TABLE IF NOT EXISTS nexus.users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.patients (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.departments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.employees (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.appointments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES nexus.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES nexus.employees(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.encounters (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES nexus.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES nexus.employees(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.invoices (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES nexus.patients(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES nexus.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.inventory (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.services (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS nexus.fhir_resources (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_data JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, resource_type, resource_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tenant indexes
CREATE INDEX IF NOT EXISTS idx_emr_users_tenant_id ON nexus.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_patients_tenant_id ON nexus.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_tenant_id ON nexus.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_tenant_id ON nexus.encounters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_tenant_id ON nexus.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_inventory_tenant_id ON nexus.inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_services_tenant_id ON nexus.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_departments_tenant_id ON nexus.departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_employees_tenant_id ON nexus.employees(tenant_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_emr_patients_active ON nexus.patients(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_date ON nexus.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_status ON nexus.appointments(status);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_patient ON nexus.encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_date ON nexus.encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_status ON nexus.invoices(status);
CREATE INDEX IF NOT EXISTS idx_emr_inventory_category ON nexus.inventory(category);
CREATE INDEX IF NOT EXISTS idx_emr_services_category ON nexus.services(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all EMR schema tables
ALTER TABLE nexus.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.fhir_resources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Tenants policy
CREATE POLICY "Admins can view all tenants" ON nexus.tenants
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Users policy
CREATE POLICY "Users can view tenant users" ON nexus.users
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- Similar policies for other tables
CREATE POLICY "Users can view tenant patients" ON nexus.patients
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant appointments" ON nexus.appointments
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant encounters" ON nexus.encounters
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant invoices" ON nexus.invoices
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant inventory" ON nexus.inventory
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant services" ON nexus.services
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant departments" ON nexus.departments
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant employees" ON nexus.employees
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant fhir_resources" ON nexus.fhir_resources
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION nexus.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_emr_tenants_updated_at BEFORE UPDATE ON nexus.tenants
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_users_updated_at BEFORE UPDATE ON nexus.users
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_patients_updated_at BEFORE UPDATE ON nexus.patients
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_departments_updated_at BEFORE UPDATE ON nexus.departments
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_employees_updated_at BEFORE UPDATE ON nexus.employees
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_appointments_updated_at BEFORE UPDATE ON nexus.appointments
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_encounters_updated_at BEFORE UPDATE ON nexus.encounters
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_invoices_updated_at BEFORE UPDATE ON nexus.invoices
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_inventory_updated_at BEFORE UPDATE ON nexus.inventory
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_services_updated_at BEFORE UPDATE ON nexus.services
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

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
