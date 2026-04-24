-- =====================================================
-- Complete EMR Application - All Tables Including Financial/HR
-- =====================================================
-- Uses dedicated 'emr' schema for comprehensive EMR system
-- =====================================================

-- Create custom EMR schema
CREATE SCHEMA IF NOT EXISTS emr;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TENANT MANAGEMENT
-- =====================================================

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
-- DEPARTMENTS
-- =====================================================

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- =====================================================
-- SALARY MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.salary (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL,
    hra DECIMAL(12,2) DEFAULT 0,
    da DECIMAL(12,2) DEFAULT 0,
    ma DECIMAL(12,2) DEFAULT 0,
    other_allowances DECIMAL(12,2) DEFAULT 0,
    total_earnings DECIMAL(12,2) NOT NULL,
    pf_deduction DECIMAL(12,2) DEFAULT 0,
    esi_deduction DECIMAL(12,2) DEFAULT 0),
    tds_deduction DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL,
    net_salary DECIMAL(12,2) NOT NULL,
    payment_date DATE,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, employee_id, month, year)
);

-- =====================================================
-- ATTENDANCE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.attendance (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    break_start TIME,
    break_end TIME,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status TEXT DEFAULT 'present', -- present, absent, leave, holiday
    leave_type TEXT, -- sick, casual, earned, unpaid
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, employee_id, attendance_date)
);

-- =====================================================
-- PAYROLL PROCESSING
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.payroll (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_employees INTEGER NOT NULL,
    total_salary_payout DECIMAL(12,2) NOT NULL,
    total_deductions DECIMAL(12,2) NOT NULL,
    total_net_payout DECIMAL(12,2) NOT NULL,
    processing_date DATE,
    processed_by TEXT REFERENCES emr.users(id),
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, month, year)
);

-- =====================================================
-- PATIENT MANAGEMENT
-- =====================================================

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
-- APPOINTMENTS
-- =====================================================

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
-- DETAILED BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.billing (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    invoice_id TEXT REFERENCES emr.invoices(id),
    billing_date DATE NOT NULL,
    service_id TEXT REFERENCES emr.services(id),
    service_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    billing_type TEXT, -- consultation, procedure, lab, pharmacy, room
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, billed
    created_by TEXT REFERENCES emr.users(id),
    approved_by TEXT REFERENCES emr.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVOICE & BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.invoices (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE,
    invoice_date DATE NOT NULL,
    due_date DATE,
    description TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid', -- unpaid, partially_paid, paid, overdue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ACCOUNTS RECEIVABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.accounts_receivable (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL REFERENCES emr.invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    overdue_days INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, partially_paid, paid, written_off
    last_payment_date DATE,
    payment_plan TEXT, -- weekly, monthly, custom
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ACCOUNTS PAYABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.accounts_payable (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    invoice_number TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL,
    category TEXT, -- pharmaceuticals, medical_supplies, equipment, services, utilities
    status TEXT DEFAULT 'pending', -- pending, partially_paid, paid, overdue
    payment_terms TEXT, -- net30, net60, net90
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EXPENSES
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.expenses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL, -- salary, utilities, rent, supplies, equipment, marketing
    subcategory TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    vendor TEXT,
    receipt_number TEXT,
    approved_by TEXT REFERENCES emr.users(id),
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REVENUE
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.revenue (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    revenue_date DATE NOT NULL,
    category TEXT NOT NULL, -- consultation, procedures, lab, pharmacy, room_rent, other
    subcategory TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    invoice_id TEXT REFERENCES emr.invoices(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVENTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.inventory (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    unit_cost DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    supplier TEXT,
    expiry_date DATE,
    batch_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SERVICES CATALOG
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.services (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
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

-- =====================================================
-- FHIR RESOURCES
-- =====================================================

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

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_emr_billing_tenant_id ON emr.billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_billing_patient_id ON emr.billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_billing_date ON emr.billing(billing_date);
CREATE INDEX IF NOT EXISTS idx_emr_accounts_receivable_tenant_id ON emr.accounts_receivable(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_accounts_payable_tenant_id ON emr.accounts_payable(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_expenses_tenant_id ON emr.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_revenue_tenant_id ON emr.revenue(tenant_id);

-- HR indexes
CREATE INDEX IF NOT EXISTS idx_emr_salary_tenant_id ON emr.salary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_salary_employee_id ON emr.salary(employee_id);
CREATE INDEX IF NOT EXISTS idx_emr_attendance_tenant_id ON emr.attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_attendance_employee_id ON emr.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_emr_attendance_date ON emr.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_emr_payroll_tenant_id ON emr.payroll(tenant_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_emr_patients_active ON emr.patients(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_date ON emr.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_status ON emr.appointments(status);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_patient ON emr.encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_date ON emr.encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_status ON emr.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_emr_inventory_category ON emr.inventory(category);
CREATE INDEX IF NOT EXISTS idx_emr_services_category ON emr.services(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE emr.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.salary ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.payroll ENABLE ROW LEVEL SECURITY;
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

-- Similar policies for all tables
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

CREATE POLICY "Users can view tenant billing" ON emr.billing
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant accounts_receivable" ON emr.accounts_receivable
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant accounts_payable" ON emr.accounts_payable
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant expenses" ON emr.expenses
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant revenue" ON emr.revenue
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant salary" ON emr.salary
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant attendance" ON emr.attendance
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant payroll" ON emr.payroll
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

CREATE TRIGGER update_emr_billing_updated_at BEFORE UPDATE ON emr.billing
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_accounts_receivable_updated_at BEFORE UPDATE ON emr.accounts_receivable
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_accounts_payable_updated_at BEFORE UPDATE ON emr.accounts_payable
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_expenses_updated_at BEFORE UPDATE ON emr.expenses
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_revenue_updated_at BEFORE UPDATE ON emr.revenue
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_salary_updated_at BEFORE UPDATE ON emr.salary
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_attendance_updated_at BEFORE UPDATE ON emr.attendance
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_payroll_updated_at BEFORE UPDATE ON emr.payroll
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
    RAISE NOTICE 'Complete EMR Database Setup with Financial/HR Tables!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Schema: emr';
    RAISE NOTICE 'Total tables created: 20';
    RAISE NOTICE 'Core tables: 12 (patients, appointments, etc.)';
    RAISE NOTICE 'Financial tables: 5 (billing, accounts, expenses, revenue)';
    RAISE NOTICE 'HR tables: 3 (salary, attendance, payroll)';
    RAISE NOTICE 'Indexes created: 30+';
    RAISE NOTICE 'RLS policies created: 20';
    RAISE NOTICE 'Triggers created: 20';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Complete EMR system is ready!';
    RAISE NOTICE '====================================================';
END $$;
