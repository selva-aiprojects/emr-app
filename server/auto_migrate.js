import { query } from './db/connection.js';

export async function runAutoMigration() {
  console.log('🚀 [STARTUP] Running Multi-Tenancy Auto-Migration...');
  
  const toKeep = [
    { id: 'f998a8f5-95b9-4fd7-a583-63cf574d65ed', code: 'nah' },
    { id: '45cfe286-5469-457a-88b3-e998f4cdc7c6', code: 'ehs' }
  ];

  try {
    // 1. Create Resource Monitor table in Control Plane
    await query(`
      CREATE TABLE IF NOT EXISTS emr.tenant_resources (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
          cpu_cores_limit DECIMAL(4,2) DEFAULT 1.0,
          ram_gb_limit INTEGER DEFAULT 2,
          storage_gb_limit INTEGER DEFAULT 10,
          scaling_tier TEXT DEFAULT 'Auto-Scale',
          peak_demand_threshold INTEGER DEFAULT 80,
          current_status TEXT DEFAULT 'Healthy',
          last_resource_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(tenant_id)
      );
    `);
    console.log('✅ [STARTUP] Infrastructure table verified.');

    // 2. Cleanup redundant tenants
    const keepIds = toKeep.map(t => t.id);
    const deleteRes = await query('DELETE FROM emr.tenants WHERE id NOT IN ($1, $2)', keepIds);
    if (deleteRes.rowCount > 0) {
      console.log(`✅ [STARTUP] Removed ${deleteRes.rowCount} redundant tenants.`);
    }

    // 3. Process the two target tenants
    const CLINICAL_TABLES = [
      'clinical_records', 'prescriptions', 'procedures', 'observations', 
      'diagnostic_reports', 'conditions', 'service_requests', 'frontdesk_visits', 
      'claims', 'documents', 'blood_requests', 'invoices', 
      'appointments', 'encounters', 'patients', 'inventory_items', 
      'salary_structures', 'payroll_items', 'attendance', 'payroll_runs', 
      'employees', 'departments', 'services'
    ];

    for (const tenant of toKeep) {
      const schemaName = tenant.code.toLowerCase();
      console.log(`📦 [STARTUP] Provisioning schema for ${tenant.code}: ${schemaName}...`);
      
      // Create schema
      await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      
      // Migrate each clinical table
      for (const table of CLINICAL_TABLES) {
        // Create table in tenant schema if not exists (clone from emr)
        await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.${table} (LIKE emr.${table} INCLUDING ALL)`);
        
        // Move data from emr to tenant schema
        const moveRes = await query(`
          WITH deleted AS (
            DELETE FROM emr.${table} 
            WHERE tenant_id = $1 
            RETURNING *
          )
          INSERT INTO ${schemaName}.${table} 
          SELECT * FROM deleted 
          ON CONFLICT DO NOTHING
        `, [tenant.id]);
        
        if (moveRes.rowCount > 0) {
          console.log(`   - Migrated ${moveRes.rowCount} rows for ${table}`);
        }
      }
    }

    console.log('✅ [STARTUP] Multi-Tenancy migration complete.');
  } catch (error) {
    console.error('❌ [STARTUP] Migration failed:', error.message);
  }
}
