import { query } from './db/connection.js';

export async function runAutoMigration() {
  console.log('🚀 [STARTUP] Running Multi-Tenancy Auto-Migration...');
  
  try {
    // 1. Discover all active tenants
    const { rows: tenants } = await query('SELECT id, code FROM emr.tenants WHERE code IS NOT NULL');
    console.log(`🔍 [STARTUP] Discovered ${tenants.length} institutional nodes for infrastructure verification.`);

    // 2. Create Infrastructure Matrix table in Control Plane
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

    // 3. Define Clinical Shard Structure
    const CLINICAL_TABLES = [
      // Healthcare Operations
      'patients', 'appointments', 'frontdesk_visits', 'encounters', 'clinical_records', 'conditions', 
      'observations', 'diagnostic_reports', 'procedures', 'prescriptions', 'service_requests', 

      // Facility Infrastructure
      'wards', 'beds', 'locations', 'departments', 'services', 'ward_stock',

      // Operational Logistics
      'ambulances', 'blood_units', 'blood_requests', 'donors', 'walkins', 
      'support_tickets', 'notices', 'tenant_communications',

      // Financial & Billing
      'invoices', 'invoice_items', 'billing', 'expenses', 'claims', 
      'insurance_providers', 'accounts_receivable', 'accounts_payable',

      // Supply Chain & Pharmacy
      'inventory_items', 'inventory_transactions', 'pharmacy_inventory', 
      'pharmacy_alerts', 'purchase_orders', 'vendors', 'drug_batches', 
      'drug_allergies', 'medication_schedules', 'medication_administrations',
      'patient_medication_allocations',

      // Human Resources & Payroll
      'employees', 'employee_leaves', 'salary_structures', 'payroll_items', 
      'attendance', 'payroll_runs', 'payslips',

      // Communications & Governance
      'chat_threads', 'documents', 'document_access_policies', 'document_audit_logs',
      'notification_templates', 'notification_jobs', 'notification_logs'
    ];

    // 4. Provision & Sync each tenant
    for (const tenant of tenants) {
      const schemaName = tenant.code.toLowerCase();
      console.log(`📦 [STARTUP] Verifying clinical shard for ${tenant.code.toUpperCase()} [Schema: ${schemaName}]`);
      
      // Ensure isolated schema exists
      await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      
      // Mirror foundational structures to shard
      for (const table of CLINICAL_TABLES) {
        try {
          await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.${table} (LIKE emr.${table} INCLUDING ALL)`);
          
          // Atomic Isolation: Move clinical data from emr baseline to isolated shard
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
            console.log(`   - Isolated ${moveRes.rowCount} legacy rows for ${table} in shard: ${schemaName}`);
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
