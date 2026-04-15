-- ============================================================
-- SHARD MASTER BASELINE (DATA PLANE / INSTITUTIONAL NODES)
-- ============================================================
-- Version: 2.3.1 (Updated with audit log fixes and latest institutional tables)
-- Architecture: Institutional Isolation
-- Description: Canonical DDL containing 60+ tables for full EMR operations.
-- Updated: Includes audit log fixes, institutional branding, and all latest migrations
-- ============================================================

-- SCHEMA UTILITIES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
    emergency_contact character varying(128),
    insurance character varying(256),
    medical_history jsonb DEFAULT '{"allergies": "", "surgeries": "", "familyHistory": "", "chronicConditions": ""}',
    ethnicity character varying(64),
    language character varying(64),
    birth_place text,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frontdesk_visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
    token_number integer NOT NULL,
    visit_type character varying(50) DEFAULT 'General',
    status character varying(20) DEFAULT 'waiting',
    check_in_time timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS walkins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
    token_number integer NOT NULL,
    triage_category character varying(20),
    chief_complaint text,
    vitals jsonb,
    priority_level integer DEFAULT 3,
    check_in_time timestamp with time zone DEFAULT now(),
    status character varying(20) DEFAULT 'waiting',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id uuid,
    appointment_type character varying(50) DEFAULT 'consultation',
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    actual_start timestamp with time zone,
    actual_end timestamp with time zone,
    status character varying(20) DEFAULT 'scheduled',
    priority character varying(20) DEFAULT 'routine',
    reason text,
    notes text,
    cancellation_reason text,
    rescheduled_from uuid REFERENCES appointments(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS encounters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id uuid,
    appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
    encounter_type character varying(50) NOT NULL,
    visit_date date NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    chief_complaint text,
    diagnosis text,
    assessment text,
    plan text,
    status character varying(20) DEFAULT 'active',
    vitals jsonb,
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

CREATE TABLE IF NOT EXISTS conditions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
    code text,
    display text,
    category text,
    clinical_status text DEFAULT 'active',
    verification_status text DEFAULT 'confirmed',
    severity text,
    onset_date date,
    recorded_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS observations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
    code text NOT NULL,
    display text,
    value_quantity numeric,
    value_string text,
    value_json jsonb,
    unit text,
    status text DEFAULT 'final',
    effective_at timestamp with time zone DEFAULT now(),
    recorded_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS procedures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
    code text NOT NULL,
    display text,
    status text DEFAULT 'completed',
    performed_at timestamp with time zone DEFAULT now(),
    notes text,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS medication_administrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name text NOT NULL,
    dosage_given text,
    administered_at timestamp with time zone DEFAULT now(),
    administered_by uuid,
    status text DEFAULT 'completed',
    notes text
);

-- ============================================================
-- 2. DIAGNOSTICS & LABORATORY
-- ============================================================

CREATE TABLE IF NOT EXISTS lab_tests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code character varying(50) UNIQUE,
    category text,
    base_price numeric(10,2),
    normal_range text,
    unit text,
    status character varying(20) DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
    test_id uuid REFERENCES lab_tests(id) ON DELETE SET NULL,
    test_name text NOT NULL,
    category text,
    results jsonb DEFAULT '{}',
    conclusion text,
    status character varying(20) DEFAULT 'final',
    performed_by uuid,
    issued_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 3. INSTITUTIONAL MASTERS (UPDATED)
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code character varying(64),
    description text,
    head_of_dept character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code character varying(64) NOT NULL,
    category character varying(64) DEFAULT 'Clinical',
    base_rate decimal(12,2) DEFAULT 0,
    tax_percent decimal(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(tenant_id, code)
);

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
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(tenant_id, name)
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
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(tenant_id, ward_id, bed_number)
);

-- ============================================================
-- 4. INPATIENT MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS admissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
    ward_id uuid REFERENCES wards(id) ON DELETE SET NULL,
    bed_id uuid REFERENCES beds(id) ON DELETE SET NULL,
    admission_date timestamp with time zone NOT NULL,
    discharge_date timestamp with time zone,
    admission_type character varying(50),
    diagnosis text,
    status character varying(20) DEFAULT 'admitted',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discharges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE CASCADE,
    admission_id uuid REFERENCES admissions(id) ON DELETE CASCADE,
    discharge_date date NOT NULL,
    discharge_type character varying(50) NOT NULL,
    final_diagnosis text,
    outcome character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 5. BLOOD BANK
-- ============================================================

