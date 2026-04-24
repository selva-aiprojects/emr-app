import pool from '../db/connection.js';

async function run() {
  try {
    console.log('🚀 Starting Phase 2 Enterprise Abstractions Migration...');

    // 1. Create Pharmacy Locations Table
    console.log('Creating emr.locations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emr.locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES emr.tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) DEFAULT 'Main Store',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('Enabling RLS on emr.locations...');
    await pool.query(`ALTER TABLE emr.locations ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`ALTER TABLE emr.locations FORCE ROW LEVEL SECURITY;`);
    await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON emr.locations;`);
    await pool.query(`
      CREATE POLICY tenant_isolation_policy ON emr.locations
      USING (
        tenant_id::varchar = current_setting('app.current_tenant', true)
        OR current_setting('app.bypass_rls', true) = 'true'
      )
    `);

    // Add location_id to pharmacy inventory
    console.log('Adding location_id to emr.pharmacy_inventory...');
    try {
        await pool.query(`ALTER TABLE emr.pharmacy_inventory ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES emr.locations(id) ON DELETE SET NULL;`);
    } catch(e) {
        console.warn('Note: pharmacy_inventory table might not exist yet, skipping location_id constraint here.', e.message);
    }

    try {
        await pool.query(`ALTER TABLE emr.inventory_items ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES emr.locations(id) ON DELETE SET NULL;`);
    } catch(e) {
        console.warn('Note: inventory_items table might not exist yet.', e.message);
    }

    // 2. Create RBAC Tables
    console.log('Creating emr.roles and emr.role_permissions tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emr.roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES emr.tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, name)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS emr.role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES emr.tenants(id) ON DELETE CASCADE,
        role_id UUID REFERENCES emr.roles(id) ON DELETE CASCADE,
        permission VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(role_id, permission)
      );
    `);

    console.log('Enabling RLS on RBAC tables...');
    await pool.query(`ALTER TABLE emr.roles ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`ALTER TABLE emr.roles FORCE ROW LEVEL SECURITY;`);
    await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON emr.roles;`);
    await pool.query(`
      CREATE POLICY tenant_isolation_policy ON emr.roles
      USING (
        tenant_id::varchar = current_setting('app.current_tenant', true)
        OR current_setting('app.bypass_rls', true) = 'true'
        OR is_system = true -- System roles are visible globally
      )
    `);

    await pool.query(`ALTER TABLE emr.role_permissions ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`ALTER TABLE emr.role_permissions FORCE ROW LEVEL SECURITY;`);
    await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON emr.role_permissions;`);
    await pool.query(`
      CREATE POLICY tenant_isolation_policy ON emr.role_permissions
      USING (
        tenant_id::varchar = current_setting('app.current_tenant', true)
        OR current_setting('app.bypass_rls', true) = 'true'
        OR tenant_id IS NULL -- System permissions are visible globally
      )
    `);

    console.log('✅ Phase 2 Enterprise Schema Migration Complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal Migration Error:', error.message);
    process.exit(1);
  }
}

run();
