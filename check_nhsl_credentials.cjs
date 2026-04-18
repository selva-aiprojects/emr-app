const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Finding NHSL Admin User ===');
    const tenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    const result = await query('SELECT email, password FROM emr.users WHERE tenant_id = $1 AND role = \'Admin\' LIMIT 1', [tenantId]);
    if (result.rows.length > 0) {
      console.log('NHSL Admin Credentials:');
      console.log('Email:', result.rows[0].email);
      console.log('Password:', result.rows[0].password || 'Admin@123 (default)');
    } else {
      console.log('No admin user found for NHSL tenant');
      console.log('Trying default credentials...');
      console.log('Email: admin@nhsl.local');
      console.log('Password: Admin@123');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
