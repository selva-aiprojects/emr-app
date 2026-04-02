-- =====================================================
-- TEST BASIC TABLES CREATION
-- =====================================================

-- Create custom EMR schema
CREATE SCHEMA IF NOT EXISTS emr;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TENANT MANAGEMENT
CREATE TABLE IF NOT EXISTS emr.tenants (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    subdomain TEXT UNIQUE,
    contact_email TEXT,
    theme JSONB,
    features JSONB,
    billing_config JSONB,
    status TEXT DEFAULT 'active',
    subscription_tier TEXT DEFAULT 'Free',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER MANAGEMENT
CREATE TABLE IF NOT EXISTS emr.users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT REFERENCES emr.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    patient_id TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS emr.departments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    head_of_dept TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMPLOYEES
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
    salary DECIMAL(12,2),
    bank_account TEXT,
    pan_number TEXT,
    aadhaar_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PATIENT MANAGEMENT (ENHANCED WITH ALL MISSING COLUMNS)
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
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    blood_type TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    medical_history TEXT,
    allergies TEXT,
    is_active BOOLEAN DEFAULT true,
    mrn TEXT UNIQUE,
    blood_group TEXT,
    primary_doctor_id TEXT REFERENCES emr.users(id),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- FHIR Compliance Fields
    fhir_patient_ref TEXT,
    communication_language TEXT DEFAULT 'en',
    marital_status TEXT,
    religion TEXT,
    ethnicity TEXT,
    birth_place TEXT,
    multiple_birth_indicator BOOLEAN DEFAULT false,
    multiple_birth_order INTEGER,
    general_practitioner_id TEXT REFERENCES emr.users(id),
    managing_organization_id TEXT,
    preferred_contact_method TEXT,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_coverage_ids TEXT[],
    care_team_provider_ids TEXT[]
);

-- APPOINTMENTS (ENHANCED WITH ALL MISSING COLUMNS)
CREATE TABLE IF NOT EXISTS emr.appointments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
    department_id TEXT REFERENCES emr.departments(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30,
    type TEXT,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for users.patient_id after patients table is created
ALTER TABLE emr.users ADD CONSTRAINT fk_users_patient_id 
    FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE SET NULL;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'BASIC TABLES CREATION SUCCESSFUL!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '- emr.tenants';
    RAISE NOTICE '- emr.users';
    RAISE NOTICE '- emr.departments';
    RAISE NOTICE '- emr.employees';
    RAISE NOTICE '- emr.patients';
    RAISE NOTICE '- emr.appointments';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Basic EMR structure ready!';
    RAISE NOTICE '====================================================';
END $$;
