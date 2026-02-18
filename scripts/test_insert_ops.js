import { query } from '../server/db/connection.js';

async function testInsert() {
    try {
        console.log('Testing Operations user insert...');
        await query(`
      INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
      VALUES (
        (SELECT id FROM emr.tenants WHERE code='EHS'), 
        'test_ops@ehs.local', 
        'hash', 
        'Test Ops', 
        'Operations', 
        true
      )
    `);
        console.log('Insert successful!');
        // Clean up
        await query("DELETE FROM emr.users WHERE email='test_ops@ehs.local'");
    } catch (err) {
        console.error('Insert failed:', err.message);
    } finally {
        process.exit();
    }
}

testInsert();
