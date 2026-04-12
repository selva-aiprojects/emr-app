import { query } from '../server/db/connection.js';

async function cleanupDemoTenant() {
  console.log(' Cleaning up existing DEMO tenant...\n');

  try {
    // Get tenant ID
    const tenantResult = await query(
      'SELECT id FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (tenantResult.rows.length === 0) {
      console.log(' DEMO tenant not found, proceeding with creation...');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log(` Found DEMO tenant with ID: ${tenantId}`);

    // Clean up in order to respect foreign key constraints
    console.log(' Cleaning up demo data...');

    // Delete beds
    await query('DELETE FROM emr.beds WHERE tenant_id = $1', [tenantId]);
    console.log('  Deleted beds');

    // Delete wards
    await query('DELETE FROM emr.wards WHERE tenant_id = $1', [tenantId]);
    console.log('  Deleted wards');

    // Delete departments
    await query('DELETE FROM emr.departments WHERE tenant_id = $1', [tenantId]);
    console.log('  Deleted departments');

    // Delete users
    await query('DELETE FROM emr.users WHERE tenant_id = $1', [tenantId]);
    console.log('  Deleted users');

    // Delete tenant
    await query('DELETE FROM emr.tenants WHERE id = $1', [tenantId]);
    console.log('  Deleted tenant');

    console.log('\n DEMO tenant cleanup completed!');

  } catch (error) {
    console.error(' Error cleaning up demo tenant:', error);
    process.exit(1);
  }
}

// Run the script
cleanupDemoTenant().then(() => {
  console.log(' Cleanup completed!');
  process.exit(0);
}).catch(error => {
  console.error(' Script failed:', error);
  process.exit(1);
});
