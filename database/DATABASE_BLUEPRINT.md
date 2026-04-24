# EMR Database Blueprint - Complete System Architecture

## 📋 Table of Contents
1. [Database Overview](#database-overview)
2. [Schema Structure](#schema-structure)
3. [Core Tables](#core-tables)
4. [Medical Tables](#medical-tables)
5. [Financial Tables](#financial-tables)
6. [HR Tables](#hr-tables)
7. [Pharmacy Tables](#pharmacy-tables)
8. [Insurance Tables](#insurance-tables)
9. [FHIR Tables](#fhir-tables)
10. [Admin & Settings Tables](#admin--settings-tables)
11. [Communication Tables](#communication-tables)
12. [OPD System Tables](#opd-system-tables)
13. [Support Tables](#support-tables)
14. [Functions & Procedures](#functions--procedures)
15. [Triggers](#triggers)
16. [Indexes](#indexes)
17. [Row Level Security](#row-level-security)
18. [Data Relationships](#data-relationships)
19. [Migration Strategy](#migration-strategy)
20. [Deployment Guide](#deployment-guide)

---

## Database Overview

### 🏥 System Information
- **Database Name**: EMR Application Database
- **Schema**: `emr`
- **Version**: 3.0.0 - Complete Healthcare System
- **Total Tables**: 154+ tables
- **Total Functions**: 12+ functions
- **Total Triggers**: 50+ triggers
- **Compliance**: FHIR R4, HL7, HIPAA, GDPR

### 🎯 Purpose
Enterprise-grade Electronic Medical Record (EMR) system with complete healthcare ecosystem including:
- Patient management
- Clinical workflows
- Pharmacy management
- Insurance processing
- Financial management
- HR management
- Communication systems
- OPD management
- FHIR compliance

---

## Schema Structure

### 🏗️ Schema Organization
```sql
-- Main Schema
CREATE SCHEMA emr;

-- Table Categories
├── Core Management (8 tables)
├── Medical System (15 tables)
├── Financial System (12 tables)
├── HR System (8 tables)
├── Pharmacy System (15 tables)
├── Insurance System (12 tables)
├── FHIR Compliance (6 tables)
├── Admin & Settings (15 tables)
├── Communication System (10 tables)
├── OPD System (8 tables)
├── Support System (8 tables)
└── System Tables (15 tables)
```

---

## Core Tables

### 🏢 Tenants
```sql
CREATE TABLE emr.tenants (
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
```

### 👥 Users
```sql
CREATE TABLE emr.users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT REFERENCES emr.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    patient_id TEXT REFERENCES emr.patients(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);
```

### 🏥 Departments
```sql
CREATE TABLE emr.departments (
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
```

### 👨‍⚕️ Employees
```sql
CREATE TABLE emr.employees (
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
```

---

## Medical Tables

### 👶 Patients (Enhanced)
```sql
CREATE TABLE emr.patients (
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
    insurance_coverage_ids TEXT[],
    care_team_provider_ids TEXT[]
);
```

### 📅 Appointments (Enhanced)
```sql
CREATE TABLE emr.appointments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
    department_id TEXT REFERENCES emr.departments(id),
    start TIMESTAMP WITH TIME ZONE NOT NULL,
    end TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30,
    type TEXT,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🏥 Encounters (Enhanced)
```sql
CREATE TABLE emr.encounters (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- FHIR Encounter Enhancements
    fhir_encounter_ref TEXT,
    encounter_class TEXT DEFAULT 'AMB' CHECK (encounter_class IN ('AMB', 'IMP', 'EMER', 'VR', 'HH')),
    service_type TEXT,
    priority INTEGER DEFAULT 5,
    discharge_disposition TEXT,
    hospitalization_admission_source TEXT,
    episode_of_care_id TEXT,
    location_id TEXT,
    length_of_days INTEGER,
    diet_preference TEXT,
    admission_diagnosis TEXT
);
```

---

## Financial Tables

### 🧾 Services Catalog
```sql
CREATE TABLE emr.services (
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
```

### 💰 Invoices (Enhanced)
```sql
CREATE TABLE emr.invoices (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES emr.employees(id),
    invoice_number TEXT UNIQUE,
    invoice_date DATE NOT NULL,
    due_date DATE,
    description TEXT,
    items JSONB,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    insurance_provider TEXT,
    policy_number TEXT,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    created_by TEXT REFERENCES emr.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 📊 Billing
```sql
CREATE TABLE emr.billing (
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
    billing_type TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT REFERENCES emr.users(id),
    approved_by TEXT REFERENCES emr.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## HR Tables

### 💼 Salary Management
```sql
CREATE TABLE emr.salary (
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
    esi_deduction DECIMAL(12,2) DEFAULT 0,
    tds_deduction DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL,
    net_salary DECIMAL(12,2) NOT NULL,
    payment_date DATE,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, employee_id, month, year)
);
```

### 📅 Attendance Management
```sql
CREATE TABLE emr.attendance (
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
    status TEXT DEFAULT 'present',
    leave_type TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, employee_id, attendance_date)
);
```

---

## Pharmacy Tables

### 💊 Drug Master (FHIR Medication Resource)
```sql
CREATE TABLE emr.drug_master (
    drug_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    generic_name TEXT NOT NULL,
    brand_names TEXT[],
    strength TEXT,
    dosage_form TEXT,
    route TEXT,
    manufacturer TEXT,
    drug_class TEXT,
    ndc_code TEXT,
    rxnorm_code TEXT,
    snomed_code TEXT,
    barcode TEXT,
    schedule_type TEXT CHECK (schedule_type IN ('OTC', 'Prescription', 'Controlled-II', 'Controlled-III', 'Controlled-IV', 'Controlled-V')),
    storage_conditions TEXT,
    reorder_threshold DECIMAL DEFAULT 0,
    high_alert_flag BOOLEAN DEFAULT false,
    look_alike_sound_alike_flag BOOLEAN DEFAULT false,
    pregnancy_category TEXT CHECK (pregnancy_category IN ('A', 'B', 'C', 'D', 'X', 'N')),
    controlled_substance_act_schedule TEXT,
    therapeutic_class TEXT,
    pharmacological_class TEXT,
    mechanism_of_action TEXT,
    indication TEXT,
    contraindications TEXT,
    warnings TEXT,
    adverse_reactions TEXT[],
    drug_interactions TEXT[],
    renal_adjustment_required BOOLEAN DEFAULT false,
    hepatic_adjustment_required BOOLEAN DEFAULT false,
    pediatric_safe BOOLEAN DEFAULT true,
    geriatric_caution BOOLEAN DEFAULT false,
    black_box_warning BOOLEAN DEFAULT false,
    REMS_required BOOLEAN DEFAULT false,
    biosimilar BOOLEAN DEFAULT false,
    narrow_therapeutic_index BOOLEAN DEFAULT false,
    refrigeration_required BOOLEAN DEFAULT false,
    light_sensitive BOOLEAN DEFAULT false,
    fhir_medication_ref TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued', 'recalled')),
    recall_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, drug_id)
);
```

### 📦 Pharmacy Stock
```sql
CREATE TABLE emr.pharmacy_stock (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    drug_id TEXT NOT NULL REFERENCES emr.drug_master(drug_id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    manufacturer TEXT,
    supplier_id TEXT REFERENCES emr.suppliers(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    margin_percent DECIMAL(5,2) DEFAULT 0,
    storage_location TEXT,
    reorder_level INTEGER DEFAULT 0,
    max_stock INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, drug_id, batch_number)
);
```

---

## Insurance Tables

### 🏢 Insurance Companies
```sql
CREATE TABLE emr.insurance_companies (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    short_name TEXT,
    insurance_type TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    website TEXT,
    gst_number TEXT,
    license_number TEXT,
    network_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, company_name)
);
```

### 📋 Insurance Policies
```sql
CREATE TABLE emr.insurance_policies (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    insurance_company_id TEXT NOT NULL REFERENCES emr.insurance_companies(id) ON DELETE CASCADE,
    policy_number TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    policy_holder_name TEXT,
    policy_holder_dob DATE,
    relationship TEXT,
    coverage_start_date DATE NOT NULL,
    coverage_end_date DATE NOT NULL,
    sum_insured DECIMAL(12,2),
    premium_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    co_payment_amount DECIMAL(10,2),
    coverage_details JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, policy_number)
);
```

---

## FHIR Tables

### 🏥 Conditions (FHIR Condition Resource)
```sql
CREATE TABLE emr.conditions (
    condition_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    clinical_status TEXT NOT NULL CHECK (clinical_status IN ('active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved')),
    verification_status TEXT NOT NULL,
    category TEXT DEFAULT 'problem-list-item',
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    code_snomed TEXT,
    code_icd10 TEXT,
    onset_datetime TIMESTAMP WITH TIME ZONE,
    recorded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES emr.users(id),
    fhir_condition_ref TEXT
);
```

### 🔬 Procedures (FHIR Procedure Resource)
```sql
CREATE TABLE emr.procedures (
    procedure_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    encounter_id TEXT REFERENCES emr.encounters(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error')),
    category TEXT,
    code_icd10 TEXT,
    code_snomed TEXT,
    performed_datetime TIMESTAMP WITH TIME ZONE,
    performer_id TEXT REFERENCES emr.employees(id),
    reason_code TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES emr.users(id),
    fhir_procedure_ref TEXT
);
```

---

## Admin & Settings Tables

### ⚙️ Admin Settings
```sql
CREATE TABLE emr.admin_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🎨 Graphics Settings
```sql
CREATE TABLE emr.graphics_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    setting_type TEXT NOT NULL,
    setting_value TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, setting_type)
);
```

---

## Communication Tables

### 📱 Exotel Configurations
```sql
CREATE TABLE emr.exotel_configurations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    account_sid TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_token TEXT NOT NULL,
    subdomain TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL REFERENCES emr.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 📞 Exotel Number Pools
```sql
CREATE TABLE emr.exotel_number_pools (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    pool_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    number_type TEXT,
    department_id TEXT REFERENCES emr.departments(id),
    doctor_id TEXT REFERENCES emr.employees(id),
    daily_limit INTEGER,
    monthly_limit INTEGER,
    current_daily_usage INTEGER DEFAULT 0,
    current_monthly_usage INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL REFERENCES emr.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## OPD System Tables

### 🎫 OPD Tokens
```sql
CREATE TABLE emr.opd_tokens (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES emr.departments(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
    full_token TEXT NOT NULL,
    token_number INTEGER NOT NULL,
    priority TEXT DEFAULT 'routine',
    status TEXT DEFAULT 'waiting',
    called_at TIMESTAMP WITH TIME ZONE,
    consultation_started_at TIMESTAMP WITH TIME ZONE,
    consultation_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 💰 OPD Bills
```sql
CREATE TABLE emr.opd_bills (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    token_id TEXT NOT NULL REFERENCES emr.opd_tokens(id) ON DELETE CASCADE,
    bill_number TEXT NOT NULL,
    patient_age INTEGER,
    patient_gender TEXT,
    visit_type TEXT,
    department_id TEXT NOT NULL REFERENCES emr.departments(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
    department_name TEXT,
    doctor_name TEXT,
    consultation_fee DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2),
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_by TEXT NOT NULL REFERENCES emr.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, bill_number)
);
```

---

## Support Tables

### 🎭 User Roles
```sql
CREATE TABLE emr.user_roles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB,
    assigned_by TEXT REFERENCES emr.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, user_id, role_name)
);
```

### 🚦 Global Kill Switches
```sql
CREATE TABLE emr.global_kill_switches (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_flag TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT false,
    created_by TEXT REFERENCES emr.users(id),
    updated_by TEXT REFERENCES emr.users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🏷️ Tenant Features
```sql
CREATE TABLE emr.tenant_features (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    feature_flag TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, feature_flag)
);
```

---

## Functions & Procedures

### 🔢 Sequence Functions
```sql
-- MRN Sequence Generator
CREATE OR REPLACE FUNCTION emr.get_next_mrn(tenant_id_param TEXT)
RETURNS TEXT AS $$
DECLARE
    tenant_code TEXT;
    sequence_value INTEGER;
    mrn TEXT;
BEGIN
    -- Get tenant code
    SELECT code INTO tenant_code FROM emr.tenants WHERE id = tenant_id_param;
    
    -- Update sequence
    INSERT INTO emr.mrn_sequences (tenant_id, sequence_value)
    VALUES (tenant_id_param, 1)
    ON CONFLICT (tenant_id)
    DO UPDATE SET sequence_value = mrn_sequences.sequence_value + 1
    RETURNING sequence_value INTO sequence_value;
    
    -- Generate MRN
    mrn := tenant_code || '-' || LPAD(sequence_value::TEXT, 6, '0');
    
    RETURN mrn;
END;
$$ LANGUAGE plpgsql;

-- Invoice Number Generator
CREATE OR REPLACE FUNCTION emr.get_next_invoice_number(tenant_id_param TEXT)
RETURNS TEXT AS $$
DECLARE
    tenant_code TEXT;
    sequence_value INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get tenant code
    SELECT code INTO tenant_code FROM emr.tenants WHERE id = tenant_id_param;
    
    -- Update sequence
    INSERT INTO emr.invoice_sequences (tenant_id, sequence_value)
    VALUES (tenant_id_param, 1)
    ON CONFLICT (tenant_id)
    DO UPDATE SET sequence_value = invoice_sequences.sequence_value + 1
    RETURNING sequence_value INTO sequence_value;
    
    -- Generate invoice number
    invoice_number := 'INV-' || tenant_code || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(sequence_value::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;
```

### 📊 Utility Functions
```sql
-- Get Dashboard Overview
CREATE OR REPLACE FUNCTION emr.get_dashboard_overview(tenant_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'users', (SELECT COUNT(*) FROM emr.users WHERE tenant_id = tenant_id_param),
        'patients', (SELECT COUNT(*) FROM emr.patients WHERE tenant_id = tenant_id_param),
        'appointments', (SELECT COUNT(*) FROM emr.appointments WHERE tenant_id = tenant_id_param),
        'revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM emr.invoices WHERE tenant_id = tenant_id_param AND status = 'paid'),
        'pending_bills', (SELECT COUNT(*) FROM emr.invoices WHERE tenant_id = tenant_id_param AND payment_status != 'paid'),
        'active_encounters', (SELECT COUNT(*) FROM emr.encounters WHERE tenant_id = tenant_id_param AND status = 'active')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### 🕐 Updated At Triggers
```sql
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION emr.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON emr.tenants
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON emr.patients
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

-- ... (applied to all tables with updated_at column)
```

### 📊 Audit Triggers
```sql
-- Audit Log Trigger
CREATE OR REPLACE FUNCTION emr.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO emr.audit_logs (tenant_id, user_id, action, table_name, record_id, old_values, new_values)
        VALUES (NEW.tenant_id, current_setting('app.current_user_id', true), 'INSERT', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO emr.audit_logs (tenant_id, user_id, action, table_name, record_id, old_values, new_values)
        VALUES (NEW.tenant_id, current_setting('app.current_user_id', true), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO emr.audit_logs (tenant_id, user_id, action, table_name, record_id, old_values, new_values)
        VALUES (OLD.tenant_id, current_setting('app.current_user_id', true), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## Indexes

### 🔍 Performance Indexes
```sql
-- Core indexes
CREATE INDEX idx_emr_users_tenant_id ON emr.users(tenant_id);
CREATE INDEX idx_emr_patients_tenant_id ON emr.patients(tenant_id);
CREATE INDEX idx_emr_patients_mrn ON emr.patients(mrn);
CREATE INDEX idx_emr_appointments_tenant_id ON emr.appointments(tenant_id);
CREATE INDEX idx_emr_appointments_start_time ON emr.appointments(start);
CREATE INDEX idx_emr_encounters_tenant_id ON emr.encounters(tenant_id);
CREATE INDEX idx_emr_invoices_tenant_id ON emr.invoices(tenant_id);
CREATE INDEX idx_emr_invoices_status ON emr.invoices(status);

-- Pharmacy indexes
CREATE INDEX idx_emr_drug_master_tenant_id ON emr.drug_master(tenant_id);
CREATE INDEX idx_emr_drug_master_generic ON emr.drug_master(generic_name);
CREATE INDEX idx_emr_pharmacy_stock_tenant_id ON emr.pharmacy_stock(tenant_id);
CREATE INDEX idx_emr_pharmacy_stock_expiry_date ON emr.pharmacy_stock(expiry_date);

-- Insurance indexes
CREATE INDEX idx_emr_insurance_claims_tenant_id ON emr.insurance_claims(tenant_id);
CREATE INDEX idx_emr_insurance_claims_status ON emr.insurance_claims(status);

-- FHIR indexes
CREATE INDEX idx_emr_conditions_tenant_id ON emr.conditions(tenant_id);
CREATE INDEX idx_emr_conditions_patient_id ON emr.conditions(patient_id);
CREATE INDEX idx_emr_procedures_tenant_id ON emr.procedures(tenant_id);
```

---

## Row Level Security

### 🔐 RLS Policies
```sql
-- Enable RLS on all tables
ALTER TABLE emr.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.patients ENABLE ROW LEVEL SECURITY;
-- ... (enable on all tables)

-- Tenant isolation policies
CREATE POLICY "Users can view tenant data" ON emr.users
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

CREATE POLICY "Users can view tenant patients" ON emr.patients
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- Admin policies
CREATE POLICY "Admins can manage tenant settings" ON emr.tenant_settings
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id' AND 
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );
```

---

## Data Relationships

### 🏗️ Entity Relationship Diagram
```
Tenants (1) -----> (N) Users
Tenants (1) -----> (N) Patients
Tenants (1) -----> (N) Employees
Tenants (1) -----> (N) Departments

Patients (1) -----> (N) Appointments
Patients (1) -----> (N) Encounters
Patients (1) -----> (N) Invoices
Patients (1) -----> (N) Insurance Policies

Users (1) -----> (N) Appointments (as doctor)
Users (1) -----> (N) Encounters (as provider)
Users (1) -----> (N) Invoices (as created_by)

Departments (1) -----> (N) Appointments
Departments (1) -----> (N) OPD Tokens

Encounters (1) -----> (N) Prescriptions
Encounters (1) -----> (N) Conditions
Encounters (1) -----> (N) Procedures

Drug Master (1) -----> (N) Pharmacy Stock
Drug Master (1) -----> (N) Prescription Items

Insurance Companies (1) -----> (N) Insurance Policies
Insurance Companies (1) -----> (N) Insurance Claims
```

---

## Migration Strategy

### 📋 Migration Steps
1. **Phase 1**: Core tables (tenants, users, patients, employees, departments)
2. **Phase 2**: Medical tables (appointments, encounters, prescriptions)
3. **Phase 3**: Financial tables (invoices, billing, accounts)
4. **Phase 4**: HR tables (salary, attendance, payroll)
5. **Phase 5**: Pharmacy tables (drug master, stock, dispensing)
6. **Phase 6**: Insurance tables (companies, policies, claims)
7. **Phase 7**: FHIR tables (conditions, procedures, observations)
8. **Phase 8**: Admin & settings tables
9. **Phase 9**: Communication tables
10. **Phase 10**: OPD system tables
11. **Phase 11**: Support tables
12. **Phase 12**: Functions, triggers, indexes, RLS

### 🔄 Rollback Strategy
- Each phase includes rollback scripts
- Data backup before each phase
- Validation scripts after each phase
- Performance monitoring during migration

---

## Deployment Guide

### 🚀 Pre-Deployment Checklist
- [ ] Database backup completed
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Connection strings tested
- [ ] Performance benchmarks established

### 📦 Deployment Steps
1. **Create database and schema**
2. **Install extensions**
3. **Run core tables migration**
4. **Run medical tables migration**
5. **Run financial tables migration**
6. **Run HR tables migration**
7. **Run pharmacy tables migration**
8. **Run insurance tables migration**
9. **Run FHIR tables migration**
10. **Run admin & settings migration**
11. **Run communication tables migration**
12. **Run OPD system migration**
13. **Run support tables migration**
14. **Create functions and procedures**
15. **Create triggers**
16. **Create indexes**
17. **Enable RLS policies**
18. **Run validation scripts**
19. **Run performance tests**
20. **Deploy application**

### 🔍 Post-Deployment Validation
- [ ] All tables created successfully
- [ ] All functions working correctly
- [ ] All triggers active
- [ ] RLS policies enforced
- [ ] Indexes created
- [ ] Performance benchmarks met
- [ ] Application connects successfully
- [ ] Basic CRUD operations working

---

## Maintenance & Monitoring

### 📊 Performance Monitoring
- Query performance metrics
- Index usage statistics
- Table size monitoring
- Connection pool monitoring
- Slow query logging

### 🔧 Regular Maintenance
- Index rebuilding
- Statistics updating
- Vacuum operations
- Backup verification
- Security audit

### 📈 Scaling Strategy
- Read replica configuration
- Partitioning strategy
- Caching layer
- Connection pooling
- Load balancing

---

## Security & Compliance

### 🔒 Security Measures
- Row Level Security (RLS)
- Column-level encryption
- Audit logging
- Role-based access control
- Data masking
- GDPR compliance

### 🏥 Healthcare Compliance
- FHIR R4 compliance
- HIPAA compliance
- Data retention policies
- Patient privacy protection
- Audit trail requirements

---

## Troubleshooting

### 🚨 Common Issues
1. **Connection timeouts** - Check connection pool settings
2. **Slow queries** - Review indexes and query plans
3. **RLS policy errors** - Verify JWT claims
4. **Missing functions** - Check function creation order
5. **Trigger failures** - Review trigger logic

### 🔧 Debug Tools
- Query execution plans
- Performance metrics
- Error logs
- Audit logs
- Connection monitoring

---

## Version History

### 📅 Version 3.0.0 (Current)
- Complete healthcare ecosystem
- FHIR R4 compliance
- Advanced pharmacy system
- Complete insurance processing
- OPD management system
- Communication system
- Enhanced security

### 📅 Version 2.0.0
- Basic EMR functionality
- Financial management
- HR management
- Admin settings

### 📅 Version 1.0.0
- Core patient management
- Basic appointments
- Simple billing

---

## Contact & Support

### 📞 Technical Support
- Database Administrator
- System Architect
- DevOps Team
- Healthcare IT Specialist

### 📚 Documentation
- API Documentation
- User Guides
- Admin Manuals
- Developer Resources

---

*Last Updated: April 2, 2026*
*Version: 3.0.0*
*Status: Production Ready*
