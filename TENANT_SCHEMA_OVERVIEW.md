# MedCare EMR - Tenant Schema Overview

## Schema Location

**Main Schema File**: `d:\Training\working\EMR-Application\prisma\schema.prisma`

## Core Tenant Model

### Tenant Table Structure

```prisma
model Tenant {
  id                                       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                                     String
  code                                     String   @unique @db.VarChar(32)
  subdomain                                String   @unique @db.VarChar(128)
  theme                                    Json     @default("{\"accent\": \"#f57f17\", \"primary\": \"#0f5a6e\"}")
  features                                 Json     @default("{\"inventory\": true, \"telehealth\": false}")
  status                                   String   @default("active") @db.VarChar(16)
  created_at                               DateTime @default(now()) @db.Timestamptz(6)
  updated_at                               DateTime @default(now()) @db.Timestamptz(6)
  subscription_tier                        String?  @default("Basic") @db.VarChar(50)
  billing_config                           Json?    @default("{\"currency\": \"INR\", \"provider\": \"manual\"}")
  logo_url                                 String?
  contact_email                            String?  @db.VarChar(255)
  
  // Relations to all other tables
  ambulances                               ambulances[]
  appointments                             Appointment[]
  attendance                               attendance[]
  audit_logs                               audit_logs[]
  beds                                     beds[]
  blood_requests                           blood_requests[]
  blood_units                              blood_units[]
  chat_threads                             chat_threads[]
  claims                                   claims[]
  clinical_records                         clinical_records[]
  conditions                               conditions[]
  departments                              Department[]
  diagnostic_reports                       diagnostic_reports[]
  document_access_policies                 document_access_policies[]
  document_audit_logs                      document_audit_logs[]
  documents                                documents[]
  donors                                   donors[]
  drug_allergies                           drug_allergies[]
  drug_batches                             drug_batches[]
  drug_master                              drug_master[]
  employee_leaves                          employee_leaves[]
  employees                                Employee[]
  encounters                               Encounter[]
  expenses                                 expenses[]
  feature_flag_audit                       feature_flag_audit[]
  frontdesk_visits                         frontdesk_visits[]
  insurance_providers                      insurance_providers[]
  inventory_items                          inventory_items[]
  inventory_transactions                   inventory_transactions[]
  invoice_items                            invoice_items[]
  invoices                                 Invoice[]
  locations                                locations[]
  medication_administrations               medication_administrations[]
  medication_schedules                     medication_schedules[]
  notices                                  notices[]
  notification_jobs                        notification_jobs[]
  notification_logs                        notification_logs[]
  notification_templates                   notification_templates[]
  observations                             observations[]
  patient_medication_allocations           patient_medication_allocations[]
  patients                                 Patient[]
  payroll_items                            payroll_items[]
  payroll_runs                             payroll_runs[]
  payslips                                 payslips[]
  pharmacy_alerts                          pharmacy_alerts[]
  pharmacy_inventory                       pharmacy_inventory[]
  prescriptions                            prescriptions[]
  procedures                               procedures[]
  purchase_orders                          purchase_orders[]
  role_permissions                         role_permissions[]
  roles                                    roles[]
  salary_structures                        salary_structures[]
  service_requests                         service_requests[]
  services                                 Service[]
  support_tickets                          support_tickets[]
  tenant_communications                    tenant_communications[]
  tenant_features                          tenant_features[]
  users                                    User[]
  vendors                                  vendors[]
  walkins                                  walkins[]
  wards                                    wards[]
}
```

## Key Tenant Fields

### 1. **Identification Fields**
- **id**: UUID primary key
- **code**: Unique tenant identifier (e.g., "DEMO")
- **name**: Human-readable tenant name (e.g., "MedCare Demo Hospital")
- **subdomain**: Unique subdomain for multi-tenant access

### 2. **Configuration Fields**
- **theme**: JSON object with UI theme settings
- **features**: JSON object with enabled features
- **status**: Tenant status ("active", "inactive", "suspended")
- **subscription_tier**: Subscription level ("Basic", "Premium", "Enterprise")

### 3. **Business Fields**
- **billing_config**: JSON object with billing configuration
- **logo_url**: URL for tenant logo
- **contact_email**: Administrative contact email

## DEMO Tenant Configuration

### Current DEMO Tenant Settings

```json
{
  "id": "20d07615-8de9-49b4-9929-ec565197e6f4",
  "name": "MedCare Demo Hospital",
  "code": "DEMO",
  "subdomain": "demo",
  "theme": {
    "accent": "#f57f17",
    "primary": "#0f5a6e"
  },
  "features": {
    "inventory": true,
    "telehealth": false
  },
  "status": "active",
  "subscription_tier": "Enterprise",
  "billing_config": {
    "currency": "INR",
    "provider": "manual",
    "gatewayKey": "",
    "accountStatus": "unlinked"
  }
}
```

