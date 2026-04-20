import { query } from './server/db/connection.js';

async function verifyMagnumExtensions() {
  try {
    console.log('Verifying MAGNUM schema extensions...');

    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'magnum'
      AND table_name IN ('concessions', 'credit_notes', 'bill_approvals', 'insurance_providers', 'insurance_pre_auth', 'corporate_clients', 'corporate_bills')
      ORDER BY table_name
    `);

    console.log('📋 Tables in MAGNUM schema:');
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    if (tables.rows.length >= 7) {
      console.log('🎉 All billing & insurance extensions successfully applied to MAGNUM!');
    } else {
      console.log('⚠️  Some tables may be missing');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyMagnumExtensions();