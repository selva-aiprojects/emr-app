# Tenant Management Documentation

## Overview
This section contains comprehensive documentation for managing multi-tenant operations in the MedFlow EMR system, including provisioning, monitoring, and maintenance procedures.

## Key Documents

### **[Dynamic Schema System](../MULTI_TENANCY/DYNAMIC_SCHEMA_SYSTEM.md)**
- Complete technical documentation of the dynamic schema resolution system
- Schema naming conventions and tenant isolation strategy
- Implementation details and troubleshooting guide

### **[Tenant Provisioning Guide](../MULTI_TENANCY/TENANT_PROVISIONING.md)**
- Step-by-step guide for provisioning new tenants
- Automated provisioning scripts and procedures
- Data seeding and verification processes

### **[Schema Reference](../MULTI_TENANCY/SCHEMA_REFERENCE.md)**
- Complete database schema documentation
- Table structures, relationships, and constraints
- Migration and versioning information

### **[Reports & Analysis](../MULTI_TENANCY/REPORTS_ANALYSIS.md)**
- Reports API documentation and troubleshooting
- Dashboard metrics and data flow
- Multi-tenant data isolation and security

## Quick Links

### **Provisioning Scripts**
```bash
# Automated tenant provisioning
node scripts/provision_new_tenant_comprehensive.js

# Test tenant functionality
node scripts/test_reports_both_tenants.js

# Verify system health
node scripts/verify_system_health.js
```

### **Database Operations**
```bash
# Check tenant schemas
node scripts/check_dynamic_schemas.js

# Verify data integrity
node scripts/check_tenant_data.js

# Test database connections
node scripts/test_database_connection.js
```

### **Monitoring and Maintenance**
```bash
# Monitor tenant performance
node scripts/monitor_tenant_performance.js

# Audit tenant data
node scripts/audit_tenant_data.js

# Clean up old data
node scripts/cleanup_tenant_data.js
```

## Architecture Summary

### Multi-Tenant Design
```
emr (Global Schema)
  - tenants (tenant management)
  - users (authentication)
  - roles (permissions)

{tenant_code}_emr or nhgl (Tenant Schemas)
  - Clinical data and operations
  - Isolated per tenant
  - Dynamic schema resolution
```

### Schema Resolution Logic
```javascript
// Automatic schema determination
const schemaName = tenantCode === 'nhgl' ? 'nhgl' : `${tenantCode}_emr`;

// Dynamic query execution
const result = await queryWithTenantSchema(tenantId, 
  'SELECT * FROM {schema}.patients WHERE tenant_id = $1', 
  [tenantId]
);
```

## Current Tenants

### DEMO Tenant
- **Tenant ID**: `20d07615-8de9-49b4-9929-ec565197e6f4`
- **Schema**: `demo_emr`
- **Admin Email**: `admin@demo.hospital`
- **Password**: `Demo@123`
- **Status**: Active with complete data

### NHGL Tenant
- **Tenant ID**: `b01f0cdc-4e8b-4db5-ba71-e657a414695e`
- **Schema**: `nhgl`
- **Admin Email**: `admin@nhgl.hospital`
- **Password**: `Admin@123`
- **Status**: Active with complete data

## Common Operations

### Create New Tenant
```javascript
import { provisionNewTenant } from '../scripts/provision_new_tenant_comprehensive.js';

const newTenant = {
  name: 'City General Hospital',
  code: 'CITY',
  subdomain: 'city',
  contactEmail: 'admin@city.hospital',
  subscriptionTier: 'Professional'
};

const result = await provisionNewTenant(newTenant);
```

### Check Tenant Health
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

### Update Tenant Schema
```bash
# Apply schema updates to all tenants
node scripts/update_all_tenant_schemas.js

# Verify schema updates
node scripts/verify_schema_updates.js
```

## Troubleshooting

### Common Issues

#### Schema Not Found
```
ERROR: schema "new_emr" does not exist
```
**Solution**: Run tenant provisioning script to create the schema

#### Permission Denied
```
ERROR: permission denied for schema demo_emr
```
**Solution**: Verify user permissions and tenant membership

#### Missing Tables
```
ERROR: relation "demo_emr.lab_tests" does not exist
```
**Solution**: Run comprehensive schema creation script

### Diagnostic Commands
```bash
# Check all tenant schemas
node scripts/list_all_tenant_schemas.js

# Verify tenant data completeness
node scripts/check_tenant_completeness.js

# Test tenant isolation
node scripts/test_tenant_isolation.js
```

