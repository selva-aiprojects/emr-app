import pool from '../db/connection.js';

async function run() {
  try {
    console.log('🚀 Starting Phase 2 Enterprise Abstractions Migration...');

    // 1. Create Pharmacy Locations Table
    console.log('Creating locations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) DEFAULT 'Main Store',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('Enabling RLS on locations...');
    await pool.query(`ALTER TABLE locations ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`ALTER TABLE locations FORCE ROW LEVEL SECURITY;`);
    await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON locations;`);
    await pool.query(`
      CREATE POLICY tenant_isolation_policy ON locations
      USING (
        tenant_id::varchar = current_setting('app.current_tenant', true)
        OR current_setting('app.bypass_rls', true) = 'true'
      )
    `);

    // Add location_id to pharmacy inventory
    console.log('Adding location_id to pharmacy_inventory...');
    try {
        await pool.query(`ALTER TABLE pharmacy_inventory ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;`);
    } catch(e) {
        console.warn('Note: pharmacy_inventory table might not exist yet, skipping location_id constraint here.', e.message);
    }

    try {
        await pool.query(`ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;`);
    } catch(e) {
        console.warn('Note: inventory_items table might not exist yet.', e.message);
    }

    // 2. Create RBAC Tables
    console.log('Creating roles and role_permissions tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, name)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(role_id, permission)
      );
    `);

    console.log('Enabling RLS on RBAC tables...');
    await pool.query(`ALTER TABLE roles ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`ALTER TABLE roles FORCE ROW LEVEL SECURITY;`);
    await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON roles;`);
    await pool.query(`
      CREATE POLICY tenant_isolation_policy ON roles
      USING (
        tenant_id::varchar = current_setting('app.current_tenant', true)
        OR current_setting('app.bypass_rls', true) = 'true'
        OR is_system = true -- System roles are visible globally
      )
    `);

    await pool.query(`ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;`);
    await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON role_permissions;`);
    await pool.query(`
      CREATE POLICY tenant_isolation_policy ON role_permissions
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
