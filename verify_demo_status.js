import { query } from './server/db/connection.js';

async function verifyDemoStatus() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== DEMO TENANT STATUS VERIFICATION ===\n');
    
    // Check tenant
    const tenant = await query('SELECT * FROM emr.tenants WHERE code = $1', ['DEMO']);
    console.log('Tenant Status:', tenant.rows[0]?.name || 'Not found');
    
    // Check data counts
    const [patients, employees, appointments, invoices, clinicalRecords, notifications] = await Promise.all([
      query('SELECT COUNT(*) as count FROM demo_emr.patients WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.employees WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.invoices WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.clinical_records WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.pharmacy_alerts WHERE tenant_id = $1', [tenantId])
    ]);
    
    console.log('\n Data Population Status:');
    console.log(` Patients: ${patients.rows[0].count}`);
    console.log(` Employees: ${employees.rows[0].count}`);
    console.log(` Appointments: ${appointments.rows[0].count}`);
    console.log(` Invoices: ${invoices.rows[0].count}`);
    console.log(` Clinical Records: ${clinicalRecords.rows[0].count}`);
    console.log(` Notifications: ${notifications.rows[0].count}`);
    
    // Check admin users
    const adminUsers = await query('SELECT email, name, role FROM emr.users WHERE tenant_id = $1 AND role = $2', [tenantId, 'Admin']);
    console.log('\n Admin Users:');
    adminUsers.rows.forEach(user => {
      console.log(`  ${user.email} - ${user.name} (${user.role})`);
    });
    
    // Check sample notifications
    const sampleNotifications = await query('SELECT alert_type, message, severity FROM demo_emr.pharmacy_alerts WHERE tenant_id = $1 LIMIT 3', [tenantId]);
    console.log('\n Sample Notifications:');
    sampleNotifications.rows.forEach(notif => {
      const icon = notif.severity === 'critical' ? ' Critical' : notif.severity === 'high' ? ' High' : notif.severity === 'medium' ? ' Medium' : ' Low';
      console.log(`  [${icon}] ${notif.alert_type}: ${notif.message.substring(0, 60)}...`);
    });
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('URL: http://localhost:5175');
    console.log('Primary Admin:');
    console.log('  Email: admin@demo.hospital');
    console.log('  Password: Demo@123');
    console.log('Alternative Admins:');
    adminUsers.rows.forEach(user => {
      if (user.email !== 'admin@demo.hospital') {
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: Demo@123 (likely)`);
      }
    });
    
    console.log('\n=== STATUS ===');
    const isDataPopulated = patients.rows[0].count > 0 && employees.rows[0].count > 0 && appointments.rows[0].count > 0;
    const hasAdmins = adminUsers.rows.length > 0;
    const hasNotifications = notifications.rows[0].count > 0;
    
    if (isDataPopulated && hasAdmins && hasNotifications) {
      console.log(' Status: READY FOR DEMO');
      console.log(' All systems operational with dynamic notifications!');
    } else {
      console.log(' Status: SETUP INCOMPLETE');
      if (!isDataPopulated) console.log('  Missing data population');
      if (!hasAdmins) console.log('  Missing admin users');
      if (!hasNotifications) console.log('  Missing notifications');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

verifyDemoStatus();