CREATE TABLE IF NOT EXISTS donors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    blood_group character varying(8) NOT NULL,
    phone character varying(32),
    last_donation_date date,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blood_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    donor_id uuid REFERENCES donors(id) ON DELETE SET NULL,
    blood_group character varying(10) NOT NULL,
    volume_ml DECIMAL(10,2) NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blood_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
    requested_group VARCHAR(10) NOT NULL,
    volume_ml DECIMAL(10,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. AMBULANCE & EMERGENCY
-- ============================================================

CREATE TABLE IF NOT EXISTS ambulances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    vehicle_number VARCHAR(64) NOT NULL UNIQUE,
    model VARCHAR(255),
    current_driver VARCHAR(255),
    contact_number VARCHAR(32),
    status VARCHAR(32) DEFAULT 'Available',
    last_location_lat DECIMAL(10,8),
    last_location_lng DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulance_trips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    ambulance_id uuid REFERENCES ambulances(id) ON DELETE SET NULL,
    patient_name VARCHAR(255),
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    priority VARCHAR(16) DEFAULT 'normal',
    status VARCHAR(32) DEFAULT 'En Route',
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- 7. DOCUMENT MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid,
    encounter_id uuid,
    category VARCHAR(64) DEFAULT 'other',
    title VARCHAR(255) NOT NULL,
    file_name TEXT NOT NULL,
    mime_type VARCHAR(128),
    storage_key TEXT,
    size_bytes BIGINT DEFAULT 0,
    tags JSONB DEFAULT '[]',
    uploaded_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    document_id uuid NOT NULL,
    action VARCHAR(64) NOT NULL,
    actor_id uuid,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 8. SERVICE REQUESTS (UPDATED)
-- ============================================================

CREATE TABLE IF NOT EXISTS service_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
    requester_id uuid,
    category VARCHAR(64) DEFAULT 'lab',
    code VARCHAR(64),
    display VARCHAR(255),
    status VARCHAR(32) DEFAULT 'pending',
    priority VARCHAR(32) DEFAULT 'routine',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. FINANCE & BILLING
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    invoice_number character varying(50) NOT NULL UNIQUE,
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2) DEFAULT 0,
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
    quantity numeric(10,2) NOT NULL,
    rate numeric(10,2) NOT NULL,
    amount numeric(10,2) NOT NULL,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    category text NOT NULL,
    amount numeric(12,2) NOT NULL,
    description text,
    date date NOT NULL,
    status text DEFAULT 'paid',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    contact_person text,
    email text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 10. HR & PAYROLL
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    code character varying(20) NOT NULL UNIQUE,
    name text NOT NULL,
    email text,
    phone character varying(32),
    department text,
    designation text,
    salary numeric(10,2),
    join_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_structures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    basic_salary numeric(10,2) NOT NULL,
    allowances jsonb DEFAULT '{}',
    deductions jsonb DEFAULT '{}',
    effective_date date NOT NULL,
    status character varying(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    period_month integer NOT NULL,
    period_year integer NOT NULL,
    total_net numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'pending',
    processed_date date,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    payroll_run_id uuid NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    basic_salary numeric(10,2) NOT NULL,
    allowances numeric(10,2) DEFAULT 0,
    deductions numeric(10,2) DEFAULT 0,
    net_salary numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 11. IDENTITY & INFRASTRUCTURE
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    name text NOT NULL UNIQUE,
    description text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    ticket_number character varying(50) NOT NULL UNIQUE,
    title text NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    priority character varying(20) DEFAULT 'medium',
    status character varying(20) DEFAULT 'open',
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    status character varying(20) DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid,
    user_name text,
    action character varying(100) NOT NULL,
    table_name character varying(100),
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    timestamp timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 12. ADDITIONAL COMPREHENSIVE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS employee_leaves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL REFERENCES employees(id),
    leave_type character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days_taken integer NOT NULL,
    status character varying(20) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pharmacy_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    alert_type character varying(50) NOT NULL,
    message text NOT NULL,
    severity character varying(20) NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    item_code character varying(50),
    name text NOT NULL,
    category text,
    current_stock numeric(10,2) NOT NULL DEFAULT 0,
    reorder_level numeric(10,2) NOT NULL DEFAULT 0,
    unit character varying(20),
    unit_price numeric(10,2),
    expiry_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    item_id uuid REFERENCES inventory_items(id),
    supplier text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    purchase_date date NOT NULL,
    status character varying(20) DEFAULT 'ordered',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id),
    invoice_id uuid REFERENCES invoices(id),
    claim_number character varying(50),
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'submitted',
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
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- 13. TRIGGERS & INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_tenant ON service_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_patient ON service_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON service_requests(category);
CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_tenant_id ON document_audit_logs(tenant_id);

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name IN ('patients','appointments','encounters','clinical_records','prescriptions','wards','beds','admissions','discharges','invoices','employees','service_requests', 'conditions', 'diagnostic_reports', 'lab_tests', 'ambulances', 'blood_units', 'departments', 'services', 'documents', 'document_audit_logs'))
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- ============================================================
-- 14. BASE SEED DATA (CORE ROLES)
-- ============================================================

INSERT INTO roles (name, description, is_system) VALUES
('Admin', 'Institutional Administrator', true),
('Doctor', 'Clinical Practitioner', true),
('Nurse', 'Nursing Staff', true),
('Lab', 'Laboratory Technician', true),
('Pharmacy', 'Pharmacist', true)
ON CONFLICT (name) DO NOTHING;
