import { query } from './db/connection.js';
import { join, dirname } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runAutoMigration() {
  console.log('🚀 [STARTUP] Running Multi-Tenancy Auto-Migration...');
  
  try {
    // 1. Discover all active tenants
    const { rows: tenants } = await query('SELECT id, code FROM emr.management_tenants WHERE status = \'active\'');
    console.log(`🔍 [STARTUP] Discovered ${tenants.length} institutional nodes for infrastructure verification.`);

    // 2. Create Infrastructure Matrix table in Control Plane
    await query(`
      CREATE TABLE IF NOT EXISTS emr.tenant_resources (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES emr.management_tenants(id) ON DELETE CASCADE,
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

    // 3. Load Canonical Shard Definition (Tenant Plane Baseline)
    const sqlPath = join(__dirname, '../../config/tenant_plane_provisioning.sql');
    let shardSql = '';
    try {
      shardSql = readFileSync(sqlPath, 'utf8');
    } catch (e) {
      console.error('❌ [STARTUP] Failed to read tenant_base_schema_comprehensive_v2.sql. Shard sync aborted.');
      return;
    }

    const CLINICAL_TABLES = [
      'patients', 'appointments', 'frontdesk_visits', 'encounters', 'clinical_records', 'conditions', 
      'observations', 'diagnostic_reports', 'procedures', 'prescriptions', 'service_requests', 
      'wards', 'beds', 'locations', 'departments', 'services', 'ward_stock',
      'ambulances', 'blood_units', 'blood_requests', 'donors', 'walkins', 
      'support_tickets', 'notices', 'tenant_communications',
      'invoices', 'invoice_items', 'billing', 'expenses', 'claims', 
      'insurance_providers', 'accounts_receivable', 'accounts_payable',
      'inventory_items', 'inventory_transactions', 'pharmacy_inventory', 
      'pharmacy_alerts', 'purchase_orders', 'vendors', 'drug_batches', 
      'drug_allergies', 'medication_schedules', 'medication_administrations',
      'patient_medication_allocations',
      'employees', 'employee_leaves', 'salary_structures', 'payroll_items', 
      'attendance', 'payroll_runs', 'payslips',
      'chat_threads', 'documents', 'document_access_policies', 'document_audit_logs',
      'notification_templates', 'notification_jobs', 'notification_logs'
    ];

    // 4. Provision & Sync each tenant
    for (const tenant of tenants) {
      const schemaName = tenant.code.toLowerCase();
      console.log(`📦 [STARTUP] Verifying clinical shard for ${tenant.code.toUpperCase()} [Schema: ${schemaName}]`);
      
      // Ensure isolated schema exists
      await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      
      // Mirror foundational structures to shard using the canonical baseline
      await query(`SET search_path TO "${schemaName}", public`);
      const statements = shardSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        try {
          await query(stmt);
        } catch (e) {
          // Ignore "already exists" errors during synchronization
          if (!e.message.includes('already exists')) {
            console.warn(`   ⚠️ [SYNC_WARN] ${e.message.substring(0, 100)}`);
          }
        }
      }

      // 5. Atomic Isolation: Move clinical data from emr baseline to isolated shard
      for (const table of CLINICAL_TABLES) {
        try {
          // Check if template exists in emr for data movement
          const { rows: templateCheck } = await query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'emr' AND table_name = $1
            )`, [table]);
          
          if (templateCheck[0]?.exists) {
            const moveRes = await query(`
              WITH deleted AS (
                DELETE FROM emr.${table} 
                WHERE tenant_id = $1 
                RETURNING *
              )
              INSERT INTO "${schemaName}"."${table}" 
              SELECT * FROM deleted 
              ON CONFLICT DO NOTHING
            `, [tenant.id]);
            
            if (moveRes.rowCount > 0) {
              console.log(`   - Isolated ${moveRes.rowCount} legacy rows for ${table} in shard: ${schemaName}`);
            }
          }

          // Auto-repair drifted tenant_ids (If DB resets caused an ID mismatch, this saves the isolated clinical data)
          const repairRes = await query(`
            UPDATE ${schemaName}.${table}
            SET tenant_id = $1
            WHERE tenant_id != $1 OR tenant_id IS NULL
          `, [tenant.id]);
          
          if (repairRes.rowCount > 0) {
            console.log(`   🛠️ Repaired ${repairRes.rowCount} detached rows for ${table} in ${schemaName}`);
          }

        } catch (tableErr) {
          console.warn(`   ⚠️ [STARTUP] Failed to sync table ${table} for ${tenant.code}: ${tableErr.message}`);
        }
      }
    }

    console.log('✅ [STARTUP] Multi-Tenancy dynamic migration complete.');
  } catch (error) {
    console.error('❌ [STARTUP] Migration failed:', error.message);
  }
}
