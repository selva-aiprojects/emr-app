# Tenant Provisioning Guide

## Overview
This guide covers the complete process of provisioning new tenants in the MedFlow EMR system, including schema creation, data seeding, and user management.

## Provisioning Methods

### 1. Automated Provisioning (Recommended)
Use the comprehensive provisioning script for complete automated setup.

```javascript
import { provisionNewTenant } from '../scripts/provision_new_tenant_comprehensive.js';

const newTenant = {
  name: 'New Hospital',
  code: 'NEW',
  subdomain: 'new',
  contactEmail: 'admin@new.hospital',
  subscriptionTier: 'Professional'
};

const result = await provisionNewTenant(newTenant);
```

### 2. Manual Provisioning
Step-by-step manual process for custom requirements.

## Automated Provisioning Script

### Features
- Dynamic schema determination
- Complete table creation (55+ tables)
- Admin user creation with secure password
- Initial data seeding
- Verification and reporting
- Error handling and rollback

### Usage

#### Basic Provisioning
```javascript
node scripts/provision_new_tenant_comprehensive.js
```

#### Programmatic Usage
```javascript
import { provisionNewTenant } from './scripts/provision_new_tenant_comprehensive.js';

const tenantData = {
  name: 'City General Hospital',
  code: 'CITY',
  subdomain: 'city',
  contactEmail: 'admin@city.hospital',
  subscriptionTier: 'Enterprise'
};

try {
  const result = await provisionNewTenant(tenantData);
  console.log('Tenant provisioned successfully:', result);
} catch (error) {
  console.error('Provisioning failed:', error);
}
```

### Output Example
```json
{
  "success": true,
  "tenant": {
    "id": "12345678-1234-1234-1234-123456789012",
    "name": "City General Hospital",
    "code": "CITY",
    "subdomain": "city",
    "created_at": "2025-04-12T10:00:00Z"
  },
  "schemaName": "city_emr",
  "adminCredentials": {
    "email": "admin@city.hospital",
    "password": "Admin@123"
  }
}
```

## Manual Provisioning Steps

### Step 1: Create Tenant Record
```sql
INSERT INTO emr.tenants (
  id, name, code, subdomain, contact_email, 
  subscription_tier, status, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'City General Hospital',
  'CITY',
  'city',
  'admin@city.hospital',
  'Professional',
  'active',
  NOW(),
  NOW()
);
```

### Step 2: Create Schema
```sql
-- Schema name determined by tenant code
CREATE SCHEMA city_emr;
```

### Step 3: Execute Schema Script
```bash
# Replace placeholders and execute
psql -d medflow_emr -f database/tenant_base_schema_comprehensive_v2.sql
```

### Step 4: Create Admin User
```javascript
import bcrypt from 'bcrypt';

const passwordHash = await bcrypt.hash('Admin@123', 10);
await query(`
  INSERT INTO emr.users (
    tenant_id, name, email, role, password_hash, 
    is_active, created_at, updated_at
  ) VALUES ($1, $2, $3, 'admin', $4, true, NOW(), NOW())
`, [tenantId, 'Admin User', 'admin@city.hospital', passwordHash]);
```

### Step 5: Seed Initial Data
```javascript
// Create sample patients, appointments, beds, etc.
await seedInitialData(tenantId, 'city_emr');
```

## Data Seeding

### Initial Data Categories

#### 1. Departments
```sql
INSERT INTO city_emr.departments (tenant_id, name, code, type) VALUES
  ('{tenant_id}', 'General Medicine', 'GM', 'Clinical'),
  ('{tenant_id}', 'Emergency', 'ER', 'Clinical'),
  ('{tenant_id}', 'Laboratory', 'LAB', 'Diagnostic');
```

#### 2. Services
```sql
INSERT INTO city_emr.services (tenant_id, name, category, price) VALUES
  ('{tenant_id}', 'General Consultation', 'Consultation', 500.00),
  ('{tenant_id}', 'Complete Blood Count', 'Laboratory', 350.00);
```

#### 3. Lab Tests
```sql
INSERT INTO city_emr.lab_tests (tenant_id, test_name, category, price) VALUES
  ('{tenant_id}', 'Complete Blood Count', 'Hematology', 500.00),
  ('{tenant_id}', 'Lipid Profile', 'Biochemistry', 800.00);
```

#### 4. Sample Data
- 20 sample patients
- 10 sample appointments
- 50 sample beds across wards
- 5 sample employees

## Verification

