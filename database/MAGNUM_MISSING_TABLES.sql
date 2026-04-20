-- Add missing billing and insurance tables to MAGNUM schema

-- Set search path
SET search_path TO magnum;

-- Missing billing tables
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

-- Indexes for missing tables
CREATE INDEX IF NOT EXISTS idx_magnum_billing_items_tenant ON magnum.billing_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_billing_concessions_tenant ON magnum.billing_concessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_insurance_providers_tenant ON magnum.insurance_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_insurance_pre_auth_tenant ON magnum.insurance_pre_auth(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_patient_insurance_tenant ON magnum.patient_insurance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_corporate_clients_tenant ON magnum.corporate_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_corporate_bills_tenant ON magnum.corporate_bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magnum_corporate_bill_items_tenant ON magnum.corporate_bill_items(tenant_id);

-- Enable RLS for missing tables
ALTER TABLE magnum.billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.billing_concessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.insurance_pre_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.corporate_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE magnum.corporate_bill_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for missing tables
CREATE POLICY billing_items_tenant_isolation ON magnum.billing_items
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY billing_concessions_tenant_isolation ON magnum.billing_concessions
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

-- Update triggers for missing tables
CREATE TRIGGER update_billing_items_updated_at BEFORE UPDATE ON magnum.billing_items FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_billing_concessions_updated_at BEFORE UPDATE ON magnum.billing_concessions FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_insurance_providers_updated_at BEFORE UPDATE ON magnum.insurance_providers FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_insurance_pre_auth_updated_at BEFORE UPDATE ON magnum.insurance_pre_auth FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_patient_insurance_updated_at BEFORE UPDATE ON magnum.patient_insurance FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_corporate_clients_updated_at BEFORE UPDATE ON magnum.corporate_clients FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_corporate_bills_updated_at BEFORE UPDATE ON magnum.corporate_bills FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();
CREATE TRIGGER update_corporate_bill_items_updated_at BEFORE UPDATE ON magnum.corporate_bill_items FOR EACH ROW EXECUTE FUNCTION magnum.update_updated_at_column();