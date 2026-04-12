# TENANT PROVISIONING COMPREHENSIVE GUIDE

## Overview
This guide provides complete instructions for provisioning new tenants in the MedFlow EMR system using the comprehensive schema and provisioning scripts.

## Architecture
- **Multi-Tenant Schema Isolation**: Each tenant gets its own PostgreSQL schema
- **Global Tables**: Shared data in `emr.*` schema (tenants, users, auth)
- **Tenant Tables**: Isolated data in `<tenant_code>_emr.*` schema
- **Complete Coverage**: All EMR modules with 50+ tables

## Files Created

### 1. Comprehensive Schema
**File**: `database/tenant_base_schema_comprehensive_v2.sql`
- **50+ Tables**: Complete EMR functionality
- **Modules Covered**: Clinical, Inpatient, Pharmacy, Lab, Blood Bank, Fleet, HR, Billing, etc.
- **Features**: Indexes, triggers, constraints, views, base data seeding
- **Size**: ~2,500 lines of comprehensive SQL

### 2. Provisioning Script
**File**: `scripts/provision_new_tenant.js`
- **Automated Setup**: Complete tenant provisioning
- **Schema Creation**: Creates isolated schema
- **Data Seeding**: Initial departments, services, employees, inventory
- **User Creation**: Admin user with secure password

### 3. Reference Document
**File**: `COMPREHENSIVE_EMR_REFERENCE.md`
- **Complete Architecture**: Technical documentation
- **Table Structures**: All schemas and relationships
- **API Endpoints**: Required backend endpoints
- **Dashboard Metrics**: Complete mapping

## Quick Start

### Method 1: Command Line Provisioning
```bash
# Basic tenant creation
node scripts/provision_new_tenant.js HOSPITAL "City Hospital" admin@hospital.com password123

# With features and theme
node scripts/provision_new_tenant.js HOSPITAL "City Hospital" admin@hospital.com password123 '{"billing": true, "lab": true}' '{"primaryColor": "#007bff"}'
```

### Method 2: Programmatic Usage
```javascript
import { provisionNewTenant } from './scripts/provision_new_tenant.js';

const tenantData = {
  code: 'HOSPITAL',
  name: 'City Hospital',
  email: 'admin@hospital.com',
  adminPassword: 'password123',
  features: {
    billing: true,
    laboratory: true,
    pharmacy: true,
    inpatient: true
  },
  theme: {
    primaryColor: '#007bff',
    logo: 'https://example.com/logo.png'
  }
};

const result = await provisionNewTenant(tenantData);
console.log('Tenant created:', result);
```

## Provisioning Process

### Step 1: Tenant Record Creation
- Creates entry in `emr.tenants` table
- Generates unique tenant ID
- Stores configuration (features, theme, billing)

### Step 2: Schema Creation
- Creates isolated schema: `<tenant_code>_emr`
- Sets up permissions for database users
- Updates tenant record with schema name

### Step 3: Table Structure Creation
- Executes comprehensive SQL schema
- Creates 50+ tables across all modules
- Sets up indexes, triggers, constraints
- Creates optimized views for common queries

### Step 4: Admin User Creation
- Creates admin user in `emr.users` table
- Hashes password securely
- Links to tenant record
- Sets active status

### Step 5: Initial Data Seeding
- **Departments**: 9 core departments (ER, ICU, Lab, etc.)
- **Services**: 10 common services (consultations, tests, etc.)
- **Lab Tests**: 10 standard lab tests with normal ranges
- **Wards & Beds**: 8 wards with 150+ beds total
- **Employees**: 8 sample employees (doctors, nurses, etc.)
- **Inventory**: 7 sample items (medicines, supplies, equipment)
- **Ambulances**: 3 vehicles with drivers
- **Blood Bank**: 20 blood units across all groups

## Modules Covered

### 1. Clinical Management
- **Patients**: Complete patient records with medical history
- **Appointments**: Scheduling with status tracking
- **Encounters**: Clinical visits with diagnosis and treatment
- **Clinical Records**: Detailed clinical documentation
- **Prescriptions**: Medication orders with dispensing tracking
- **Walkins**: Emergency patient management with tokens

### 2. Inpatient Management
- **Wards**: Different ward types (ICU, General, Private, etc.)
- **Beds**: Individual bed tracking with occupancy
- **Admissions**: Patient admission and discharge tracking
- **Discharges**: Discharge summaries and outcomes

### 3. Laboratory & Diagnostics
- **Lab Tests**: Master catalog with pricing and normal ranges
- **Diagnostic Reports**: Test results and interpretations
- **Sample Management**: Collection and processing tracking

### 4. Pharmacy & Inventory
- **Inventory Items**: Stock management with reorder levels
- **Purchases**: Procurement tracking with suppliers
- **Prescriptions**: Medication orders and dispensing
- **Service Requests**: Pharmacy workflow management
- **Alerts**: Low stock and expiry notifications

### 5. Blood Bank
- **Donors**: Donor database with eligibility tracking
- **Blood Units**: Collection, storage, and expiry management
- **Blood Requests**: Patient blood requirement tracking

### 6. Fleet Management
- **Ambulances**: Vehicle tracking with maintenance schedules
- **Dispatch Records**: Trip tracking with patient details
- **Driver Management**: Staff assignment and contact info

### 7. Human Resources
- **Employees**: Complete staff records with departments
- **Attendance**: Daily attendance tracking
- **Leaves**: Leave management and approval workflow
- **Payroll**: Salary structure and payment processing
- **Performance**: Employee metrics and evaluations