## Security Considerations

### Data Isolation
- Each tenant has completely isolated database schema
- Row-level security enforced by tenant_id columns
- No cross-tenant data access possible
- Regular security audits recommended

### Access Control
- Role-based permissions per tenant
- Tenant-specific user management
- Audit logging for all operations
- Secure authentication with JWT tokens

### Backup and Recovery
- Individual tenant schema backups
- Point-in-time recovery capability
- Regular backup verification
- Disaster recovery procedures

## Performance Optimization

### Database Optimization
- Appropriate indexes for tenant queries
- Connection pooling for multi-tenant access
- Query optimization for large datasets
- Regular maintenance and vacuuming

### Caching Strategy
- Schema resolution caching per session
- API response caching for static data
- Database query result caching
- Frontend state management

## Monitoring and Analytics

### Key Metrics
- Tenant count and growth
- Schema sizes and storage usage
- Query performance per tenant
- Error rates and patterns

### Health Checks
```javascript
// Monitor all tenants
async function monitorAllTenants() {
  const tenants = await getAvailableTenantSchemas();
  
  for (const tenant of tenants) {
    const health = await checkTenantHealth(tenant.tenant_id);
    console.log(`${tenant.tenant_code}: ${health.schemaExists ? 'OK' : 'ERROR'}`);
  }
}
```

### Performance Monitoring
```javascript
// Track query performance
const start = Date.now();
const result = await queryWithTenantSchema(tenantId, query, params);
const duration = Date.now() - start;
console.log(`Query executed in ${duration}ms for tenant ${tenantId}`);
```

## Best Practices

### Tenant Management
1. **Always use tenant_id** in WHERE clauses for additional security
2. **Test with multiple tenants** to ensure proper isolation
3. **Monitor schema creation** for new tenant provisioning
4. **Regular backup** of all tenant schemas
5. **Audit schema access** for security compliance

### Development Guidelines
1. **Use dynamic schema helpers** for all tenant queries
2. **Handle schema resolution errors gracefully**
3. **Test with both DEMO and NHGL tenants**
4. **Document tenant-specific customizations**
5. **Implement proper error handling** for tenant operations

## API Integration

### Tenant Management API
```javascript
// Create tenant
POST /api/admin/tenants/provision
{
  "name": "New Hospital",
  "code": "NEW",
  "subdomain": "new",
  "contactEmail": "admin@new.hospital",
  "subscriptionTier": "Professional"
}

// Get tenant status
GET /api/admin/tenants/:id/status

// Update tenant
PUT /api/admin/tenants/:id
{
  "name": "Updated Hospital Name",
  "status": "active"
}

// Delete tenant
DELETE /api/admin/tenants/:id
```

### Response Format
```json
{
  "success": true,
  "tenant": {
    "id": "12345678-1234-1234-1234-123456789012",
    "name": "New Hospital",
    "code": "NEW",
    "schemaName": "new_emr",
    "status": "active"
  },
  "adminCredentials": {
    "email": "admin@new.hospital",
    "password": "Admin@123"
  }
}
```

## Maintenance Procedures

### Regular Tasks
- Monitor tenant schema sizes and growth
- Optimize large tables periodically
- Update statistics for query planner
- Archive old data according to retention policies
- Check for orphaned data and inconsistencies

### Schema Updates
1. Test updates on demo schema first
2. Create migration scripts
3. Apply to all tenant schemas
4. Verify functionality after updates
5. Update version tracking

### Data Management
- Archive old patient data per tenant
- Optimize storage usage per tenant
- Monitor storage quotas and limits
- Plan capacity upgrades

## Support and Resources

### Getting Help
- Check tenant management documentation
- Review troubleshooting guides
- Monitor system health dashboards
- Contact support team for complex issues

### Emergency Procedures
1. **Schema Corruption**: Restore from backup
2. **Performance Issues**: Check connection pooling
3. **Data Inconsistency**: Run integrity checks
4. **Security Breach**: Audit and secure system

## Future Enhancements

### Planned Features
- Automated schema versioning
- Cross-tenant reporting (superadmin only)
- Schema health monitoring dashboard
- Automated optimization recommendations
- Bulk tenant management tools

### Advanced Features
- Schema partitioning for large datasets
- Read replicas for reporting queries
- Real-time data synchronization
- Advanced audit logging and compliance

---

*Last Updated: April 12, 2025*
*Version: 2.0*
