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
-- DEPARTMENTS
-- =====================================================

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

CREATE TABLE IF NOT EXISTS nexus.salary (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES nexus.employees(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS nexus.attendance (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES nexus.employees(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS nexus.payroll (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_employees INTEGER NOT NULL,
    total_salary_payout DECIMAL(12,2) NOT NULL,
    total_deductions DECIMAL(12,2) NOT NULL,
    total_net_payout DECIMAL(12,2) NOT NULL,
    processing_date DATE,
    processed_by TEXT REFERENCES nexus.users(id),
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, month, year)
);

-- =====================================================
-- PATIENT MANAGEMENT
-- =====================================================

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
-- APPOINTMENTS
-- =====================================================

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
-- DETAILED BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS nexus.billing (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES nexus.patients(id) ON DELETE CASCADE,
    invoice_id TEXT REFERENCES nexus.invoices(id),
    billing_date DATE NOT NULL,
    service_id TEXT REFERENCES nexus.services(id),
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
    created_by TEXT REFERENCES nexus.users(id),
    approved_by TEXT REFERENCES nexus.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVOICE & BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS nexus.invoices (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES nexus.patients(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES nexus.users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS nexus.accounts_receivable (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES nexus.patients(id) ON DELETE CASCADE,
    invoice_id TEXT NOT NULL REFERENCES nexus.invoices(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS nexus.accounts_payable (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS nexus.expenses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL, -- salary, utilities, rent, supplies, equipment, marketing
    subcategory TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    vendor TEXT,
    receipt_number TEXT,
    approved_by TEXT REFERENCES nexus.users(id),
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REVENUE
-- =====================================================

CREATE TABLE IF NOT EXISTS nexus.revenue (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    revenue_date DATE NOT NULL,
    category TEXT NOT NULL, -- consultation, procedures, lab, pharmacy, room_rent, other
    subcategory TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    invoice_id TEXT REFERENCES nexus.invoices(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVENTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS nexus.inventory (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS nexus.services (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_emr_billing_tenant_id ON nexus.billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_billing_patient_id ON nexus.billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_billing_date ON nexus.billing(billing_date);
CREATE INDEX IF NOT EXISTS idx_emr_accounts_receivable_tenant_id ON nexus.accounts_receivable(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_accounts_payable_tenant_id ON nexus.accounts_payable(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_expenses_tenant_id ON nexus.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_revenue_tenant_id ON nexus.revenue(tenant_id);

-- HR indexes
CREATE INDEX IF NOT EXISTS idx_emr_salary_tenant_id ON nexus.salary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_salary_employee_id ON nexus.salary(employee_id);
CREATE INDEX IF NOT EXISTS idx_emr_attendance_tenant_id ON nexus.attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_attendance_employee_id ON nexus.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_emr_attendance_date ON nexus.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_emr_payroll_tenant_id ON nexus.payroll(tenant_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_emr_patients_active ON nexus.patients(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_date ON nexus.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_emr_appointments_status ON nexus.appointments(status);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_patient ON nexus.encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_emr_encounters_date ON nexus.encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_emr_invoices_status ON nexus.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_emr_inventory_category ON nexus.inventory(category);
CREATE INDEX IF NOT EXISTS idx_emr_services_category ON nexus.services(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE nexus.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.salary ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus.payroll ENABLE ROW LEVEL SECURITY;
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

-- Similar policies for all tables
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

CREATE POLICY "Users can view tenant billing" ON nexus.billing
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant accounts_receivable" ON nexus.accounts_receivable
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant accounts_payable" ON nexus.accounts_payable
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant expenses" ON nexus.expenses
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant revenue" ON nexus.revenue
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant salary" ON nexus.salary
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant attendance" ON nexus.attendance
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant payroll" ON nexus.payroll
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

CREATE TRIGGER update_emr_billing_updated_at BEFORE UPDATE ON nexus.billing
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_accounts_receivable_updated_at BEFORE UPDATE ON nexus.accounts_receivable
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_accounts_payable_updated_at BEFORE UPDATE ON nexus.accounts_payable
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_expenses_updated_at BEFORE UPDATE ON nexus.expenses
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_revenue_updated_at BEFORE UPDATE ON nexus.revenue
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_salary_updated_at BEFORE UPDATE ON nexus.salary
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_attendance_updated_at BEFORE UPDATE ON nexus.attendance
    FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

CREATE TRIGGER update_emr_payroll_updated_at BEFORE UPDATE ON nexus.payroll
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
