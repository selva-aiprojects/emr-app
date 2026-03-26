import pool from '../db/connection.js';

async function run() {
  console.log('Starting RLS Migration script...');
  
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND column_name = 'tenant_id'
    `);
    
    const tables = result.rows.map(r => r.table_name);
    console.log('Found tables with tenant_id:', tables);

    const exclude = ['users', 'tenants', 'tenant_features', 'tenant_feature_status'];
    
    for (const table of tables) {
      if (exclude.includes(table)) {
          console.log('⏭️ Skipping excluded table: ' + table);
          continue;
      }
      
      console.log(`🔒 Enabling RLS on emr.${table}...`);
      try {
          await pool.query(`ALTER TABLE emr.${table} ENABLE ROW LEVEL SECURITY;`);
          await pool.query(`ALTER TABLE emr.${table} FORCE ROW LEVEL SECURITY;`);
          
          await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON emr.${table};`);
          
          await pool.query(`
            CREATE POLICY tenant_isolation_policy ON emr.${table}
            AS PERMISSIVE
            FOR ALL
            USING (
              tenant_id::varchar = current_setting('app.current_tenant', true)
              OR current_setting('app.bypass_rls', true) = 'true'
            )
          `);
          console.log(`✅ RLS Policy created for emr.${table}`);
      } catch (e) {
          console.error(`❌ Error on ${table}:`, e.message);
      }
    }
    console.log('Migration complete.');
  } catch (error) {
    console.error('Fatal Migration Error:', error.message);
  } finally {
    process.exit(0);
  }
}

run();
