import pool from './server/db/connection.js';

async function clean() {
  try {
    const nhglId = '44000000-0000-0000-0000-000000000001';
    
    console.log('--- Cleaning Legacy Identity Strings ---');
    
    // 1. Update appointments
    const appts = await pool.query("UPDATE emr.appointments SET provider_id = $1 WHERE provider_id::text = 'nhgl-admin-id'", [nhglId]);
    console.log(`Updated ${appts.rowCount} appointments.`);

    // 2. Update encounters
    const encounters = await pool.query("UPDATE emr.encounters SET provider_id = $1 WHERE provider_id::text = 'nhgl-admin-id'", [nhglId]);
    console.log(`Updated ${encounters.rowCount} encounters.`);

    // 3. Update audit logs
    const logs = await pool.query("UPDATE emr.audit_logs SET user_id = $1 WHERE user_id::text = 'nhgl-admin-id'", [nhglId]);
    console.log(`Updated ${logs.rowCount} audit logs.`);

    console.log('✅ Identity normalization complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ CLEANUP_ERROR:', err.message);
    process.exit(1);
  }
}
clean();
