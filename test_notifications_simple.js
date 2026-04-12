import { query } from './server/db/connection.js';
import { generateToken } from './server/services/auth.service.js';

async function testNotificationsDirect() {
  try {
    console.log('Testing notifications directly from database...');
    
    // Get DEMO tenant
    const tenantResult = await query('SELECT id FROM emr.tenants WHERE code = $1', ['DEMO']);
    if (tenantResult.rows.length === 0) {
      console.error('DEMO tenant not found');
      return;
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log(`Found DEMO tenant: ${tenantId}`);
    
    // Test the pharmacy alerts directly
    const alerts = await query(`
      SELECT id, alert_type, message, severity, is_read, created_at, updated_at
      FROM demo_emr.pharmacy_alerts 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [tenantId]);
    
    console.log(`\nFound ${alerts.rows.length} notifications:`);
    
    alerts.rows.forEach((alert, index) => {
      console.log(`\n${index + 1}. ${alert.alert_type.toUpperCase()}`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Severity: ${alert.severity}`);
      console.log(`   Created: ${alert.created_at}`);
      console.log(`   Read: ${alert.is_read ? 'Yes' : 'No'}`);
    });
    
    console.log('\n Notification categories:');
    const categories = {};
    alerts.rows.forEach(alert => {
      categories[alert.alert_type] = (categories[alert.alert_type] || 0) + 1;
    });
    
    Object.entries(categories).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    // Generate a test token for frontend testing
    const testToken = generateToken({
      userId: 'test-user-id',
      tenantId: tenantId,
      role: 'Admin',
      email: 'test@demo.hospital'
    });
    
    console.log(`\nTest token for frontend: ${testToken}`);
    console.log(`Tenant ID: ${tenantId}`);
    
    console.log('\n You can now test the frontend with these credentials:');
    console.log('- URL: http://localhost:5175');
    console.log('- Email: rajesh@demo.hospital');
    console.log('- Password: Demo@123');
    console.log('\nThe notifications should now show real data from the database!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testNotificationsDirect();
