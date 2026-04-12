# Dynamic Schema System Documentation

## Overview
The MedFlow EMR system implements a dynamic multi-tenant architecture where each tenant has its own isolated database schema. The system automatically determines the correct schema based on tenant login credentials.

## Schema Naming Convention

### Logic Implementation
```javascript
// tenant.code from emr.tenants table determines schema name
const schemaName = tenantCode === 'nhgl' ? 'nhgl' : `${tenantCode}_emr`;
```

### Examples
| Tenant Code | Schema Name | Description |
|-------------|-------------|-------------|
| NHGL | `nhgl` | Special case for NHGL tenant |
| DEMO | `demo_emr` | Standard naming convention |
| TEST | `test_emr` | Standard naming convention |
| CLIENT1 | `client1_emr` | Standard naming convention |

## Implementation Details

### Core Components

#### 1. Tenant Schema Helper (`server/utils/tenant-schema-helper.js`)
```javascript
import { getTenantSchema, queryWithTenantSchema } from '../utils/tenant-schema-helper.js';

// Dynamic schema resolution
const schemaName = await getTenantSchema(tenantId);

// Query with dynamic schema
const result = await queryWithTenantSchema(tenantId, 
  'SELECT * FROM {schema}.patients WHERE tenant_id = $1', 
  [tenantId]
);
```

#### 2. Report Routes (`server/routes/report.routes.js`)
```javascript
// Updated to use dynamic schemas
const safeQuery = async (q, p) => {
  try { 
    if (q.includes('{schema}')) {
      return await queryWithTenantSchema(tenantId, q, p);
    }
    return await query(q, p); 
  }
  catch (e) { return { rows: [] }; }
};
```

#### 3. Dashboard Metrics (`server/enhanced_dashboard_metrics_fixed.mjs`)
```javascript
const schemaName = await getTenantSchema(tenantId);
console.log(`Using schema: ${schemaName} for tenant: ${tenantId}`);
```

## Database Structure

### Global Schema (`emr`)
```sql
-- Tenant management
emr.tenants (id, name, code, subdomain, contact_email, status)
emr.users (id, tenant_id, name, email, role, password_hash)
emr.roles (id, name, permissions)
```

### Tenant Schemas (`demo_emr`, `nhgl`, etc.)
```sql
-- Clinical data
{schema}.patients
{schema}.appointments  
{schema}.invoices
{schema}.lab_tests
{schema}.blood_units
-- ... 50+ more tables
```

## Query Resolution Process

1. **Authentication**: User logs in with tenant credentials
2. **Tenant Lookup**: System queries `emr.tenants` for tenant code
3. **Schema Determination**: Code determines schema name using naming convention
4. **Query Routing**: All database queries are routed to the correct schema
5. **Data Isolation**: Each tenant sees only their own data

## Security and Isolation

### Schema-Level Isolation
- Each tenant has completely isolated database schema
- No cross-tenant data access possible
- Row-level security enforced by tenant_id columns

### Connection Pooling
- Single connection pool serves all tenants
- Schema switching happens at query level
- Efficient resource utilization

## Troubleshooting

### Common Issues

#### Schema Not Found
```
Schema nhgl not found for tenant ID, falling back to demo_emr
```
**Solution**: Create the missing schema using provisioning script

#### Permission Denied
```
Permission denied for schema demo_emr
```
**Solution**: Verify user has correct tenant_id and role permissions

#### Missing Tables
```
relation "nhgl.lab_tests" does not exist
```
**Solution**: Run comprehensive schema creation script

### Diagnostic Commands

```javascript
// Check available schemas
await getAvailableTenantSchemas();

// Test specific tenant schema
const schema = await getTenantSchema(tenantId);
console.log(`Tenant schema: ${schema}`);

// Verify table exists
await query(`SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = $1 AND table_name = $2
)`, [schema, 'patients']);
```

## Performance Considerations

### Schema Resolution Caching
- Tenant information cached for performance
- Schema name determined once per session
- Minimal overhead for dynamic queries

### Index Optimization
- Each schema has its own indexes
- Tenant_id columns indexed for performance
- Query optimization per schema

## Migration and Updates

### Schema Updates
1. Update `tenant_base_schema_comprehensive_v2.sql`
2. Test against both DEMO and NHGL schemas
3. Apply updates to existing schemas
4. Verify tenant functionality

### New Tenant Onboarding
1. Add tenant to `emr.tenants` table
2. Run provisioning script
3. Create admin user
4. Verify data isolation

## API Integration

### Dynamic Schema in API Routes
```javascript
router.get('/api/reports/dashboard/metrics', async (req, res) => {
  const tenantId = req.tenantId;
  const schemaName = await getTenantSchema(tenantId);
  
  // All queries automatically use correct schema
  const metrics = await getRealtimeDashboardMetrics(tenantId);
  
  res.json(metrics);
});
```

### Frontend Integration
Frontend doesn't need to know schema names - handled entirely by backend based on authentication.

## Best Practices

1. **Always use tenant_id** in WHERE clauses for additional security
2. **Test with multiple tenants** to ensure proper isolation
3. **Monitor schema creation** for new tenant provisioning
4. **Regular backup** of all tenant schemas
5. **Audit schema access** for security compliance

## Future Enhancements

- Automatic schema versioning
- Cross-tenant reporting (superadmin only)
- Schema health monitoring
- Automated migration tools
