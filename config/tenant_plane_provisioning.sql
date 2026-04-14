-- ============================================================
-- TENANT PLANE - PROVISIONING BASELINE
-- ============================================================
-- Architecture: Clinical Data Plane (Institutional Shards)
-- Description: Canonical DDL for all institutional tenant schemas.
-- ============================================================

-- ============================================================
-- 0. SCHEMA INITIALIZATION & IDENTITY SHARDS
-- ============================================================

-- Standardized Trigger Function for Timestamp Management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Identity & Authorization Shards (Institutional Roles)
CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL UNIQUE,
    description text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    category text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    role text,
    role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Seed Default Institutional Roles
INSERT INTO roles (name, description, is_system, tenant_id) VALUES
('Admin', 'Institutional Administrator', true, '00000000-0000-0000-0000-000000000000'),
('Doctor', 'Clinical Practitioner', true, '00000000-0000-0000-0000-000000000000'),
('Nurse', 'Nursing Staff', true, '00000000-0000-0000-0000-000000000000'),
('Lab', 'Laboratory Technician', true, '00000000-0000-0000-0000-000000000000'),
('Pharmacy', 'Pharmacist', true, '00000000-0000-0000-0000-000000000000'),
('Front Office', 'Reception and Registration', true, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 1. CORE CLINICAL MODULES
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    mrn character varying(64) NOT NULL UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date,
    gender character varying(16),
    phone character varying(32),
    email text,
    address text,
    blood_group character varying(8),
    emergency_contact text,
    insurance text,
    medical_history jsonb DEFAULT '{"allergies": "", "surgeries": "", "familyHistory": "", "chronicConditions": ""}',
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS encounters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id uuid,
    encounter_type character varying(50) NOT NULL,
    visit_date date NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    chief_complaint text,
    diagnosis text,
    assessment text,
    plan text,
    status character varying(20) DEFAULT 'active',
    vitals jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
    record_type character varying(50) NOT NULL,
    category character varying(50),
    content jsonb NOT NULL,
    provider_id uuid,
    recorded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    encounter_id uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id uuid,
    drug_name text NOT NULL,
    dosage text,
    frequency text,
    duration text,
    instructions text,
    status character varying(20) DEFAULT 'active',
    dispensed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conditions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    code character varying(64),
    display text,
    category character varying(32),
    severity character varying(16),
    onset_date date,
    status character varying(16) NOT NULL DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drug_allergies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen text NOT NULL,
    severity character varying(20) NOT NULL DEFAULT 'mild',
    reaction text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 1.2 FACILITY & DEPARTMENTAL MASTERS
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code text,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    category text,
    base_price numeric(10,2) DEFAULT 0,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 2. FACILITY & INPATIENT MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS wards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    type character varying(50) NOT NULL,
    capacity integer,
    floor integer,
    base_rate numeric(10,2),
    status character varying(20) DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS beds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    ward_id uuid NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number character varying(20) NOT NULL,
    type character varying(50),
    status character varying(20) DEFAULT 'available',
    patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
    ward_id uuid REFERENCES wards(id) ON DELETE SET NULL,
    bed_id uuid REFERENCES beds(id) ON DELETE SET NULL,
    admission_date timestamp with time zone NOT NULL,
    discharge_date timestamp with time zone,
    status character varying(20) DEFAULT 'admitted',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 3. LABORATORY & DIAGNOSTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS service_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
    requester_id uuid,
    category character varying(64) DEFAULT 'lab',
    code character varying(64),
    display text,
    status character varying(32) DEFAULT 'pending',
    priority character varying(32) DEFAULT 'routine',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_tests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    test_name text NOT NULL,
    category text NOT NULL,
    normal_range text,
    price numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_id uuid REFERENCES lab_tests(id) ON DELETE SET NULL,
    encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
    status character varying(20) NOT NULL,
    results jsonb DEFAULT '{}',
    conclusion text,
    issued_datetime timestamp with time zone,
    performed_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 4. FINANCIAL & BILLING
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    invoice_number character varying(50) NOT NULL UNIQUE,
    description text,
    total numeric(10,2) NOT NULL,
    paid numeric(10,2) DEFAULT 0,
    status character varying(20) DEFAULT 'pending',
    issue_date date DEFAULT current_date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 5. HUMAN RESOURCES
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    code character varying(20) NOT NULL UNIQUE,
    name text NOT NULL,
    email text,
    department text,
    designation text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 6. SHARED COMMUNICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    ticket_number character varying(50) NOT NULL UNIQUE,
    title text NOT NULL,
    description text,
    status character varying(20) DEFAULT 'open',
    priority character varying(20) DEFAULT 'medium',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 15. TRIGGERS FOR THE DATA PLANE
-- ============================================================

CREATE TRIGGER tr_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_encounters_updated_at BEFORE UPDATE ON encounters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_clinical_records_updated_at BEFORE UPDATE ON clinical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_conditions_updated_at BEFORE UPDATE ON conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_drug_allergies_updated_at BEFORE UPDATE ON drug_allergies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_wards_updated_at BEFORE UPDATE ON wards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_beds_updated_at BEFORE UPDATE ON beds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_admissions_updated_at BEFORE UPDATE ON admissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_lab_tests_updated_at BEFORE UPDATE ON lab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_diagnostic_reports_updated_at BEFORE UPDATE ON diagnostic_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_notices_updated_at BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- END OF TENANT PLANE PROVISIONING SQL
-- ============================================================
