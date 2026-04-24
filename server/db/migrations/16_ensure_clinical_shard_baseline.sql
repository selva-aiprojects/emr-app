-- 16. Clinical Shard Baseline Synchronization
-- Ensures all tables referenced by the auto-migration sharding logic exist in the emr schema
-- This prevents "relation emr.table does not exist" errors during tenant provisioning.

-- 1. Healthcare Operations Shard
CREATE TABLE IF NOT EXISTS emr.frontdesk_visits (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255),
    doctor_id VARCHAR(255),
    visit_type VARCHAR(32) DEFAULT 'General',
    status VARCHAR(32) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.clinical_records (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    section VARCHAR(32) NOT NULL,
    content JSONB NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.conditions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    code VARCHAR(64),
    display VARCHAR(255),
    status VARCHAR(32) DEFAULT 'active',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.observations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    encounter_id VARCHAR(255),
    code VARCHAR(64),
    value VARCHAR(255),
    unit VARCHAR(32),
    status VARCHAR(32) DEFAULT 'final',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.diagnostic_reports (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    encounter_id VARCHAR(255),
    category VARCHAR(64),
    status VARCHAR(32) DEFAULT 'final',
    conclusion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.procedures (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    code VARCHAR(64),
    display VARCHAR(255),
    status VARCHAR(32) DEFAULT 'completed',
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.prescriptions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    encounter_id VARCHAR(255),
    drug_name VARCHAR(255),
    dosage VARCHAR(64),
    frequency VARCHAR(64),
    duration VARCHAR(64),
    instructions TEXT,
    status VARCHAR(32) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Infrastructure & Logistics
CREATE TABLE IF NOT EXISTS emr.locations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64),
    status VARCHAR(32) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS emr.ward_stock (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    ward_id VARCHAR(255) NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.donors (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(8),
    phone VARCHAR(32),
    last_donation DATE
);

CREATE TABLE IF NOT EXISTS emr.walkins (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Operations & Support
CREATE TABLE IF NOT EXISTS emr.support_tickets (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) DEFAULT 'open',
    priority VARCHAR(32) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.notices (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS emr.tenant_communications (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    type VARCHAR(32),
    subject VARCHAR(255),
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Financial Shard
CREATE TABLE IF NOT EXISTS emr.billing (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(32) DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.expenses (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    category VARCHAR(64),
    amount DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS emr.claims (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    insurance_id VARCHAR(255),
    amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(32) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS emr.insurance_providers (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS emr.accounts_receivable (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    entity_name VARCHAR(255),
    amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE
);

CREATE TABLE IF NOT EXISTS emr.accounts_payable (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    entity_name VARCHAR(255),
    amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE
);

-- 5. Inventory & Supply Chain
CREATE TABLE IF NOT EXISTS emr.inventory_items (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64),
    stock_level DECIMAL(12,2) DEFAULT 0,
    reorder_level DECIMAL(12,2) DEFAULT 0,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS emr.inventory_transactions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    type VARCHAR(32), -- in, out, adjustment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.pharmacy_inventory (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    drug_id VARCHAR(255) NOT NULL,
    stock_level INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.pharmacy_alerts (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    type VARCHAR(32),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.purchase_orders (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    vendor_id VARCHAR(255),
    total_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(32) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.vendors (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    phone VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS emr.drug_batches (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    drug_id VARCHAR(255) NOT NULL,
    batch_number VARCHAR(64) NOT NULL,
    expiry_date DATE,
    quantity INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS emr.drug_allergies (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    drug_id VARCHAR(255) NOT NULL,
    severity VARCHAR(32),
    reaction TEXT
);

CREATE TABLE IF NOT EXISTS emr.medication_schedules (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    drug_id VARCHAR(255),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    frequency VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS emr.medication_administrations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    drug_id VARCHAR(255),
    administered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(32) DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS emr.patient_medication_allocations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    drug_id VARCHAR(255),
    quantity INTEGER DEFAULT 0
);

-- 6. HR & Payroll
CREATE TABLE IF NOT EXISTS emr.employees (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(64),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.employee_leaves (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    type VARCHAR(32),
    status VARCHAR(32) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS emr.salary_structures (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    base_salary DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.payroll_items (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    type VARCHAR(32), -- deduction, allowance
    amount DECIMAL(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS emr.attendance (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) DEFAULT 'present'
);

CREATE TABLE IF NOT EXISTS emr.payroll_runs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    month VARCHAR(7), -- YYYY-MM
    status VARCHAR(32) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.payslips (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    payroll_run_id VARCHAR(255),
    net_salary DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Governance & Communication
CREATE TABLE IF NOT EXISTS emr.chat_threads (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.document_access_policies (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    document_id VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL,
    can_view BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS emr.notification_templates (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) UNIQUE,
    subject TEXT,
    body TEXT
);

CREATE TABLE IF NOT EXISTS emr.notification_jobs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    type VARCHAR(32),
    status VARCHAR(32) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.notification_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    recipient VARCHAR(255),
    type VARCHAR(32),
    status VARCHAR(32),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
