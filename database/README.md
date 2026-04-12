# Database Documentation

## Overview
This directory contains all database-related files for the MedFlow EMR system, including schemas, migrations, and utilities.

## File Structure

### Schema Files
- **`tenant_base_schema_comprehensive_v2.sql`** - Complete tenant schema with all tables
- **`tenant_base_schema.sql`** - Legacy tenant schema (deprecated)
- **`schema.sql`** - Global schema definition

### Migration Files
- **`migrations/`** - Database migration scripts
- **`seeds/`** - Data seeding scripts

### Utility Scripts
- **`connection.js`** - Database connection configuration
- **`audit_*.js`** - Database audit scripts

## Schema Documentation

### Global Schema (`emr`)
- **Tenants**: Multi-tenant management
- **Users**: Authentication and authorization
- **Roles**: Role-based access control

### Tenant Schemas (`{code}_emr` or `nhgl`)
- **Clinical Data**: Patients, appointments, encounters
- **Financial Data**: Invoices, payments, billing
- **Hospital Management**: Beds, wards, departments
- **Laboratory**: Tests, reports, results
- **Blood Bank**: Donors, units, requests
- **Pharmacy**: Inventory, prescriptions
- **HR**: Employees, attendance, payroll

## Dynamic Schema System

### Schema Naming Convention
```
NHGL -> nhgl
DEMO -> demo_emr
TEST -> test_emr
```

### Schema Resolution
The system automatically determines the correct schema based on tenant login:

```javascript
const schemaName = await getTenantSchema(tenantId);
// Returns: 'nhgl' for NHGL, 'demo_emr' for DEMO, etc.
```

## Usage Instructions

### Creating New Tenants
```bash
# Use automated provisioning script
node scripts/provision_new_tenant_comprehensive.js
```

### Manual Schema Creation
```sql
-- 1. Create tenant record
INSERT INTO emr.tenants (name, code, subdomain, contact_email, subscription_tier, status)
VALUES ('New Hospital', 'NEW', 'new', 'admin@new.hospital', 'Professional', 'active');

-- 2. Create schema
CREATE SCHEMA new_emr;

-- 3. Execute schema script
SET search_path TO new_emr;
\i tenant_base_schema_comprehensive_v2.sql
```

### Schema Updates
1. Update `tenant_base_schema_comprehensive_v2.sql`
2. Test on demo schema first
3. Apply to all tenant schemas
4. Verify functionality

## Table Relationships

### Core Clinical Flow
```
patients -> appointments -> encounters -> prescriptions
    \           \              /
     \           \            /
      \           \           /
       invoices <- invoice_items
```

### Hospital Management
```
departments -> wards -> beds -> patients
     \          \        /
      \          \      /
       employees -> attendance
```

### Laboratory Flow
```
lab_tests -> diagnostic_reports -> patients
    \              /
     \            /
      blood_units -> blood_requests
```

## Data Types and Constraints

### Common Patterns
- **Primary Keys**: UUID with `gen_random_uuid()`
- **Tenant Isolation**: `tenant_id uuid NOT NULL` in all tables
- **Timestamps**: `created_at` and `updated_at` in all tables
- **JSONB**: Flexible data storage for medical records

### Data Types Used
- `uuid`: Primary keys and foreign keys
- `text`: Variable-length strings
- `character varying(n)`: Fixed max length strings
- `timestamp with time zone`: Date/time with timezone
- `numeric(p,s)`: Precise decimal numbers
- `jsonb`: Structured JSON data

## Performance Optimization

### Indexes
```sql
-- Essential indexes
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_blood_units_expiry_date ON blood_units(expiry_date);
```

### Query Optimization
- Use appropriate indexes for frequent queries
- Partition large tables by date
- Optimize JSONB queries with GIN indexes
- Use connection pooling

## Security Considerations

### Multi-Tenant Isolation
- Each tenant has isolated database schema
- Row-level security with tenant_id filtering
- No cross-tenant data access possible
- Role-based access controls

### Data Protection
- Encrypt sensitive fields (passwords, PHI)
- Audit logging for all changes
- Regular security audits
- Encrypted backups

## Troubleshooting

### Common Issues

#### Schema Not Found
```
ERROR: schema "new_emr" does not exist
```
**Solution**: Run tenant provisioning script

#### Permission Denied
```
ERROR: permission denied for schema demo_emr
```
**Solution**: Check user permissions and tenant membership

#### Missing Tables
```
ERROR: relation "demo_emr.lab_tests" does not exist
```
**Solution**: Run comprehensive schema creation script

### Diagnostic Queries
```sql
-- Check all tenant schemas
SELECT schemaname, COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname LIKE '%_emr' OR schemaname = 'nhgl'
GROUP BY schemaname;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname LIKE '%_emr' OR schemaname = 'nhgl'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Migration Guide

### Version Updates
1. Backup all tenant schemas
2. Test migration on demo schema
3. Create migration script
4. Apply to all tenant schemas
5. Verify functionality
6. Update version tracking

### Rollback Strategy
- Keep backup of previous schema version
- Test rollback procedures
- Document rollback steps
- Monitor for issues after rollback

## Maintenance

### Regular Tasks
- Monitor schema sizes and growth
- Optimize large tables periodically
- Update statistics for query planner
- Archive old data according to retention policies

### Backup Strategy
- Daily backups of all schemas
- Weekly full database backup
- Point-in-time recovery capability
- Test restore procedures regularly

## Connection Configuration

### Development
```javascript
const config = {
  host: 'localhost',
  port: 5432,
  database: 'medflow_emr',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};
```

### Production
```javascript
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 50,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000
};
```

## API Integration

### Dynamic Schema in Queries
```javascript
import { queryWithTenantSchema } from '../utils/tenant-schema-helper.js';

// Automatic schema resolution
const patients = await queryWithTenantSchema(tenantId,
  'SELECT COUNT(*) as count FROM {schema}.patients WHERE tenant_id = $1',
  [tenantId]
);
```

### Error Handling
```javascript
try {
  const result = await queryWithTenantSchema(tenantId, query, params);
  return result;
} catch (error) {
  console.error(`Query failed for tenant ${tenantId}:`, error);
  return { rows: [] }; // Graceful fallback
}
```

## Monitoring and Analytics

### Performance Metrics
- Query execution time per schema
- Connection pool utilization
- Schema size and growth trends
- Error rates by tenant

### Health Checks
```javascript
async function checkTenantHealth(tenantId) {
  const schema = await getTenantSchema(tenantId);
  const checks = await Promise.all([
    query(`SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`, [schema]),
    queryWithTenantSchema(tenantId, 'SELECT COUNT(*) FROM {schema}.patients', [tenantId]),
    queryWithTenantSchema(tenantId, 'SELECT COUNT(*) FROM {schema}.appointments', [tenantId])
  ]);
  
  return {
    schemaExists: checks[0].rows.length > 0,
    hasPatients: checks[1].rows[0].count > 0,
    hasAppointments: checks[2].rows[0].count > 0
  };
}
```

## Future Enhancements

### Planned Improvements
- Automatic schema versioning
- Cross-tenant analytics (superadmin)
- Schema health monitoring
- Automated optimization recommendations

### Advanced Features
- Schema partitioning for large datasets
- Read replicas for reporting queries
- Real-time data synchronization
- Advanced audit logging
