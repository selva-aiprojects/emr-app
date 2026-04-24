-- Direct MAGNUM schema setup with all billing and insurance tables
-- This script creates all tables directly in the magnum schema

-- Enable the schema
CREATE SCHEMA IF NOT EXISTS magnum;

-- Set search path
SET search_path TO magnum;

-- Core clinical tables
CREATE TABLE IF NOT EXISTS magnum.patients (
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

CREATE TABLE IF NOT EXISTS magnum.frontdesk_visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    token_number integer NOT NULL,
    visit_date date NOT NULL DEFAULT CURRENT_DATE,
    visit_time time without time zone DEFAULT CURRENT_TIME,
    department character varying(64),
    doctor_id uuid,
    status character varying(32) DEFAULT 'waiting',
    priority character varying(16) DEFAULT 'normal',
    symptoms text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id character varying(32) UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    specialization character varying(128),
    license_number character varying(64),
    phone character varying(32),
    email text,
    department character varying(64),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    doctor_id uuid REFERENCES magnum.doctors(id) ON DELETE SET NULL,
    appointment_date date NOT NULL,
    appointment_time time without time zone NOT NULL,
    duration_minutes integer DEFAULT 30,
    status character varying(32) DEFAULT 'scheduled',
    type character varying(64),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Billing and insurance tables
CREATE TABLE IF NOT EXISTS magnum.billing_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    visit_id uuid REFERENCES magnum.frontdesk_visits(id) ON DELETE SET NULL,
    invoice_id uuid REFERENCES magnum.billing_invoices(id) ON DELETE SET NULL,
    item_code character varying(32) NOT NULL,
    item_name text NOT NULL,
    quantity numeric(10,2) DEFAULT 1,
    unit_price numeric(12,2) NOT NULL,
    total_amount numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_amount numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    net_amount numeric(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount + tax_amount) STORED,
    status character varying(32) DEFAULT 'pending',
    billed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.billing_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    invoice_number character varying(64) UNIQUE NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0,
    outstanding_amount numeric(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status character varying(32) DEFAULT 'unpaid',
    due_date date,
    issued_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.billing_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES magnum.billing_invoices(id) ON DELETE SET NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(32),
    transaction_id character varying(128),
    payment_date timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Advanced billing features
CREATE TABLE IF NOT EXISTS magnum.billing_concessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES magnum.billing_invoices(id) ON DELETE CASCADE,
    concession_type character varying(32) NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason text,
    approved_by uuid,
    approved_at timestamp with time zone,
    status character varying(32) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.billing_credit_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    original_invoice_id uuid REFERENCES magnum.billing_invoices(id) ON DELETE SET NULL,
    credit_note_number character varying(64) UNIQUE NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason text,
    issued_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.billing_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES magnum.billing_invoices(id) ON DELETE CASCADE,
    approval_type character varying(32) NOT NULL,
    amount numeric(12,2) NOT NULL,
    requested_by uuid NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    status character varying(32) DEFAULT 'pending',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insurance tables
CREATE TABLE IF NOT EXISTS magnum.insurance_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    provider_name text NOT NULL,
    provider_code character varying(32) UNIQUE NOT NULL,
    contact_person character varying(128),
    phone character varying(32),
    email text,
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.insurance_pre_auth (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    provider_id uuid REFERENCES magnum.insurance_providers(id) ON DELETE CASCADE,
    pre_auth_number character varying(64) UNIQUE NOT NULL,
    service_type character varying(64),
    estimated_amount numeric(12,2),
    approved_amount numeric(12,2),
    status character varying(32) DEFAULT 'pending',
    expiry_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.patient_insurance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    provider_id uuid REFERENCES magnum.insurance_providers(id) ON DELETE CASCADE,
    policy_number character varying(64) NOT NULL,
    group_number character varying(64),
    coverage_type character varying(32),
    coverage_percentage numeric(5,2) DEFAULT 100.00,
    deductible_amount numeric(12,2) DEFAULT 0,
    max_coverage_amount numeric(12,2),
    effective_date date,
    expiry_date date,
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Corporate billing tables
CREATE TABLE IF NOT EXISTS magnum.corporate_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    client_name text NOT NULL,
    client_code character varying(32) UNIQUE NOT NULL,
    contact_person character varying(128),
    phone character varying(32),
    email text,
    address text,
    billing_address text,
    credit_limit numeric(12,2),
    payment_terms character varying(64),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.corporate_bills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    client_id uuid REFERENCES magnum.corporate_clients(id) ON DELETE CASCADE,
    bill_number character varying(64) UNIQUE NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0,
    outstanding_amount numeric(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status character varying(32) DEFAULT 'unpaid',
    due_date date,
    issued_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magnum.corporate_bill_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    bill_id uuid REFERENCES magnum.corporate_bills(id) ON DELETE CASCADE,
    patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
    service_description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_magnum_patients_tenant ON magnum.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_patients_mrn ON magnum.patients(mrn);
CREATE INDEX IF NOT EXISTS idx_magnum_frontdesk_visits_tenant ON magnum.frontdesk_visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_frontdesk_visits_patient ON magnum.frontdesk_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_magnum_doctors_tenant ON magnum.doctors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_appointments_tenant ON magnum.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_billing_items_tenant ON magnum.billing_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_billing_invoices_tenant ON magnum.billing_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_billing_payments_tenant ON magnum.billing_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_billing_concessions_tenant ON magnum.billing_concessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_billing_credit_notes_tenant ON magnum.billing_credit_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_billing_approvals_tenant ON magnum.billing_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_insurance_providers_tenant ON magnum.insurance_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_insurance_pre_auth_tenant ON magnum.insurance_pre_auth(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_patient_insurance_tenant ON magnum.patient_insurance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_corporate_clients_tenant ON magnum.corporate_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_corporate_bills_tenant ON magnum.corporate_bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_corporate_bill_items_tenant ON magnum.corporate_bill_items(tenant_id);

-- Row Level Security policies
ALTER TABLE magnum.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.frontdesk_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.billing_concessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.billing_credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.billing_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.insurance_pre_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.corporate_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.corporate_bill_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (assuming current_tenant_id() function exists)
CREATE POLICY patients_tenant_isolation ON magnum.patients
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY frontdesk_visits_tenant_isolation ON magnum.frontdesk_visits
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY doctors_tenant_isolation ON magnum.doctors
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY appointments_tenant_isolation ON magnum.appointments
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY billing_items_tenant_isolation ON magnum.billing_items
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY billing_invoices_tenant_isolation ON magnum.billing_invoices
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY billing_payments_tenant_isolation ON magnum.billing_payments
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY billing_concessions_tenant_isolation ON magnum.billing_concessions
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY billing_credit_notes_tenant_isolation ON magnum.billing_credit_notes
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY billing_approvals_tenant_isolation ON magnum.billing_approvals
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY insurance_providers_tenant_isolation ON magnum.insurance_providers
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY insurance_pre_auth_tenant_isolation ON magnum.insurance_pre_auth
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY patient_insurance_tenant_isolation ON magnum.patient_insurance
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY corporate_clients_tenant_isolation ON magnum.corporate_clients
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY corporate_bills_tenant_isolation ON magnum.corporate_bills
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY corporate_bill_items_tenant_isolation ON magnum.corporate_bill_items
    FOR ALL USING (tenant_id = current_tenant_id());

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION magnum.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON magnum.patients FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_frontdesk_visits_updated_at BEFORE UPDATE ON magnum.frontdesk_visits FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON magnum.doctors FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON magnum.appointments FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_billing_items_updated_at BEFORE UPDATE ON magnum.billing_items FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_billing_invoices_updated_at BEFORE UPDATE ON magnum.billing_invoices FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_billing_payments_updated_at BEFORE UPDATE ON magnum.billing_payments FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_billing_concessions_updated_at BEFORE UPDATE ON magnum.billing_concessions FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_billing_credit_notes_updated_at BEFORE UPDATE ON magnum.billing_credit_notes FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_billing_approvals_updated_at BEFORE UPDATE ON magnum.billing_approvals FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_insurance_providers_updated_at BEFORE UPDATE ON magnum.insurance_providers FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_insurance_pre_auth_updated_at BEFORE UPDATE ON magnum.insurance_pre_auth FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_patient_insurance_updated_at BEFORE UPDATE ON magnum.patient_insurance FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_corporate_clients_updated_at BEFORE UPDATE ON magnum.corporate_clients FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_corporate_bills_updated_at BEFORE UPDATE ON magnum.corporate_bills FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_corporate_bill_items_updated_at BEFORE UPDATE ON magnum.corporate_bill_items FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();