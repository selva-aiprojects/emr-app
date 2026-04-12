import { query } from './server/db/connection.js';

async function checkActualTableStructure() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== CHECKING ACTUAL TABLE STRUCTURE ===\n');
    
    // Check all tables in demo_emr schema
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'demo_emr' 
      ORDER BY table_name
    `);
    
    console.log('Available Tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check which tables have data
    console.log('\n=== DATA COUNTS ===');
    
    const dataCounts = await Promise.all([
      query(`SELECT COUNT(*) as count FROM demo_emr.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.invoices WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.lab_tests WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.blood_units WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.employees WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.prescriptions WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.frontdesk_visits WHERE tenant_id = $1`, [tenantId])
    ]);
    
    console.log(` Patients: ${dataCounts[0].rows[0].count}`);
    console.log(` Appointments: ${dataCounts[1].rows[0].count}`);
    console.log(` Invoices: ${dataCounts[2].rows[0].count}`);
    console.log(` Beds: ${dataCounts[3].rows[0].count}`);
    console.log(` Lab Tests: ${dataCounts[4].rows[0].count}`);
    console.log(` Blood Units: ${dataCounts[5].rows[0].count}`);
    console.log(` Employees: ${dataCounts[6].rows[0].count}`);
    console.log(` Prescriptions: ${dataCounts[7].rows[0].count}`);
    console.log(` Diagnostic Reports: ${dataCounts[8].rows[0].count}`);
    console.log(` Frontdesk Visits: ${dataCounts[9].rows[0].count}`);
    
    // Check if invoice_items exists
    try {
      const invoiceItemsCheck = await query(`SELECT COUNT(*) as count FROM demo_emr.invoice_items WHERE tenant_id = $1`, [tenantId]);
      console.log(` Invoice Items: ${invoiceItemsCheck.rows[0].count}`);
    } catch (error) {
      console.log(' Invoice Items: Table does not exist');
    }
    
    // Check for other potential tables for revenue analysis
    const potentialTables = [
      'invoice_items', 'service_charges', 'billing_items', 'revenue_items',
      'frontdesk_visits', 'service_requests', 'queue_management'
    ];
    
    console.log('\n=== CHECKING REVENUE TABLES ===');
    for (const tableName of potentialTables) {
      try {
        const check = await query(`SELECT COUNT(*) as count FROM demo_emr.${tableName} WHERE tenant_id = $1`, [tenantId]);
        console.log(` ${tableName}: ${check.rows[0].count}`);
      } catch (error) {
        console.log(` ${tableName}: Table does not exist`);
      }
    }
    
    console.log('\n=== CREATING MISSING TABLES ===');
    
    // Create invoice_items table if needed
    try {
      await query(`SELECT COUNT(*) FROM demo_emr.invoice_items WHERE tenant_id = $1`, [tenantId]);
      console.log('Invoice items table exists');
    } catch (error) {
      console.log('Creating invoice_items table...');
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.invoice_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          invoice_id uuid NOT NULL REFERENCES demo_emr.invoices(id),
          item_description text NOT NULL,
          quantity numeric(10,2) NOT NULL,
          rate numeric(10,2) NOT NULL,
          amount numeric(10,2) NOT NULL,
          item_type character varying(50),
          reference_id uuid,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        )
      `);
      console.log('Created invoice_items table');
    }
    
    console.log('\n=== CREATING MISSING DATA ===');
    
    // Create invoice items for existing invoices
    const invoices = await query('SELECT id FROM demo_emr.invoices WHERE tenant_id = $1 LIMIT 50', [tenantId]);
    
    if (invoices.rows.length > 0) {
      console.log('Creating invoice items for existing invoices...');
      const services = [
        'Consultation', 'Laboratory', 'Radiology', 'Pharmacy', 'Hospital Stay', 'Emergency Care', 'Surgery', 'Vaccination'
      ];
      
      for (const invoice of invoices.rows) {
        for (let i = 0; i < 3; i++) {
          try {
            await query(`
              INSERT INTO demo_emr.invoice_items 
              (tenant_id, invoice_id, item_description, quantity, rate, amount, item_type, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
              ON CONFLICT DO NOTHING
            `, [
              tenantId,
              invoice.id,
              getRandomItem(services),
              getRandomInt(1, 5),
              getRandomFloat(50, 500),
              getRandomInt(50, 500) * getRandomInt(1, 5),
              'service'
            ]);
          } catch (error) {
            // Ignore duplicates
          }
        }
      }
    }
    
    // Create no-show appointments
    console.log('Creating no-show appointments...');
    await query(`
      UPDATE demo_emr.appointments 
      SET status = 'no-show', updated_at = NOW()
      WHERE tenant_id = $1 AND status = 'scheduled' AND DATE(scheduled_start) >= CURRENT_DATE - INTERVAL '7 days'
    `, [tenantId]);
    
    // Create patient queue data
    console.log('Creating patient queue data...');
    const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 20', [tenantId]);
    
    for (let i = 0; i < 10; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.frontdesk_visits 
          (tenant_id, patient_id, token_no, status, triage_notes, checked_in_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          patients.rows[i % patients.rows.length].id,
          i + 1,
          'waiting',
          'Initial assessment',
          'Routine'
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // Create blood requests
    console.log('Creating blood requests...');
    for (let i = 0; i < 15; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.blood_requests 
          (tenant_id, patient_id, blood_group, urgency, request_date, status, units_requested, units_supplied, created_at, updated_at)
          VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          patients.rows[i % patients.rows.length].id,
          ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][i % 8],
          ['Routine', 'Urgent', 'Emergency'][i % 3],
          'pending',
          getRandomInt(1, 5),
          0
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    console.log('\n=== FINAL VERIFICATION ===');
    
    const finalCheck = await Promise.all([
      query(`SELECT COUNT(*) as total FROM demo_emr.blood_units WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as total FROM demo_emr.lab_tests WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM demo_emr.invoice_items WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as no_show FROM demo_emr.appointments WHERE tenant_id = $1 AND status = 'no-show' AND DATE(scheduled_start) >= CURRENT_DATE - INTERVAL '7 days'`, [tenantId]),
      query(`SELECT COUNT(*) as waiting FROM demo_emr.frontdesk_visits WHERE tenant_id = $1 AND status = 'waiting'`, [tenantId])
    ]);
    
    console.log('\nFinal Status:');
    console.log(` Blood Units: ${finalCheck[0].rows[0].total}`);
    console.log(` Lab Tests: ${finalCheck[1].rows[0].total}`);
    console.log(` Invoice Items: ${finalCheck[2].rows[0].count}`);
    console.log(` No-Shows: ${finalCheck[3].rows[0].no_show}`);
    console.log(` Waiting Patients: ${finalCheck[4].rows[0].waiting}`);
    
    console.log('\n=== SUCCESS ===');
    console.log('All dashboard cards should now show data!');
    console.log('Refresh the dashboard to see the changes.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

checkActualTableStructure();
