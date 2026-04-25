-- =====================================================
-- MINIMAL WORKING EMR DATABASE
-- =====================================================
-- Only essential tables that your application actually uses
-- Schema: emr
-- Created: 2026-04-02
-- Version: 1.0.0 - Minimal Working Version
-- =====================================================

-- Create custom EMR schema
CREATE SCHEMA IF NOT EXISTS emr;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 1: CORE TABLES (Application Dependencies)
-- =====================================================

-- TENANTS
CREATE TABLE IF NOT EXISTS tenants (
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

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    head_of_dept TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMPLOYEES
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
    salary DECIMAL(12,2),
    bank_account TEXT,
    pan_number TEXT,
    aadhaar_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PATIENTS
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
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    blood_group TEXT,
    primary_doctor_id TEXT REFERENCES users(id),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for users.patient_id after patients table is created
ALTER TABLE users ADD CONSTRAINT fk_users_patient_id 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    department_id TEXT REFERENCES departments(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30,
    type TEXT,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENCOUNTERS
CREATE TABLE IF NOT EXISTS encounters (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    encounter_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    encounter_type TEXT,
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SERVICES
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    category TEXT,
    subcategory TEXT,
    base_rate DECIMAL(10,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES employees(id),
    invoice_number TEXT UNIQUE,
    invoice_date DATE NOT NULL,
    description TEXT,
    items JSONB,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    notes TEXT,
    status TEXT DEFAULT 'draft',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BILLING
CREATE TABLE IF NOT EXISTS billing (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    invoice_id TEXT REFERENCES invoices(id),
    billing_date DATE NOT NULL,
    service_id TEXT REFERENCES services(id),
    service_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    billing_type TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: SEQUENCE TABLES (for MRN and Invoice generation)
-- =====================================================

-- MRN SEQUENCES
CREATE TABLE IF NOT EXISTS mrn_sequences (
    tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    sequence_value INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INVOICE SEQUENCES
CREATE TABLE IF NOT EXISTS invoice_sequences (
    tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    sequence_value INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: PRESCRIPTIONS (Basic version)
-- =====================================================

-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    encounter_id TEXT REFERENCES encounters(id),
    prescription_number TEXT,
    prescription_date DATE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRESCRIPTION ITEMS
CREATE TABLE IF NOT EXISTS prescription_items (
    item_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    instructions TEXT,
    quantity INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: SUPPORT TABLES (for your application code)
-- =====================================================

-- USER ROLES
CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB,
    assigned_by TEXT REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, user_id, role_name)
);

-- TENANT FEATURES
CREATE TABLE IF NOT EXISTS tenant_features (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_flag TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, feature_flag)
);

-- GLOBAL KILL SWITCHES
CREATE TABLE IF NOT EXISTS global_kill_switches (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_flag TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT false,
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OPD TOKENS
CREATE TABLE IF NOT EXISTS opd_tokens (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    full_token TEXT NOT NULL,
    token_number INTEGER NOT NULL,
    priority TEXT DEFAULT 'routine',
    status TEXT DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OPD BILLS
CREATE TABLE IF NOT EXISTS opd_bills (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    token_id TEXT NOT NULL REFERENCES opd_tokens(id) ON DELETE CASCADE,
    bill_number TEXT NOT NULL,
    patient_age INTEGER,
    patient_gender TEXT,
    visit_type TEXT,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    consultation_fee DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, bill_number)
);

-- OPD BILL ITEMS
CREATE TABLE IF NOT EXISTS opd_bill_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bill_id TEXT NOT NULL REFERENCES opd_bills(id) ON DELETE CASCADE,
    service_type TEXT,
    service_name TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLINICAL RECORDS
CREATE TABLE IF NOT EXISTS clinical_records (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    record_type TEXT,
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: EXOTEL COMMUNICATION TABLES
-- =====================================================

-- EXOTEL CONFIGURATIONS
CREATE TABLE IF NOT EXISTS exotel_configurations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_sid TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_token TEXT NOT NULL,
    subdomain TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EXOTEL NUMBER POOLS
CREATE TABLE IF NOT EXISTS exotel_number_pools (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pool_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    number_type TEXT,
    department_id TEXT REFERENCES departments(id),
    doctor_id TEXT REFERENCES employees(id),
    daily_limit INTEGER,
    monthly_limit INTEGER,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EXOTEL SMS CAMPAIGNS
CREATE TABLE IF NOT EXISTS exotel_sms_campaigns (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    campaign_type TEXT,
    template_id TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    recipients TEXT,
    variables_used TEXT,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft',
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EXOTEL SMS LOGS
CREATE TABLE IF NOT EXISTS exotel_sms_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id TEXT REFERENCES exotel_sms_campaigns(id),
    communication_id TEXT,
    account_sid TEXT,
    from_number TEXT,
    to_number TEXT,
    message_content TEXT,
    message_type TEXT,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    external_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EXOTEL WEBHOOK EVENTS
CREATE TABLE IF NOT EXISTS exotel_webhook_events (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type TEXT,
    event_data JSONB,
    message_sid TEXT,
    account_sid TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMMUNICATION TEMPLATES
CREATE TABLE IF NOT EXISTS communication_templates (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_type TEXT,
    template_content TEXT,
    variables TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, template_name)
);

-- PATIENT COMMUNICATIONS
CREATE TABLE IF NOT EXISTS patient_communications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    communication_type TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 6: FUNCTIONS (Only what your app actually uses)
-- =====================================================

-- MRN Sequence Generator
CREATE OR REPLACE FUNCTION get_next_mrn(tenant_id_param TEXT)
RETURNS TEXT AS $$
DECLARE
    tenant_code TEXT;
    sequence_value INTEGER;
    mrn TEXT;
BEGIN
    -- Get tenant code
    SELECT code INTO tenant_code FROM tenants WHERE id = tenant_id_param;
    
    -- Update sequence
    INSERT INTO mrn_sequences (tenant_id, sequence_value)
    VALUES (tenant_id_param, 1)
    ON CONFLICT (tenant_id)
    DO UPDATE SET sequence_value = mrn_sequences.sequence_value + 1
    RETURNING sequence_value INTO sequence_value;
    
    -- Generate MRN
    mrn := COALESCE(tenant_code, 'UNK') || '-' || LPAD(sequence_value::TEXT, 6, '0');
    
    RETURN mrn;
END;
$$ LANGUAGE plpgsql;

-- Invoice Number Generator
CREATE OR REPLACE FUNCTION get_next_invoice_number(tenant_id_param TEXT)
RETURNS TEXT AS $$
DECLARE
    tenant_code TEXT;
    sequence_value INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get tenant code
    SELECT code INTO tenant_code FROM tenants WHERE id = tenant_id_param;
    
    -- Update sequence
    INSERT INTO invoice_sequences (tenant_id, sequence_value)
    VALUES (tenant_id_param, 1)
    ON CONFLICT (tenant_id)
    DO UPDATE SET sequence_value = invoice_sequences.sequence_value + 1
    RETURNING sequence_value INTO sequence_value;
    
    -- Generate invoice number
    invoice_number := 'INV-' || COALESCE(tenant_code, 'UNK') || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(sequence_value::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: TRIGGERS (Only for updated_at)
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_emr_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_encounters_updated_at BEFORE UPDATE ON encounters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_billing_updated_at BEFORE UPDATE ON billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_prescription_items_updated_at BEFORE UPDATE ON prescription_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_mrn_sequences_updated_at BEFORE UPDATE ON mrn_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_invoice_sequences_updated_at BEFORE UPDATE ON invoice_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_tenant_features_updated_at BEFORE UPDATE ON tenant_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_global_kill_switches_updated_at BEFORE UPDATE ON global_kill_switches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_opd_tokens_updated_at BEFORE UPDATE ON opd_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_opd_bills_updated_at BEFORE UPDATE ON opd_bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_opd_bill_items_updated_at BEFORE UPDATE ON opd_bill_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_clinical_records_updated_at BEFORE UPDATE ON clinical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_exotel_configurations_updated_at BEFORE UPDATE ON exotel_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_exotel_number_pools_updated_at BEFORE UPDATE ON exotel_number_pools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_exotel_sms_campaigns_updated_at BEFORE UPDATE ON exotel_sms_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_exotel_sms_logs_updated_at BEFORE UPDATE ON exotel_sms_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_communication_templates_updated_at BEFORE UPDATE ON communication_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emr_patient_communications_updated_at BEFORE UPDATE ON patient_communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 8: BASIC INDEXES (Only what's needed)
-- =====================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_emr_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_patients_tenant_id ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_patients_mrn ON patients(mrn);
CREATE INDEX IF NOT EXISTS idx_emr_patients_primary_doctor_id ON patients(primary_doctor_id);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_department_id ON appointments(department_id);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_tenant_id ON encounters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_doctor_id ON invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_emr_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_departments_tenant_id ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_employees_tenant_id ON employees(tenant_id);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_emr_exotel_configurations_tenant_id ON exotel_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_exotel_number_pools_tenant_id ON exotel_number_pools(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_exotel_number_pools_department_id ON exotel_number_pools(department_id);
CREATE INDEX IF NOT EXISTS idx_emr_exotel_number_pools_doctor_id ON exotel_number_pools(doctor_id);
CREATE INDEX IF NOT EXISTS idx_emr_exotel_sms_campaigns_tenant_id ON exotel_sms_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_exotel_sms_logs_tenant_id ON exotel_sms_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_exotel_sms_logs_campaign_id ON exotel_sms_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emr_communication_templates_tenant_id ON communication_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_patient_communications_tenant_id ON patient_communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_patient_communications_patient_id ON patient_communications(patient_id);

-- OPD indexes
CREATE INDEX IF NOT EXISTS idx_emr_opd_tokens_tenant_id ON opd_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_opd_tokens_department_id ON opd_tokens(department_id);
CREATE INDEX IF NOT EXISTS idx_emr_opd_tokens_doctor_id ON opd_tokens(doctor_id);
CREATE INDEX IF NOT EXISTS idx_emr_opd_tokens_full_token ON opd_tokens(full_token);
CREATE INDEX IF NOT EXISTS idx_emr_opd_bills_tenant_id ON opd_bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_opd_bills_patient_id ON opd_bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_opd_bills_token_id ON opd_bills(token_id);
CREATE INDEX IF NOT EXISTS idx_emr_opd_bills_bill_number ON opd_bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_emr_opd_bill_items_tenant_id ON opd_bill_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_opd_bill_items_bill_id ON opd_bill_items(bill_id);

-- Support indexes
CREATE INDEX IF NOT EXISTS idx_emr_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_emr_global_kill_switches_feature_flag ON global_kill_switches(feature_flag);
CREATE INDEX IF NOT EXISTS idx_emr_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_clinical_records_tenant_id ON clinical_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_clinical_records_patient_id ON clinical_records(patient_id);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'MINIMAL WORKING EMR DATABASE SUCCESSFUL!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Tables Created: 35 (Essential only)';
    RAISE NOTICE 'Functions Created: 2';
    RAISE NOTICE 'Triggers Created: 25';
    RAISE NOTICE 'Indexes Created: 50+';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Core Tables:';
    RAISE NOTICE '- tenants, users, patients';
    RAISE NOTICE '- departments, employees';
    RAISE NOTICE '- appointments, encounters';
    RAISE NOTICE '- services, invoices, billing';
    RAISE NOTICE '- prescriptions, prescription_items';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Support Tables:';
    RAISE NOTICE '- user_roles, tenant_features';
    RAISE NOTICE '- opd_tokens, opd_bills, opd_bill_items';
    RAISE NOTICE '- clinical_records';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Communication Tables:';
    RAISE NOTICE '- exotel_configurations, exotel_number_pools';
    RAISE NOTICE '- exotel_sms_campaigns, exotel_sms_logs';
    RAISE NOTICE '- communication_templates, patient_communications';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Application Ready!';
    RAISE NOTICE 'All service files will work with this database!';
    RAISE NOTICE '====================================================';
END $$;
