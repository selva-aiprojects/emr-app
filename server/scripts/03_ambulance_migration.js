import { query } from '../db/connection.js';

const sql = `
  CREATE TABLE IF NOT EXISTS ambulances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL,
    model VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Available',
    lat NUMERIC,
    lng NUMERIC,
    current_driver VARCHAR(100),
    contact_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ambulances FORCE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS tenant_isolation_policy ON ambulances;
  CREATE POLICY tenant_isolation_policy ON ambulances
  USING (
    tenant_id::varchar = current_setting('app.current_tenant', true)
    OR current_setting('app.bypass_rls', true) = 'true'
  );
`;

async function run() {
  try {
    console.log('🚀 Creating Ambulance Table...');
    await query(sql);
    console.log('✅ Ambulance table created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating table:', err);
    process.exit(1);
  }
}

run();
