
import { query } from './server/db/connection.js';

async function inspectTables() {
  try {
    const tables = await query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'nexus'
    `);
    console.log('Nexus Tables:', tables.rows.map(r => r.table_name));

    const cols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'nexus' AND table_name = 'management_tenants'
    `);
    console.log('management_tenants columns:', cols.rows);
    
    const tenantsCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'nexus' AND table_name = 'tenants'
    `);
    console.log('tenants columns:', tenantsCols.rows);

  } catch (err) {
    console.error('Inspection failed:', err);
  } finally {
    process.exit(0);
  }
}

inspectTables();
