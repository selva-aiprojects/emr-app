# Scripts Directory

## Overview
This directory contains utility scripts for database management, tenant provisioning, testing, and maintenance of the MedFlow EMR system.

## Script Categories

### Tenant Provisioning
- **`provision_new_tenant_comprehensive.js`** - Complete automated tenant provisioning
- **`create_demo_admin.js`** - Create demo admin user
- **`create_admin_user.js`** - Create admin user with proper password hash

### Database Management
- **`check_*.js`** - Various database checking and diagnostic scripts
- **`fix_*.js`** - Database fixing and repair scripts
- **`populate_*.js`** - Data population and seeding scripts
- **`seed_*.mjs`** - Module-specific data seeding

### Testing and Validation
- **`test_*.js`** - API and database testing scripts
- **`verify_*.js`** - Data verification and validation scripts
- **`audit_*.js`** - Database audit and compliance scripts

### Utilities
- **`cleanup_*.js`** - Cleanup and maintenance scripts
- **`debug_*.js`** - Debugging and diagnostic utilities
- **`integration-*.js`** - Integration testing scripts

## Key Scripts

### Tenant Provisioning
```bash
# Comprehensive tenant provisioning
node scripts/provision_new_tenant_comprehensive.js

# Create admin user for existing tenant
node scripts/create_admin_user.js
```

### Database Diagnostics
```bash
# Check tenant data completeness
node scripts/check_tenant_data.js

# Verify schema structure
node scripts/check_actual_schema.js

# Test dashboard data
node scripts/test_dashboard_api.js
```

### Data Management
```bash
# Populate missing data
node scripts/populate_all_missing_tables.js

# Fix dashboard issues
node scripts/fix_dashboard_data.js

# Seed comprehensive data
node scripts/seed_all_modules.mjs
```

### Multi-Tenant Testing
```bash
# Test dynamic schemas
node scripts/test_dynamic_schemas.js

# Test reports for both tenants
node scripts/test_reports_both_tenants.js

# Verify tenant isolation
node scripts/check_multi_tenant_isolation.js
```

## Usage Guidelines

### Before Running Scripts
1. Check environment variables (`.env` file)
2. Verify database connection
3. Backup current data if making changes
4. Read script documentation

### Common Parameters
- **Tenant ID**: UUID of the target tenant
- **Schema Name**: Database schema (demo_emr, nhgl, etc.)
- **Environment**: development, staging, production

### Error Handling
- Scripts include error handling and logging
- Check console output for issues
- Verify results after script completion
- Rollback if necessary

## Script Dependencies

### Required Packages
- `node-postgres` - Database connection
- `bcrypt` - Password hashing
- `uuid` - UUID generation
- `fs/promises` - File system operations

### Environment Setup
```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with database credentials
```

## Security Considerations

### Script Permissions
- Limit script execution to authorized users
- Use environment variables for sensitive data
- Audit script execution logs
- Validate input parameters

### Data Protection
- Scripts handle PHI (Protected Health Information)
- Follow HIPAA compliance guidelines
- Use secure database connections
- Log access appropriately

## Troubleshooting

### Common Issues

#### Database Connection
```
Error: Connection refused
```
**Solution**: Check database server status and connection parameters

#### Permission Errors
```
Error: permission denied for schema demo_emr
```
**Solution**: Verify user permissions and tenant membership

#### Missing Tables
```
Error: relation "demo_emr.lab_tests" does not exist
```
**Solution**: Run schema creation script

#### Schema Resolution
```
Error: Schema nhgl not found
```
**Solution**: Create missing schema using provisioning script

### Diagnostic Commands
```bash
# Test database connection
node scripts/test-basic-connection.mjs

# Check all tenant schemas
node scripts/check_all_schemas.js

# Verify data integrity
node scripts/verify_data_integrity.js
```

## Maintenance

### Regular Tasks
- Clean up temporary scripts
- Update documentation
- Test scripts after schema changes
- Monitor script performance

### Script Updates
- Update scripts when schema changes
- Test updates on demo environment first
- Document breaking changes
- Version control all modifications

## Development Guidelines

### Creating New Scripts
1. Follow naming conventions (`category_description.js`)
2. Include comprehensive error handling
3. Add logging and progress indicators
4. Document usage and parameters
5. Test thoroughly before deployment

### Code Standards
- Use async/await for database operations
- Implement proper error handling
- Use parameterized queries
- Include input validation
- Add comprehensive comments

## API Integration

### Script Usage in API
```javascript
import { provisionNewTenant } from './scripts/provision_new_tenant_comprehensive.js';

// API endpoint for tenant provisioning
app.post('/api/admin/tenants/provision', async (req, res) => {
  try {
    const result = await provisionNewTenant(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Error Handling
```javascript
try {
  const result = await scriptFunction(params);
  return { success: true, data: result };
} catch (error) {
  console.error('Script failed:', error);
  return { success: false, error: error.message };
}
```

## Performance Considerations

### Query Optimization
- Use appropriate indexes
- Limit result sets for large datasets
- Batch operations for bulk updates
- Use connection pooling

### Memory Management
- Process large datasets in chunks
- Close database connections properly
- Monitor memory usage
- Implement pagination where needed

## Automation

### Scheduled Tasks
```bash
# Daily data verification
0 2 * * * /usr/bin/node /path/to/scripts/verify_data_integrity.js

# Weekly performance monitoring
0 3 * * 0 /usr/bin/node /path/to/scripts/monitor_performance.js

# Monthly cleanup
0 4 1 * * /usr/bin/node /path/to/scripts/cleanup_old_data.js
```

### CI/CD Integration
- Include scripts in testing pipeline
- Run diagnostic scripts on deployment
- Automate data verification
- Monitor script performance

## Documentation

### Script Documentation
Each script should include:
- Purpose and functionality
- Required parameters
- Usage examples
- Error handling information
- Dependencies and requirements

### README Updates
Update this README when:
- Adding new script categories
- Modifying existing scripts
- Changing usage patterns
- Updating dependencies

## Support

### Getting Help
- Check script documentation
- Review console output for errors
- Verify environment configuration
- Contact development team for issues

### Reporting Issues
- Include script name and version
- Provide error messages and stack traces
- Describe expected vs actual behavior
- Include environment details
