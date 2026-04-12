import { query } from '../server/db/connection.js';

async function createSeparateTenantSchema() {
  console.log(' Creating Separate Tenant Schema for DEMO tenant...\n');

  try {
    // Get tenant information
    const tenantResult = await query(
      'SELECT id, code, name FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (tenantResult.rows.length === 0) {
      console.log(' DEMO tenant not found!');
      return;
    }

    const tenant = tenantResult.rows[0];
    console.log(` Found tenant: ${tenant.name} (${tenant.code}) - ID: ${tenant.id}`);

    // Create separate schema for DEMO tenant
    const schemaName = 'demo_emr';
    
    console.log(` Creating separate schema: ${schemaName}`);
    
    // Create the tenant-specific schema
    await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    console.log(`Schema ${schemaName} created successfully`);
    
    // Grant permissions
    await query(`GRANT ALL ON SCHEMA ${schemaName} TO emr_admin`);
    await query(`GRANT USAGE ON SCHEMA ${schemaName} TO emr_admin`);
    console.log(`Permissions granted for ${schemaName}`);
    
    // Update tenant record to include schema name
    await query(
      'UPDATE emr.tenants SET schema_name = $1 WHERE code = $2',
      [schemaName, 'DEMO']
    );
    console.log('Tenant record updated with schema name');
    
    console.log('\n Separate tenant schema created successfully!');
    console.log('\n Architecture Summary:');
    console.log('- Core Application: emr.* (shared tables)');
    console.log('- DEMO Tenant: demo_emr.* (isolated data)');
    console.log('- Next: Update application to use tenant-specific schemas');
    
    return {
      success: true,
      schemaName: schemaName,
      tenantId: tenant.id,
      tenantCode: tenant.code
    };

  } catch (error) {
    console.error(' Error creating separate tenant schema:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the fix
createSeparateTenantSchema().then(result => {
  if (result && result.success) {
    console.log('\n Separate tenant schema creation completed!');
    console.log('\n Next Steps:');
    console.log('1. Update database connection to use tenant-specific schemas');
    console.log('2. Update API endpoints to use tenant-specific queries');
    console.log('3. Update frontend to handle tenant-specific routing');
    console.log('4. Test with separate tenant schemas');
    console.log('5. Update documentation to reflect new architecture');
    
    process.exit(0);
  } else {
    console.log('\n Separate tenant schema creation failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('Critical error in separate tenant schema creation:', error);
  process.exit(1);
});
