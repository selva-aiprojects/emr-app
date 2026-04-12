import { query } from './server/db/connection.js';

async function checkDemoTables() {
  try {
    console.log('=== CHECKING DEMO_EMR SCHEMA TABLES ===\n');
    
    // Get all tables in demo_emr schema
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'demo_emr'
      ORDER BY table_name
    `);
    
    console.log('Tables currently in demo_emr schema:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log(`\nTotal tables: ${tables.rows.length}`);
    
    // Check for critical missing tables
    const requiredTables = [
      'patients', 'appointments', 'employees', 'invoices', 'expenses',
      'wards', 'beds', 'admissions', 'discharges',
      'lab_tests', 'diagnostic_reports',
      'inventory_items', 'prescriptions',
      'ambulances', 'blood_units', 'blood_requests',
      'attendance', 'pharmacy_alerts'
    ];
    
    const existingTables = tables.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\n❌ MISSING CRITICAL TABLES:');
      missingTables.forEach(table => console.log(`  - ${table}`));
      
      console.log('\n=== CREATING MISSING TABLES ===');
      
      // Create missing tables one by one
      for (const tableName of missingTables) {
        try {
          if (tableName === 'lab_tests') {
            await query(`
              CREATE TABLE IF NOT EXISTS demo_emr.lab_tests (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id uuid NOT NULL,
                test_name text NOT NULL,
                category character varying(50) NOT NULL,
                normal_range text,
                price numeric(10,2),
                sample_type character varying(50),
                preparation_instructions text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
              )
            `);
            console.log('✅ Created lab_tests table');
          }
          
          if (tableName === 'discharges') {
            await query(`
              CREATE TABLE IF NOT EXISTS demo_emr.discharges (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id uuid NOT NULL,
                patient_id uuid NOT NULL,
                encounter_id uuid,
                admission_id uuid,
                discharge_date date NOT NULL,
                discharge_type character varying(50) NOT NULL,
                final_diagnosis text,
                outcome character varying(50),
                notes text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
              )
            `);
            console.log('✅ Created discharges table');
          }
          
          if (tableName === 'blood_units') {
            await query(`
              CREATE TABLE IF NOT EXISTS demo_emr.blood_units (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id uuid NOT NULL,
                donor_id uuid,
                blood_group character varying(8) NOT NULL,
                collection_date date NOT NULL,
                expiry_date date NOT NULL,
                status character varying(20) NOT NULL,
                storage_location text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
              )
            `);
            console.log('✅ Created blood_units table');
          }
          
          if (tableName === 'blood_requests') {
            await query(`
              CREATE TABLE IF NOT EXISTS demo_emr.blood_requests (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id uuid NOT NULL,
                patient_id uuid NOT NULL,
                blood_group character varying(8) NOT NULL,
                urgency character varying(20) NOT NULL,
                request_date date NOT NULL,
                status character varying(20) NOT NULL,
                units_requested integer,
                units_supplied integer,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
              )
            `);
            console.log('✅ Created blood_requests table');
          }
          
          if (tableName === 'attendance') {
            await query(`
              CREATE TABLE IF NOT EXISTS demo_emr.attendance (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id uuid NOT NULL,
                employee_id uuid NOT NULL,
                date date NOT NULL,
                check_in timestamp with time zone,
                check_out timestamp with time zone,
                status character varying(20) NOT NULL,
                notes text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
              )
            `);
            console.log('✅ Created attendance table');
          }
          
        } catch (error) {
          console.log(`❌ Error creating ${tableName}: ${error.message}`);
        }
      }
      
    } else {
      console.log('\n✅ All critical tables exist!');
    }
    
    // Check data counts
    console.log('\n=== DATA COUNTS ===');
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    try {
      const counts = await Promise.all([
        query('SELECT COUNT(*) as count FROM demo_emr.patients WHERE tenant_id = $1', [tenantId]),
        query('SELECT COUNT(*) as count FROM demo_emr.employees WHERE tenant_id = $1', [tenantId]),
        query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1', [tenantId]),
        query('SELECT COUNT(*) as count FROM demo_emr.invoices WHERE tenant_id = $1', [tenantId]),
        query('SELECT COUNT(*) as count FROM demo_emr.wards WHERE tenant_id = $1', [tenantId]),
        query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]),
        query('SELECT COUNT(*) as count FROM demo_emr.lab_tests WHERE tenant_id = $1', [tenantId]),
        query('SELECT COUNT(*) as count FROM demo_emr.blood_units WHERE tenant_id = $1', [tenantId]),
        query('SELECT COUNT(*) as count FROM demo_emr.attendance WHERE tenant_id = $1 AND date = CURRENT_DATE', [tenantId])
      ]);
      
      console.log(` Patients: ${counts[0].rows[0].count}`);
      console.log(` Employees: ${counts[1].rows[0].count}`);
      console.log(` Appointments: ${counts[2].rows[0].count}`);
      console.log(` Invoices: ${counts[3].rows[0].count}`);
      console.log(` Wards: ${counts[4].rows[0].count}`);
      console.log(` Beds: ${counts[5].rows[0].count}`);
      console.log(` Lab Tests: ${counts[6].rows[0].count}`);
      console.log(` Blood Units: ${counts[7].rows[0].count}`);
      console.log(` Today's Attendance: ${counts[8].rows[0].count}`);
      
    } catch (error) {
      console.log('Error checking data counts:', error.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkDemoTables();
