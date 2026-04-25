-- ============================================================
-- SHARD MASTER BASELINE (DATA PLANE / INSTITUTIONAL NODES)
-- ============================================================
-- Version: 3.1.0 (Standardized for Multi-Tenant Shards)
-- Architecture: Institutional Isolation with Local Identity
-- Description: Canonical DDL for clinical shards (nhgl, magnum, etc.)
-- ============================================================

-- Ensure core utility function exists in shard
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- 0. LOCAL IDENTITY (SHARDED)
-- ============================================================
-- These tables provide local context for clinical operations 
-- while the global login remains in nexus.users

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(255) PRIMARY KEY, -- Usually 'Doctor', 'Nurse', etc.
    name VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY, -- References nexus.users(id) or email
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 1. CORE CLINICAL MODULES
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id),
    mrn VARCHAR(64) NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(16),
    phone VARCHAR(32),
    email TEXT,
    address TEXT,
    blood_group VARCHAR(8),
    emergency_contact VARCHAR(128),
    insurance VARCHAR(256),
    medical_history JSONB DEFAULT '{"allergies": "", "surgeries": "", "familyHistory": "", "chronicConditions": ""}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code VARCHAR(64),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id VARCHAR(255) REFERENCES users(id),
    appointment_type VARCHAR(50) DEFAULT 'consultation',
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS encounters (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255),
    appointment_id VARCHAR(255),
    encounter_type VARCHAR(50) NOT NULL,
    visit_date DATE NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    assessment TEXT,
    plan TEXT,
    status VARCHAR(20) DEFAULT 'active',
    vitals JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Laboratory & Radiology Requests
CREATE TABLE IF NOT EXISTS service_requests (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    encounter_id VARCHAR(255),
    requester_id VARCHAR(255),
    category VARCHAR(64) DEFAULT 'lab',
    code VARCHAR(64),
    display VARCHAR(255),
    status VARCHAR(32) DEFAULT 'pending',
    priority VARCHAR(32) DEFAULT 'routine',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OPD Token System
CREATE TABLE IF NOT EXISTS opd_tokens (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255),
    token_number INTEGER NOT NULL,
    token_prefix VARCHAR(10) DEFAULT 'OPD',
    full_token VARCHAR(20),
    status VARCHAR(20) DEFAULT 'waiting',
    priority VARCHAR(10) DEFAULT 'general',
    department_id VARCHAR(255),
    doctor_id VARCHAR(255),
    appointment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. INSTITUTIONAL MASTERS
-- ============================================================

CREATE TABLE IF NOT EXISTS wards (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity INTEGER,
    base_rate NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS beds (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    ward_id VARCHAR(255) NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    patient_id VARCHAR(255) REFERENCES patients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, ward_id, bed_number)
);

-- ============================================================
-- 3. INVENTORY & SUPPLY CHAIN
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64),
    stock_level DECIMAL(12,2) DEFAULT 0,
    reorder_level DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- ============================================================
-- 4. HRMS & EMPLOYEE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(255) UNIQUE REFERENCES users(id),
    employee_code VARCHAR(32) NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    designation VARCHAR(64),
    department_id VARCHAR(255) REFERENCES departments(id),
    salary_basic NUMERIC(12,2) DEFAULT 0,
    join_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    employee_id VARCHAR(255) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. FINANCE & BILLING
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    encounter_id VARCHAR(255),
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    paid NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    invoice_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OPD Specific Billing
CREATE TABLE IF NOT EXISTS opd_bills (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    bill_number VARCHAR(64) UNIQUE,
    total_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(32) DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. CLINICAL MASTERS (NEW)
-- ============================================================

CREATE TABLE IF NOT EXISTS specialities (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS diseases (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS treatments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    base_cost NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_encounters_updated_at ON encounters;
CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON encounters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_specialities_updated_at ON specialities;
CREATE TRIGGER update_specialities_updated_at BEFORE UPDATE ON specialities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diseases_updated_at ON diseases;
CREATE TRIGGER update_diseases_updated_at BEFORE UPDATE ON diseases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treatments_updated_at ON treatments;
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CANONICAL SEED DATA (SHARD LEVEL)
-- ============================================================

-- Roles Seed
INSERT INTO roles (id, name, permissions) VALUES 
('Admin', 'Administrator', '["*"]'),
('Doctor', 'Medical Doctor', '["clinical.*", "appointments.*", "patients.view"]'),
('Nurse', 'Nursing Staff', '["clinical.vitals", "appointments.view", "patients.view"]'),
('Pharmacy', 'Pharmacist', '["inventory.*", "pharmacy.*"]'),
('Lab', 'Lab Technician', '["lab.*"]'),
('Frontdesk', 'Front Desk', '["appointments.*", "patients.*", "billing.view"]')
ON CONFLICT (id) DO NOTHING;

-- Specialities Seed (Placeholder - tenant_id must be provided by the caller if not using a global trigger)
-- Since this runs during provisioning, we usually handle seeds in the provisioning service.
-- However, for reference, these are the standard entries.