### Post-Provisioning Checks
```javascript
// Verify schema exists
const schemaCheck = await query(`
  SELECT schema_name 
  FROM information_schema.schemata 
  WHERE schema_name = $1
`, ['city_emr']);

// Verify table counts
const tableCounts = await Promise.all([
  query(`SELECT COUNT(*) as count FROM city_emr.patients WHERE tenant_id = $1`),
  query(`SELECT COUNT(*) as count FROM city_emr.appointments WHERE tenant_id = $1`),
  query(`SELECT COUNT(*) as count FROM city_emr.departments WHERE tenant_id = $1`)
]);

// Verify admin user
const adminCheck = await query(`
  SELECT id, name, email FROM emr.users 
  WHERE tenant_id = $1 AND role = 'admin'
`);
```

### Expected Results
- 55+ tables created
- 20 patients seeded
- 10 appointments seeded
- 5 departments seeded
- 10 lab tests seeded
- Admin user created

## Customization Options

### Subscription Tiers
- **Basic**: Limited departments and services
- **Professional**: Full feature set (default)
- **Enterprise**: Advanced features and customizations

### Data Seeding Levels
- **Minimal**: Essential data only
- **Standard**: Sample data for testing (default)
- **Comprehensive**: Full dataset for demos

### Schema Customization
- Custom table additions
- Modified column structures
- Additional constraints and indexes

## Troubleshooting

### Common Issues

#### Schema Creation Failed
```
ERROR: schema "city_emr" already exists
```
**Solution**: Check if tenant already exists or use different tenant code

#### Permission Denied
```
ERROR: permission denied for schema city_emr
```
**Solution**: Verify database user has CREATE privileges

#### Missing Tables
```
ERROR: relation "city_emr.patients" does not exist
```
**Solution**: Re-run schema creation script

#### User Creation Failed
```
ERROR: null value in column "password_hash" violates not-null constraint
```
**Solution**: Ensure password is properly hashed before insertion

### Diagnostic Commands

```javascript
// Check tenant status
const tenantStatus = await query(`
  SELECT id, name, code, status, created_at 
  FROM emr.tenants 
  WHERE code = $1
`, ['CITY']);

// Check schema tables
const schemaTables = await query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = $1
`, ['city_emr']);

// Test dynamic resolution
const { getTenantSchema } = require('../utils/tenant-schema-helper.js');
const schema = await getTenantSchema(tenantId);
console.log(`Schema resolved to: ${schema}`);
```

## Best Practices

### Before Provisioning
1. Verify tenant code uniqueness
2. Check database permissions
3. Validate contact email format
4. Confirm subscription tier features

### During Provisioning
1. Monitor for errors at each step
2. Verify schema creation success
3. Check data seeding completion
4. Test admin user creation

### After Provisioning
1. Test tenant login functionality
2. Verify dashboard data display
3. Check Reports & Analysis page
4. Validate data isolation

### Security Considerations
1. Use strong admin passwords
2. Enable two-factor authentication
3. Set up proper user roles
4. Configure audit logging

## Maintenance

### Regular Tasks
- Monitor schema sizes
- Backup tenant schemas
- Update tenant subscriptions
- Review user access logs

### Schema Updates
1. Test updates on demo schema first
2. Apply updates to all tenant schemas
3. Verify functionality after updates
4. Rollback if issues detected

### Data Management
- Archive old patient data
- Optimize large tables
- Monitor storage usage
- Plan capacity upgrades

## API Integration

### Provisioning API Endpoint
```javascript
POST /api/admin/tenants/provision
{
  "name": "New Hospital",
  "code": "NEW",
  "subdomain": "new",
  "contactEmail": "admin@new.hospital",
  "subscriptionTier": "Professional"
}
```

### Response
```json
{
  "success": true,
  "tenant": { "id": "...", "name": "New Hospital" },
  "schemaName": "new_emr",
  "adminCredentials": { "email": "admin@new.hospital", "password": "Admin@123" }
}
```

## Support and Monitoring

### Health Checks
```javascript
// Check all tenant schemas
const allTenants = await getAvailableTenantSchemas();
for (const tenant of allTenants) {
  const health = await checkTenantHealth(tenant.tenant_id);
  console.log(`${tenant.tenant_code}: ${health.status}`);
}
```

### Monitoring Metrics
- Schema creation success rate
- Provisioning time averages
- Error frequency and types
- Resource usage per tenant

### Alerting
- Provisioning failures
- Schema corruption
- Storage limit warnings
- Performance degradation
