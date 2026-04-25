import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function standardize() {
  console.log('🚀 [STANDARD_CLEANUP] Starting Nexus Schema Standardization...');
  
  const client = await pool.connect();
  try {

    // 1. Move management tables from public to nexus if they exist there
    const mgmtTables = [
      'management_subscriptions', 'management_tenants', 'tenants', 
      'management_tenant_metrics', 'management_dashboard_summary', 
      'management_system_logs', 'support_tickets', 'management_offers',
      'mrn_sequences', 'invoice_sequences', 'audit_logs'
    ];

    for (const tbl of mgmtTables) {
      const checkRes = await client.query(`
        SELECT table_schema FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [tbl]);

      if (checkRes.rowCount > 0) {
        console.log(`📦 Moving ${tbl} from public to nexus...`);
        // Drop constraints first to avoid issues during move
        // Actually, ALTER TABLE SET SCHEMA is cleaner but might fail on FKs.
        // We'll try SET SCHEMA.
        try {
          await client.query(`ALTER TABLE public."${tbl}" SET SCHEMA nexus`);
          console.log(`✅ Moved ${tbl} to nexus.`);
        } catch (e) {
          console.warn(`⚠️ Failed to move ${tbl} via SET SCHEMA: ${e.message}`);
          // Fallback: move data if nexus table exists
          const nexusCheck = await client.query(`
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = $1 AND table_schema = 'nexus'
          `, [tbl]);
          if (nexusCheck.rowCount > 0) {
             console.log(`  Trying data sync for ${tbl}...`);
             await client.query(`INSERT INTO nexus."${tbl}" SELECT * FROM public."${tbl}" ON CONFLICT DO NOTHING`);
             await client.query(`DROP TABLE public."${tbl}" CASCADE`);
          }
        }
      }
    }

    // 1.1 REPAIR STRUCTURE (Ensure PKs and Types)
    console.log('🛠️ Repairing table structures...');
    
    // Ensure core utility function exists in nexus
    await client.query(`
      CREATE OR REPLACE FUNCTION nexus.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // First, DROP FKs that might be locking types
    const unlockQueries = [
      'ALTER TABLE nexus.management_system_logs DROP CONSTRAINT IF EXISTS management_system_logs_tenant_id_fkey',
      'ALTER TABLE nexus.management_tenant_metrics DROP CONSTRAINT IF EXISTS management_tenant_metrics_tenant_id_fkey',
      'ALTER TABLE nexus.tenant_features DROP CONSTRAINT IF EXISTS tenant_features_tenant_id_fkey',
      'ALTER TABLE nexus.management_tenants DROP CONSTRAINT IF EXISTS management_tenants_pkey CASCADE',
      'ALTER TABLE nexus.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE',
      'ALTER TABLE nexus.roles DROP CONSTRAINT IF EXISTS roles_pkey CASCADE'
    ];
    for (const q of unlockQueries) {
      try { await client.query(q); } catch (e) {}
    }

    const repairs = [
      {
        msg: 'Hard-Restoring nexus.roles...',
        query: `
          DROP TABLE IF EXISTS nexus.roles CASCADE;
          CREATE TABLE nexus.roles (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            is_system BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        msg: 'Hard-Restoring nexus.users...',
        query: `
          DROP TABLE IF EXISTS nexus.users CASCADE;
          CREATE TABLE nexus.users (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            role_id VARCHAR(255) REFERENCES nexus.roles(id),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        msg: 'Ensuring nexus.tenants exists...',
        query: `CREATE TABLE IF NOT EXISTS nexus.tenants (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(64) UNIQUE,
          subdomain TEXT UNIQUE,
          subscription_tier VARCHAR(50) DEFAULT 'Basic',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      {
        msg: 'Fixing ID types for management tables...',
        query: 'ALTER TABLE nexus.management_tenants ALTER COLUMN id SET DATA TYPE VARCHAR(255)'
      },
      {
        msg: 'Ensuring subscription_tier exists in management_tenants...',
        query: 'ALTER TABLE nexus.management_tenants ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT \'Basic\''
      },
      {
        msg: 'Syncing management_tenants to tenants...',
        query: 'INSERT INTO nexus.tenants (id, name, code, subscription_tier) SELECT id, name, name, COALESCE(subscription_tier, \'Basic\') FROM nexus.management_tenants ON CONFLICT DO NOTHING'
      },
      {
        msg: 'Repairing management_tenants PK...',
        query: 'ALTER TABLE nexus.management_tenants ADD PRIMARY KEY (id)'
      }
    ];

    for (const r of repairs) {
      try {
        console.log(`  - ${r.msg}`);
        await client.query(r.query);
      } catch (err) {
        console.warn(`    ⚠️ Repair Step Failed: ${err.message}`);
      }
    }

    // VERIFICATION STEP: Ensure tables actually exist in nexus
    const verifyRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'nexus' AND table_name IN ('users', 'roles', 'tenants')
    `);
    const found = verifyRes.rows.map(r => r.table_name);
    console.log('📊 Verified Tables in Nexus:', found);
    
    if (!found.includes('users') || !found.includes('roles')) {
      throw new Error(`CRITICAL_RESTORATION_FAILURE: Identity tables missing from nexus after repair! Found: ${found.join(', ')}`);
    }

    // 1.2 Aggressive Type Sync for FKs
    console.log('🔗 Synchronizing Master Plane foreign keys...');
    const fkFixes = [
      'ALTER TABLE nexus.management_tenants ALTER COLUMN id SET DATA TYPE VARCHAR(255)',
      'ALTER TABLE nexus.tenants ALTER COLUMN id SET DATA TYPE VARCHAR(255)',
      'ALTER TABLE nexus.management_system_logs ALTER COLUMN tenant_id SET DATA TYPE VARCHAR(255)',
      'DROP TABLE IF EXISTS nexus.support_tickets CASCADE'
    ];
    for (const q of fkFixes) {
      try { await client.query(q); } catch (e) {
        console.warn(`    ⚠️ FK Sync Detail: ${e.message}`);
      }
    }

    // 2. Remove misplaced clinical tables from nexus (they belong in shards)
    // 2. Remove misplaced clinical tables from nexus (they belong in shards)
    console.log('🧹 Cleaning Master Plane pollution...');
    const clinicalTables = [
      'patients', 'encounters', 'vitals', 'clinical_records', 'observations',
      'diagnostic_reports', 'prescriptions', 'procedures', 'notices',
      'ward_stock', 'donors', 'walkins', 'tenant_communications', 'expenses',
      'claims', 'insurance_providers', 'accounts_receivable', 'accounts_payable',
      'inventory_transactions', 'vendors', 'pharmacy_inventory', 'pharmacy_alerts',
      'purchase_orders', 'drug_batches', 'drug_allergies', 'medication_schedules',
      'medication_administrations', 'patient_medication_allocations',
      'employee_leaves', 'salary_structures', 'payroll_items', 'attendance',
      'payroll_runs', 'payslips', 'document_access_policies', 'notification_templates',
      'notification_jobs', 'notification_logs', 'roles', 'users', 'conditions',
      'blood_units', 'ambulances', 'documents', 'document_audit_logs', 'communication_templates',
      'exotel_sms_campaigns'
    ];


    for (const tbl of clinicalTables) {
      if (tbl === 'users' || tbl === 'roles') {
         // Special handling for identity tables - prune clinical data but keep the table
         console.log(`🧹 Pruning clinical data from nexus.${tbl}...`);
         try {
           if (tbl === 'users') {
             await client.query(`DELETE FROM nexus.users WHERE tenant_id IS NOT NULL`);
           } else {
             await client.query(`DELETE FROM nexus.roles WHERE is_system = false`);
           }
         } catch (e) {
           console.warn(`    ⚠️ Pruning nexus.${tbl} failed: ${e.message}`);
         }
         continue;
      }

      const checkRes = await client.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'nexus'
      `, [tbl]);
      
      if (checkRes.rowCount > 0) {
         console.log(`🗑️ Removing clinical table ${tbl} from nexus (misplaced Master Plane table)...`);
         await client.query(`DROP TABLE nexus."${tbl}" CASCADE`);
      }
    }

    // 3. Ensure critical extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 4. Seed Default Roles
    console.log('🌱 Seeding default system roles...');
    const defaultRoles = [
      ['Superadmin', 'Platform Super Administrator', true],
      ['Admin', 'Institutional Administrator', true],
      ['Doctor', 'Clinical Practitioner', true],
      ['Nurse', 'Nursing Staff', true],
      ['Lab', 'Laboratory Technician', true],
      ['Pharmacy', 'Pharmacist', true]
    ];
    for (const [name, desc, isSys] of defaultRoles) {
      await client.query(`
        INSERT INTO nexus.roles (id, name, description, is_system)
        VALUES ($1, $1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      `, [name, desc, isSys]);
    }

    // 5. Mark Baseline as Done to prevent connection.js from running legacy baseline
    console.log('📝 Marking Master Plane Baseline as completed...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS nexus.migrations_log (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query(`
      INSERT INTO nexus.migrations_log (filename) 
      VALUES ('baseline/nexus_master') 
      ON CONFLICT (filename) DO NOTHING
    `);


    console.log('✅ [STANDARD_CLEANUP] Success.');

  } catch (err) {
    console.error('❌ [STANDARD_CLEANUP] Failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

standardize();
