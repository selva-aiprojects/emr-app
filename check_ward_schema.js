import { query } from './server/db/connection.js';

async function checkWardSchema() {
  try {
    console.log('Checking ward schema...');
    
    // Check if wards table exists
    const tableCheck = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'demo_emr' AND table_name = 'wards'
      ORDER BY ordinal_position
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('Wards table does not exist in demo_emr schema');
      
      // Create wards table with correct schema
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.wards (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          floor INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log('Created wards table');
    } else {
      console.log('Wards table columns:');
      tableCheck.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // Check beds table
    const bedsCheck = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'demo_emr' AND table_name = 'beds'
      ORDER BY ordinal_position
    `);
    
    if (bedsCheck.rows.length === 0) {
      console.log('Beds table does not exist in demo_emr schema');
      
      // Create beds table
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.beds (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          ward_id uuid REFERENCES demo_emr.wards(id),
          bed_number VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'available',
          patient_id uuid,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log('Created beds table');
    } else {
      console.log('Beds table columns:');
      bedsCheck.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkWardSchema();
