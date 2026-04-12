# Database Schema Reference

## Overview
This document provides comprehensive reference information for the MedFlow EMR database schema, including table structures, relationships, and multi-tenant architecture.

## Multi-Tenant Architecture

### Schema Organization
```
emr (Global Schema)
  - tenants (tenant management)
  - users (authentication and roles)
  - global configuration

{tenant_code}_emr or nhgl (Tenant Schemas)
  - Clinical data and operations
  - Completely isolated per tenant
  - 55+ tables per tenant
```

### Schema Files
- **Primary**: `database/tenant_base_schema_comprehensive_v2.sql`
- **Version**: v2.0 (April 2025)
- **Coverage**: All EMR modules with complete relationships

## Global Schema (`emr`)

### Tenants Table
```sql
CREATE TABLE emr.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code character varying(10) NOT NULL UNIQUE,
    subdomain character varying(50),
    contact_email text,
    subscription_tier character varying(20),
    status character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Key Fields**:
- `code`: Determines schema name (NHGL -> nhgl, others -> {code}_emr)
- `status`: 'active', 'inactive', 'suspended'
- `subscription_tier': 'Basic', 'Professional', 'Enterprise'

### Users Table
```sql
CREATE TABLE emr.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES emr.tenants(id),
    name text NOT NULL,
    email text NOT NULL,
    role character varying(50),
    password_hash text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Roles**: 'admin', 'doctor', 'nurse', 'pharmacist', 'receptionist', 'superadmin'

## Tenant Schema Structure

### Core Clinical Tables

#### Patients
```sql
CREATE TABLE patients (
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
    medical_history jsonb,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Appointments
```sql
CREATE TABLE appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id),
    provider_id uuid REFERENCES emr.users(id),
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    status character varying(20),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Status Types**: 'scheduled', 'completed', 'cancelled', 'no-show', 'in-progress'

#### Encounters
```sql
CREATE TABLE encounters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id),
    encounter_type character varying(50),
    visit_date timestamp with time zone,
    status character varying(20),
    diagnosis text,
    treatment_plan jsonb,
    provider_id uuid REFERENCES emr.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### Financial Tables

#### Invoices
```sql
CREATE TABLE invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id),
    invoice_number character varying(50) NOT NULL UNIQUE,
    total numeric(10,2) NOT NULL,
    status character varying(20),
    issue_date timestamp with time zone,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Invoice Items
```sql
CREATE TABLE invoice_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    invoice_id uuid NOT NULL REFERENCES invoices(id),
    item_name text NOT NULL,
    category character varying(50),
    quantity integer,
    unit_price numeric(10,2),
    total_price numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);
```

### Laboratory Tables

#### Lab Tests
```sql
CREATE TABLE lab_tests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    test_name text NOT NULL,
    category character varying(255) NOT NULL,
    normal_range text,
    price numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Diagnostic Reports
```sql
CREATE TABLE diagnostic_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id),
    test_id uuid REFERENCES lab_tests(id),
    status character varying(20) NOT NULL,
    category text,
    conclusion jsonb,
    results jsonb,
    issued_datetime timestamp with time zone,
    performed_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### Blood Bank Tables

#### Blood Units
```sql
CREATE TABLE blood_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    donor_id uuid REFERENCES donors(id),
    blood_group character varying(8) NOT NULL,
    collection_date date NOT NULL,
    expiry_date date NOT NULL,
    status character varying(20) NOT NULL,
    storage_location text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Blood Requests
```sql
CREATE TABLE blood_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id),
    blood_group character varying(8) NOT NULL,
    urgency character varying(20) NOT NULL,
    request_date date NOT NULL,
    status character varying(20) NOT NULL,
    units_requested integer,
    units_supplied integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### Hospital Management Tables

#### Departments
```sql
CREATE TABLE departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code character varying(10),
    type character varying(50),
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Wards
```sql
CREATE TABLE wards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    floor integer,
    capacity integer,
    department_id uuid REFERENCES departments(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Beds
```sql
CREATE TABLE beds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    ward_id uuid NOT NULL REFERENCES wards(id),
    bed_number character varying(20) NOT NULL,
    status character varying(20),
    patient_id uuid REFERENCES patients(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Bed Status**: 'available', 'occupied', 'maintenance', 'reserved'

### Human Resources Tables

#### Employees
```sql
CREATE TABLE employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    designation text,
    department text,
    contact_number character varying(32),
    email text,
    employee_id character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Attendance
```sql
CREATE TABLE attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL REFERENCES employees(id),
    date date NOT NULL,
    status character varying(20),
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);
```

**Attendance Status**: 'present', 'absent', 'late', 'half-day', 'leave'

### Pharmacy Tables

#### Inventory Items
```sql
CREATE TABLE inventory_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    category character varying(50),
    description text,
    unit character varying(20),
    current_stock numeric,
    reorder_level numeric,
    unit_price numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Prescriptions