### 8. Billing & Finance
- **Invoices**: Patient billing with itemized charges
- **Invoice Items**: Detailed line items with references
- **Expenses**: Hospital expense tracking and categorization
- **Insurance**: Provider management and claims processing
- **Revenue**: Financial reporting and analytics

### 9. Communications
- **Notices**: Hospital announcements and circulars
- **Documents**: Patient document management
- **Support Tickets**: IT and facilities help desk

### 10. Audit & Compliance
- **Audit Logs**: Complete activity tracking
- **Data Integrity**: Constraints and validation rules
- **Security**: Role-based access control

## Database Schema Highlights

### Performance Optimizations
- **30+ Indexes**: Optimized for common query patterns
- **3 Summary Views**: Patient summary, bed occupancy, revenue summary
- **Triggers**: Automatic timestamp updates
- **Constraints**: Data integrity enforcement

### Data Relationships
- **Foreign Keys**: Proper referential integrity
- **Cascade Operations**: Appropriate data deletion handling
- **UUID Keys**: Distributed-friendly primary keys
- **Tenant Isolation**: Complete data separation

### Advanced Features
- **JSONB Fields**: Flexible data storage (medical history, vitals)
- **Array Types**: Multi-value fields (audience roles)
- **Enum Constraints**: Validated status fields
- **Computed Columns**: Derived values (occupancy rates)

## Post-Provisioning Setup

### 1. Application Configuration
```javascript
// Update application to recognize new tenant
const tenantConfig = {
  code: 'HOSPITAL',
  schema: 'hospital_emr',
  features: ['billing', 'laboratory', 'pharmacy'],
  theme: { primaryColor: '#007bff' }
};
```

### 2. Frontend Access
- **URL**: `http://localhost:5175`
- **Login**: Use admin credentials created during provisioning
- **Dashboard**: All modules available with sample data

### 3. Data Population
- **Sample Data**: 50+ records across all tables
- **Realistic Values**: Proper pricing, capacities, relationships
- **Dashboard Ready**: All metrics display correctly

### 4. Customization
- **Add Departments**: Customize for hospital specialties
- **Modify Services**: Adjust pricing and duration
- **Update Inventory**: Add hospital-specific items
- **Configure Workflows**: Adapt to hospital processes

## Troubleshooting

### Common Issues

#### 1. Schema Creation Failed
**Error**: `permission denied for schema`
**Solution**: Ensure database user has CREATE SCHEMA permissions

#### 2. Foreign Key Constraints
**Error**: `insert or update violates foreign key constraint`
**Solution**: Check data dependencies and insertion order

#### 3. Duplicate Key Errors
**Error**: `duplicate key value violates unique constraint`
**Solution**: Use ON CONFLICT clauses for idempotent operations

#### 4. Permission Issues
**Error**: `permission denied for relation`
**Solution**: Grant proper schema permissions to application user

### Validation Commands

```sql
-- Check tenant creation
SELECT * FROM emr.tenants WHERE code = 'HOSPITAL';

-- Verify schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'hospital_emr';

-- Count tables in schema
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'hospital_emr';

-- Verify data seeding
SELECT COUNT(*) FROM hospital_emr.patients;
SELECT COUNT(*) FROM hospital_emr.employees;
SELECT COUNT(*) FROM hospital_emr.appointments;
```

## Scaling Considerations

### Performance
- **Schema Isolation**: Natural query optimization
- **Connection Pooling**: Per-tenant connection management
- **Index Strategy**: Optimized for tenant-specific queries

### Storage
- **Per-Tenant**: Isolated storage requirements
- **Backup Strategy**: Individual tenant backups possible
- **Archival**: Tenant-specific data retention policies

### Security
- **Data Isolation**: Complete tenant separation
- **Access Control**: Tenant-specific user management
- **Audit Trail**: Per-tenant activity logging

## Maintenance

### Regular Tasks
- **Schema Updates**: Apply schema changes to all tenants
- **Data Cleanup**: Archive old records per tenant policy
- **Performance Monitoring**: Track per-tenant query performance
- **Backup Verification**: Ensure tenant data protection

### Schema Updates
```javascript
// Example: Add new table to all tenants
const tenants = await query('SELECT schema_name FROM emr.tenants WHERE status = $1', ['active']);

for (const tenant of tenants.rows) {
  await query(`SET search_path TO ${tenant.schema_name}`);
  await query(`CREATE TABLE IF NOT EXISTS new_table (...)`);
}
```

## Best Practices

### 1. Tenant Naming
- Use consistent naming convention
- Avoid special characters
- Keep codes short but meaningful

### 2. Data Seeding
- Provide realistic sample data
- Include edge cases for testing
- Maintain data relationships

### 3. Error Handling
- Use idempotent operations
- Log provisioning steps
- Provide rollback capabilities

### 4. Security
- Use strong admin passwords
- Implement proper permissions
- Enable audit logging

## Support

### Documentation
- **Schema Reference**: Complete table documentation
- **API Guide**: Required endpoints per module
- **Troubleshooting**: Common issues and solutions

### Scripts
- **Provisioning**: Automated tenant creation
- **Validation**: Schema and data verification
- **Maintenance**: Ongoing tenant management

---

**This comprehensive provisioning system enables rapid deployment of fully-functional EMR tenants with complete data isolation and all necessary modules pre-configured.**
