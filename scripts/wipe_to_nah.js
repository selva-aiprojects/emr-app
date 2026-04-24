import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function wipeExceptNAH() {
  console.log('🧹 Purging all non-NAH data...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Identify NAH tenant ID
    const nahResult = await client.query('SELECT id FROM emr.tenants WHERE code = $1', ['NAH']);
    const nahId = nahResult.rows[0]?.id;

    console.log('✅ Identified NAH Tenant ID:', nahId || 'NONE');

    // 2. Clean up child records for all OTHER tenants first (due to missing cascades in some tables)
    // Identify all other tenant IDs
    const otherTenantsRes = await client.query('SELECT id FROM emr.tenants WHERE code != $1 OR code IS NULL', ['NAH']);
    const otherIds = otherTenantsRes.rows.map(r => r.id);

    if (otherIds.length > 0) {
       console.log(`🗑️ Cleaning up metrics and pharmacy data for ${otherIds.length} other nodes...`);
       
       for (const oid of otherIds) {
          console.log(`  Cleaning tenant node: ${oid}`);
          // Deep clean pharmacy/clinical child records
          await client.query('DELETE FROM emr.prescription_items WHERE prescription_id IN (SELECT id FROM emr.prescriptions WHERE tenant_id = $1)', [oid]);
          await client.query('DELETE FROM emr.drug_batches WHERE drug_id IN (SELECT drug_id FROM emr.drug_master WHERE tenant_id = $1)', [oid]);
          await client.query('DELETE FROM emr.prescriptions WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.drug_master WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.pharmacy_inventory WHERE tenant_id = $1', [oid]);
          
          // Deep clean encounters & appointments (references users/patients)
          await client.query('DELETE FROM emr.encounters WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.appointments WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.walkins WHERE tenant_id = $1', [oid]);
          
          // Clean financial/admin
          await client.query('DELETE FROM emr.invoice_items WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.invoices WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.attendance WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.employees WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.audit_logs WHERE tenant_id = $1', [oid]);
          
          // Base records
          await client.query('DELETE FROM emr.users WHERE tenant_id = $1', [oid]);
          await client.query('DELETE FROM emr.patients WHERE tenant_id = $1', [oid]);
       }

       // 3. Finally delete the tenants
       const deleteResult = await client.query('DELETE FROM emr.tenants WHERE code != $1', ['NAH']);
       console.log(`✨ Removed ${deleteResult.rowCount} tenant nodes.`);
    }

    // 3. Manually clean any tables that might NOT have cascades or are global
    // But we want to keep the Superadmin!
    await client.query('DELETE FROM emr.audit_logs WHERE tenant_id IS NOT NULL AND tenant_id != $1', [nahId || '00000000-0000-0000-0000-000000000000']);
    
    // Note: The Superadmin has tenant_id NULL, so they will be preserved.
    
    await client.query('COMMIT');
    console.log('✨ Environment Purged Successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Wipe failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

wipeExceptNAH();