```sql
CREATE TABLE prescriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id),
    provider_id uuid REFERENCES emr.users(id),
    prescription_date timestamp with time zone NOT NULL,
    status character varying(20),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### Additional Clinical Tables

#### Conditions
```sql
CREATE TABLE conditions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category character varying(100),
    severity character varying(20),
    is_chronic boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Drug Allergies
```sql
CREATE TABLE drug_allergies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL REFERENCES patients(id),
    drug_name text NOT NULL,
    allergy_type character varying(50),
    severity character varying(20),
    reaction text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### System Tables

#### Notices
```sql
CREATE TABLE notices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    type character varying(50),
    priority character varying(20),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    target_audience jsonb,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES emr.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Pharmacy Alerts
```sql
CREATE TABLE pharmacy_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    alert_type character varying(50) NOT NULL,
    message text NOT NULL,
    severity character varying(20),
    item_id uuid,
    item_type character varying(50),
    threshold_value numeric,
    current_value numeric,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Support Tickets
```sql
CREATE TABLE support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    ticket_number character varying(20) NOT NULL UNIQUE,
    subject text NOT NULL,
    description text,
    category character varying(50),
    priority character varying(20),
    status character varying(20),
    patient_id uuid REFERENCES patients(id),
    raised_by uuid REFERENCES emr.users(id),
    assigned_to uuid REFERENCES emr.users(id),
    resolution text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

## Relationships and Constraints

### Foreign Key Relationships
```sql
-- Core relationships
patients.id <- appointments.patient_id
patients.id <- encounters.patient_id
patients.id <- invoices.patient_id
patients.id <- blood_requests.patient_id

-- User relationships
emr.users.id <- appointments.provider_id
emr.users.id <- encounters.provider_id
emr.users.id <- prescriptions.provider_id

-- Hospital management
departments.id <- wards.department_id
wards.id <- beds.ward_id
beds.id <- patients.id (when occupied)

-- Financial
invoices.id <- invoice_items.invoice_id
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_lab_tests_category ON lab_tests(category);
CREATE INDEX idx_blood_units_blood_group ON blood_units(blood_group);
CREATE INDEX idx_blood_units_expiry_date ON blood_units(expiry_date);
```

## Data Types and Constraints

### Common Patterns
- **UUID Primary Keys**: All tables use UUID primary keys with `gen_random_uuid()` default
- **Tenant Isolation**: All tables include `tenant_id uuid NOT NULL`
- **Timestamps**: All tables have `created_at` and `updated_at` timestamps
- **JSONB Fields**: Flexible data storage for medical history, results, etc.

### Data Types Used
- `uuid`: Primary keys and foreign keys
- `text`: Variable-length text data
- `character varying(n)`: Fixed maximum length strings
- `timestamp with time zone`: Date/time with timezone
- `date`: Date only
- `numeric(p,s)`: Precise decimal numbers
- `integer`: Whole numbers
- `boolean`: True/false values
- `jsonb`: Structured JSON data

## Views and Functions

### Summary Views
```sql
-- Patient summary view
CREATE VIEW patient_summary AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.mrn,
  COUNT(a.id) as appointment_count,
  COUNT(e.id) as encounter_count,
  COALESCE(SUM(i.total), 0) as total_revenue
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN encounters e ON p.id = e.patient_id
LEFT JOIN invoices i ON p.id = i.patient_id
GROUP BY p.id;
```

### Utility Functions
```sql
-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

## Migration and Versioning

### Schema Versioning
- Current version: v2.0
- Migration scripts: `database/migrations/`
- Version tracking: `emr.schema_versions` table

### Migration Process
1. Test migration on demo schema
2. Create migration script
3. Apply to all tenant schemas
4. Verify functionality
5. Update version tracking

## Performance Optimization

### Query Optimization
- Use appropriate indexes
- Partition large tables by date
- Optimize JSONB queries
- Use connection pooling

### Storage Optimization
- Archive old patient data
- Compress large text fields
- Monitor table sizes
- Regular vacuum and analyze

## Security Considerations

### Row-Level Security
- All queries filtered by `tenant_id`
- No cross-tenant data access
- Role-based access controls

### Data Protection
- Encrypted sensitive fields
- Audit logging for changes
- Regular security audits
- Backup encryption

## Troubleshooting

### Common Schema Issues
- Missing tables: Check schema creation
- Constraint violations: Verify data integrity
- Performance issues: Review indexes
- Permission errors: Check user roles

### Diagnostic Queries
```sql
-- Check table counts
SELECT 
  table_schema,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema LIKE '%_emr' OR table_schema = 'nhgl'
GROUP BY table_schema;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname LIKE '%_emr' OR schemaname = 'nhgl'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```