## Database Schema Relationships

### 1. **Multi-Tenancy Architecture**
- All tables have `tenant_id` field for data isolation
- Foreign key relationships ensure data integrity
- Each tenant has completely isolated data

### 2. **Core Business Entities**

#### Patient Management
```prisma
model Patient {
  id                             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id                      String   @db.Uuid
  mrn                            String   @db.VarChar(64)
  first_name                     String
  last_name                      String
  date_of_birth                  DateTime? @db.Date
  gender                         String?  @db.VarChar(16)
  phone                          String?  @db.VarChar(32)
  email                          String?
  address                        String?
  blood_group                    String?  @db.VarChar(8)
  emergency_contact              String?  @db.VarChar(128)
  insurance                      String?  @db.VarChar(256)
  medical_history                Json     @default("{\"allergies\": \"\", \"surgeries\": \"\", \"familyHistory\": \"\", \"chronicConditions\": \"\"}")
  // ... more fields
  
  @@index([tenant_id, mrn], map: "idx_patients_tenant_mrn")
  @@map("patients")
}
```

#### Clinical Encounters
```prisma
model Encounter {
  id                         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id                  String   @db.Uuid
  patient_id                 String   @db.Uuid
  provider_id                String?  @db.Uuid
  encounter_type             String   @db.VarChar(16)
  visit_date                 DateTime @default(dbgenerated("CURRENT_DATE")) @db.Date
  chief_complaint            String?
  diagnosis                  String?
  notes                      String?
  status                     String   @default("open") @db.VarChar(16)
  // ... more fields
  
  @@index([provider_id], map: "idx_encounters_provider")
  @@map("encounters")
}
```

#### User Management
```prisma
model User {
  id                                                                           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id                                                                    String?  @db.Uuid
  email                                                                        String
  password_hash                                                                String
  name                                                                         String
  role                                                                         String   @db.VarChar(32)
  patient_id                                                                   String?  @db.Uuid
  is_archived                                                                  Boolean? @default(false)
  // ... more fields
  
  @@unique([tenant_id, email], map: "idx_users_tenant_email")
  @@map("users")
}
```

### 3. **Hospital Operations**

#### Departments
```prisma
model Department {
  id                                   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id                            String   @db.Uuid
  name                                 String
  code                                 String   @db.VarChar(32)
  hod_user_id                          String?  @db.Uuid
  status                               String   @default("active") @db.VarChar(16)
  created_by                           String?  @db.Uuid
  // ... more fields
  
  @@unique([tenant_id, code], map: "idx_departments_tenant_code")
  @@unique([tenant_id, name], map: "idx_departments_tenant_name")
  @@map("departments")
}
```

#### Wards and Beds
```prisma
model wards {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id  String   @db.Uuid
  name       String
  type       String   @db.VarChar(32)
  base_rate  Decimal  @default(0) @db.Decimal(12, 2)
  status     String?  @default("Active") @db.VarChar(16)
  // ... more fields
  
  @@unique([tenant_id, name], map: "idx_wards_tenant_name")
  @@index([tenant_id], map: "idx_wards_tenant")
  @@map("wards")
}

model beds {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id  String   @db.Uuid
  ward_id    String   @db.Uuid
  bed_number String   @db.VarChar(16)
  status     String?  @default("Available") @db.VarChar(16)
  // ... more fields
  
  @@unique([tenant_id, ward_id, bed_number], map: "idx_beds_tenant_ward_bed")
  @@index([status], map: "idx_beds_status")
  @@index([ward_id], map: "idx_beds_ward")
  @@map("beds")
}
```

### 4. **Financial Management**

#### Invoices
```prisma
model Invoice {
  id                     String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id              String   @db.Uuid
  patient_id              String   @db.Uuid
  invoice_number         String?  @db.VarChar(32)
  total                  Decimal  @db.Decimal(12, 2)
  status                 String   @default("draft") @db.VarChar(16)
  due_date               DateTime? @db.Date
  // ... more fields
  
  @@unique([tenant_id, invoice_number], map: "idx_invoices_tenant_invoice_number")
  @@map("invoices")
}
```

### 5. **Pharmacy & Inventory**

#### Inventory Items
```prisma
model inventory_items {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id      String   @db.Uuid
  item_code      String   @db.VarChar(32)
  name           String
  category       String?
  current_stock  Integer  @default(0)
  reorder_level  Integer  @default(0)
  unit           String?
  // ... more fields
  
  @@unique([tenant_id, item_code], map: "idx_inventory_items_tenant_item_code")
  @@map("inventory_items")
}
```

