# Tenant Schema Comparison Report

## Overview

This document compares the existing `tenant_base_schema.sql` with the current Prisma schema to ensure all necessary tables are included in the proper multi-tenant architecture.

## Schema Comparison

### Tables in tenant_base_schema.sql (Complete Set)

#### 1. CORE CLINICAL
- **patients** - Patient demographic and medical data
- **walkins** - Walk-in patient registrations
- **appointments** - Patient appointments and scheduling
- **encounters** - Clinical encounters (OPD/IPD/Emergency)
- **clinical_records** - Clinical documentation sections
- **prescriptions** - Medication prescriptions

#### 2. INPATIENT - WARDS & BEDS
- **wards** - Hospital wards with different types
- **beds** - Individual beds within wards
- **admissions** - Patient admissions and discharges

#### 3. DEPARTMENTS & FRONTDESK
- **departments** - Hospital departments
- **frontdesk_visits** - Front desk token system

#### 4. BILLING & INVOICES
- **invoices** - Patient billing invoices
- **invoice_items** - Line items for invoices
- **expenses** - Hospital expenses tracking

#### 5. INSURANCE
- **insurance_providers** - Insurance company data
- **insurance_claims** - Insurance claim processing

#### 6. PHARMACY & INVENTORY
- **inventory_items** - Pharmacy inventory management
- **inventory_transactions** - Stock transactions
- **suppliers** - Pharmacy suppliers
- **inventory_purchases** - Purchase orders
- **service_requests** - Service requests (lab, pharmacy, imaging, etc.)

#### 7. BLOOD BANK
- **donors** - Blood donor registry
- **blood_units** - Blood unit inventory
- **blood_requests** - Blood request processing

#### 8. AMBULANCE / FLEET
- **ambulances** - Ambulance fleet management
- **ambulance_dispatch** - Ambulance dispatch records

#### 9. HR - EMPLOYEES, ATTENDANCE, PAYROLL, LEAVES
- **employees** - Employee records
- **employee_leaves** - Leave management
- **attendance** - Daily attendance tracking
- **salary_structures** - Salary structure management
- **payroll_runs** - Payroll processing
- **payroll_items** - Individual payroll items

#### 10. COMMUNICATIONS & AUDIT
- **notices** - System notices and announcements
- **documents** - Document management
- **audit_logs** - System audit trail

#### 11. INDEXES
- 24 performance indexes for optimal query performance

### Tables in Prisma Schema (Current Implementation)

The Prisma schema includes many of the same tables but some are missing or have different structures:

#### Present in Both:
- patients, appointments, encounters, clinical_records, prescriptions
- departments, wards, beds, admissions
- invoices, invoice_items, expenses
- insurance_providers, insurance_claims
- inventory_items, inventory_transactions
- donors, blood_units, blood_requests
- ambulances
- employees, employee_leaves, attendance
- notices, documents, audit_logs
- service_requests

#### Missing from tenant_base_schema.sql (but in Prisma):
- **drug_allergies** - Patient drug allergies
- **medication_administrations** - Medication administration records
- **pharmacy_alerts** - Pharmacy alerts
- **pharmacy_inventory** - Pharmacy inventory details
- **prescription_items** - Prescription line items
- **conditions** - Patient medical conditions
- **procedures** - Medical procedures
- **purchase_orders** - Purchase order management
- **salary_structures** - Salary structure (present but different structure)
- **payroll_runs** - Payroll processing (present but different structure)
- **payroll_items** - Payroll items (present but different structure)
- **support_tickets** - Support ticket system
- **sessions** - User session management
- **notification_jobs** - Notification job queue
- **notification_templates** - Notification templates
- **observations** - Clinical observations
- **patient_medication_allocations** - Patient medication allocations
- **chat_threads**, **chat_messages**, **chat_participants** - Chat system
- **feature_flag_audit** - Feature flag audit trail
- **document_audit_logs** - Document audit logs

#### Missing from Prisma Schema (but in tenant_base_schema.sql):
- **walkins** - Walk-in patient registrations
- **frontdesk_visits** - Front desk token system
- **suppliers** - Pharmacy suppliers
- **inventory_purchases** - Purchase orders
- **ambulance_dispatch** - Ambulance dispatch records

## Critical Findings

### 1. Schema Structure Differences
- **tenant_base_schema.sql** uses proper multi-tenant architecture with separate schemas
- **Prisma schema** uses shared schema with tenant_id filtering (incorrect architecture)

