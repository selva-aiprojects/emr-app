const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Testing Direct Auth Query ===');
    
    const userId = 'fea639c5-7d9b-41ec-9b58-0a41a6a8b5a7';
    console.log('Testing with userId:', userId);
    
    // Test the exact query that's failing
    const userResult = await query(
      `SELECT u.id, u.tenant_id, u.email, u.name, u.role, u.patient_id, u.is_active, t.subscription_tier 
       FROM emr.users u 
       LEFT JOIN emr.tenants t ON u.tenant_id = t.id 
       WHERE u.id = $1`,
      [userId]
    );
    
    console.log('Query successful, rows:', userResult.rows.length);
    if (userResult.rows.length > 0) {
      console.log('User found:', userResult.rows[0].email);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