#### Prescriptions
```prisma
model prescriptions {
  id                   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenant_id            String   @db.Uuid
  patient_id           String   @db.Uuid
  encounter_id         String?  @db.Uuid
  drug_name            String
  dosage               String
  frequency            String
  duration             String
  instructions         String
  status               String   @default("active") @db.VarChar(16)
  // ... more fields
  
  @@map("prescriptions")
}
```

## Schema Indexes and Performance

### Key Indexes
1. **Tenant Isolation**: All tables indexed by `tenant_id`
2. **Business Logic**: Unique constraints for business rules
3. **Performance**: Optimized queries for common operations

### Example Indexes
```sql
-- Patient lookups
CREATE INDEX idx_patients_tenant_mrn ON patients(tenant_id, mrn);

-- User authentication
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- Department uniqueness
CREATE INDEX idx_departments_tenant_code ON departments(tenant_id, code);

-- Bed management
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_beds_ward ON beds(ward_id);

-- Financial tracking
CREATE INDEX idx_invoices_tenant_invoice_number ON invoices(tenant_id, invoice_number);
```

## Multi-Tenancy Implementation

### Data Isolation
- Every table has `tenant_id` field
- All queries include tenant filtering
- Row-level security ensures data separation

### Example Query
```sql
-- Get patients for specific tenant
SELECT * FROM patients 
WHERE tenant_id = '20d07615-8de9-49b4-9929-ec565197e6f4';

-- Get appointments for specific tenant
SELECT * FROM appointments 
WHERE tenant_id = '20d07615-8de9-49b4-9929-ec565197e6f4'
  AND DATE(scheduled_start) = CURRENT_DATE;
```

## Schema Evolution

### Migration Strategy
1. **Version Control**: Prisma migrations for schema changes
2. **Backward Compatibility**: Maintains existing functionality
3. **Tenant Isolation**: Changes apply to all tenants

### Migration Files
- Located in `prisma/migrations/` directory
- Each migration includes tenant-safe changes
- Rollback capabilities for failed migrations

## Accessing the Schema

### 1. **View in IDE**
- **File**: `d:\Training\working\EMR-Application\prisma\schema.prisma`
- **Full Length**: 1,704 lines
- **Syntax**: Prisma Schema Language

### 2. **Database View**
```sql
-- View all tables for DEMO tenant
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'emr' 
ORDER BY table_name;

-- View tenant details
SELECT * FROM emr.tenants WHERE code = 'DEMO';
```

### 3. **Prisma Studio**
- **Command**: `npx prisma studio`
- **Database**: PostgreSQL
- **Visualization**: Interactive schema explorer

## Current DEMO Tenant Data

### Tenant Information
- **ID**: `20d07615-8de9-49b4-9929-ec565197e6f4`
- **Code**: `DEMO`
- **Name**: `MedCare Demo Hospital`
- **Status**: `active`
- **Subscription**: `Enterprise`

### Data Volume
- **Patients**: 150 records
- **Encounters**: 859 records
- **Appointments**: 100 records
- **Departments**: 8 departments
- **Beds**: 83 beds
- **Users**: 9 users

## Schema Validation

### Data Integrity
- **Foreign Keys**: All relationships properly defined
- **Constraints**: Business rules enforced at database level
- **Indexes**: Optimized for performance

### Security
- **Tenant Isolation**: Complete data separation
- **Access Control**: Role-based permissions
- **Audit Trail**: Complete change tracking

---

## Quick Reference

### Find Tenant Schema
1. **Main File**: `prisma/schema.prisma`
2. **Line Numbers**: 1-100 (Tenant model)
3. **Full Schema**: 1,704 lines total
4. **Key Models**: Tenant, User, Patient, Encounter, Department

### Key Tables for DEMO
- `tenants` - Tenant configuration
- `patients` - Patient records
- `encounters` - Clinical visits
- `appointments` - Scheduling
- `departments` - Hospital departments
- `beds` - Bed management
- `users` - User accounts
- `inventory_items` - Pharmacy stock
- `prescriptions` - Medication orders
- `diagnostic_reports` - Lab results
- `invoices` - Billing

### Database Connection
- **Host**: PostgreSQL
- **Schema**: `emr`
- **Tenant ID**: `20d07615-8de9-49b4-9929-ec565197e6f4`
- **Code**: `DEMO`

---

**Location**: `d:\Training\working\EMR-Application\prisma\schema.prisma`  
**Status**: Complete and Active  
**Last Updated**: April 12, 2026