### 2. Missing Tables in tenant_base_schema.sql
Several important tables from Prisma are missing from the tenant_base_schema.sql:

#### Clinical Tables:
- `drug_allergies` - Critical for patient safety
- `medication_administrations` - Essential for medication tracking
- `conditions` - Patient medical conditions
- `procedures` - Medical procedures
- `observations` - Clinical observations

#### Pharmacy Tables:
- `pharmacy_alerts` - Pharmacy management
- `pharmacy_inventory` - Detailed pharmacy inventory
- `prescription_items` - Prescription line items

#### Communication Tables:
- `chat_threads`, `chat_messages`, `chat_participants` - Chat system
- `support_tickets` - Support ticket system

#### System Tables:
- `notification_jobs` - Notification queue
- `notification_templates` - Notification templates
- `feature_flag_audit` - Feature audit trail
- `document_audit_logs` - Document audit
- `patient_medication_allocations` - Medication allocation
- `sessions` - User sessions

### 3. Architectural Issues
- Current implementation uses **shared schema** approach (incorrect)
- Should use **separate schemas** per tenant (correct)
- Missing proper tenant isolation in queries

## Recommendations

### 1. Update tenant_base_schema.sql
Add the missing tables from Prisma schema to tenant_base_schema.sql:

#### Clinical Tables to Add:
```sql
CREATE TABLE IF NOT EXISTS drug_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  severity varchar(16) NOT NULL DEFAULT 'mild',
  reaction text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medication_administrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  route varchar(16),
  administered_by uuid,
  administered_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  code varchar(32),
  description text,
  category varchar(32),
  severity varchar(16),
  onset_date date,
  status varchar(16) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  procedure_code varchar(32),
  description text,
  category varchar(32),
  performed_by uuid,
  performed_at timestamptz,
  status varchar(16) NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  category varchar(32),
  observation_type varchar(32),
  value numeric(12,4),
  unit varchar(16),
  notes text,
  recorded_by uuid,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### Pharmacy Tables to Add:
```sql
CREATE TABLE IF NOT EXISTS pharmacy_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  alert_type varchar(32) NOT NULL,
  message text NOT NULL,
  severity varchar(16) NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_number varchar(64),
  expiry_date date,
  location varchar(32),
  quantity numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  quantity numeric(12,2) NOT NULL,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Communication Tables to Add:
```sql
CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text,
  participants jsonb NOT NULL DEFAULT '[]',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id uuid,
  message text NOT NULL,
  message_type varchar(16) NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ticket_number varchar(32) NOT NULL,
  title text NOT NULL,
  description text,
  category varchar(32) NOT NULL,
  priority varchar(16) NOT NULL DEFAULT 'medium',
  status varchar(16) NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ticket_number)
);
```

#### System Tables to Add:
```sql
CREATE TABLE IF NOT EXISTS notification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_type varchar(32) NOT NULL,
  recipient_id uuid,
  recipient_type varchar(16) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_name varchar(64) NOT NULL,
  category varchar(32) NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flag_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  flag_name varchar(64) NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  user_id uuid,
  action varchar(32) NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_medication_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  allocated_quantity numeric(12,2) NOT NULL,
  allocated_by uuid,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token varchar(255) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 2. Update Indexes
Add indexes for the new tables:
```sql
CREATE INDEX IF NOT EXISTS idx_drug_allergies_patient ON drug_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_patient ON medication_administrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_patient ON conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_procedures_patient ON procedures(patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_patient ON observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant ON chat_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
```

### 3. Fix Architecture
Update the application to use proper multi-tenant architecture:
- Create separate schemas for each tenant
- Update database queries to use tenant-specific schemas
- Update middleware to handle schema resolution
- Update Prisma schema to reflect correct architecture

## Next Steps

1. **Update tenant_base_schema.sql** with all missing tables
2. **Create proper tenant creation script** that follows the existing process
3. **Update database connection** to use tenant-specific schemas
4. **Update API endpoints** to use tenant-specific queries
5. **Update frontend** to handle tenant-specific routing
6. **Test the complete architecture** with all tables

## Conclusion

The current implementation has fundamental architectural issues. The tenant_base_schema.sql is the correct approach but needs to be updated to include all tables from the Prisma schema. Once updated, the application will have proper multi-tenant isolation with complete functionality.
