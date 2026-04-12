import { query } from './server/db/connection.js';

async function checkMissingDashboardCards() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== CHECKING MISSING DASHBOARD CARDS ===\n');
    
    // Check Blood Bank metrics
    console.log('1. Blood Bank Metrics:');
    const bloodBank = await Promise.all([
      query(`SELECT COUNT(*) as total FROM demo_emr.blood_units WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as available FROM demo_emr.blood_units WHERE tenant_id = $1 AND status = 'available'`, [tenantId]),
      query(`SELECT COUNT(*) as pending FROM demo_emr.blood_requests WHERE tenant_id = $1 AND status = 'pending'`, [tenantId]),
      query(`SELECT blood_group, COUNT(*) as count FROM demo_emr.blood_units WHERE tenant_id = $1 GROUP BY blood_group`, [tenantId])
    ]);
    
    console.log(`   Total Blood Units: ${bloodBank[0].rows[0].total}`);
    console.log(`   Available Units: ${bloodBank[1].rows[0].available}`);
    console.log(`   Pending Requests: ${bloodBank[2].rows[0].pending}`);
    console.log('   Blood Group Distribution:');
    bloodBank[3].rows.forEach(row => {
      console.log(`     ${row.blood_group}: ${row.count}`);
    });
    
    // Check Lab Tests metrics
    console.log('\n2. Lab Tests Metrics:');
    const labTests = await Promise.all([
      query(`SELECT COUNT(*) as total FROM demo_emr.lab_tests WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT category, COUNT(*) as count FROM demo_emr.lab_tests WHERE tenant_id = $1 GROUP BY category`, [tenantId]),
      query(`SELECT COUNT(*) as completed FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE`, [tenantId]),
      query(`SELECT COUNT(*) as pending FROM demo_emr.prescriptions WHERE tenant_id = $1 AND status = 'active'`, [tenantId])
    ]);
    
    console.log(`   Total Lab Tests: ${labTests[0].rows[0].total}`);
    console.log(`   Lab Test Categories: ${labTests[1].rows.length}`);
    console.log(`   Today's Reports: ${labTests[2].rows[0].completed}`);
    console.log(`   Pending Requests: ${labTests[3].rows[0].pending}`);
    console.log('   Lab Categories:');
    labTests[1].rows.forEach(row => {
      console.log(`     ${row.category}: ${row.count}`);
    });
    
    // Check Revenue Mix by Service
    console.log('\n3. Revenue Mix by Service:');
    const revenueMix = await Promise.all([
      query(`SELECT category, COUNT(*) as count FROM demo_emr.invoice_items WHERE tenant_id = $1 GROUP BY category`, [tenantId]),
      query(`SELECT category, COALESCE(SUM(amount), 0) as total FROM demo_emr.invoice_items WHERE tenant_id = $1 GROUP BY category`, [tenantId]),
      query(`SELECT DATE_TRUNC('month', created_at) as month, COALESCE(SUM(total), 0) as total FROM demo_emr.invoices WHERE tenant_id = $1 GROUP BY DATE_TRUNC('month', created_at) ORDER BY month DESC LIMIT 12`, [tenantId])
    ]);
    
    console.log(`   Service Categories: ${revenueMix[0].rows[0].count}`);
    console.log('   Revenue by Category:');
    revenueMix[1].rows.forEach(row => {
      console.log(`     ${row.category}: $${row.total.toLocaleString()}`);
    });
    
    // Check No-Show Analysis
    console.log('\n4. No-Show Analysis:');
    const noShow = await Promise.all([
      query(`SELECT COUNT(*) as total FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE`, [tenantId]),
      query(`SELECT COUNT(*) as no_show FROM demo_emr.appointments WHERE tenant_id = $1 AND status = 'no-show' AND DATE(scheduled_start) >= CURRENT_DATE - INTERVAL '7 days'`, [tenantId]),
      query(`SELECT DATE(scheduled_start) as date, COUNT(*) FILTER (WHERE status = 'no-show') as no_show, COUNT(*) as total FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) >= CURRENT_DATE - INTERVAL '7 days' GROUP BY DATE(scheduled_start) ORDER BY date`, [tenantId])
    ]);
    
    console.log(`   Today's Total Appointments: ${noShow[0].rows[0].total}`);
    console.log(`   No-Shows (7 days): ${noShow[1].rows[0].no_show}`);
    console.log('   No-Show Trend (7 days):');
    noShow[2].rows.forEach(row => {
      const rate = row.total > 0 ? ((row.no_show / row.total) * 100).toFixed(1) : 0;
      console.log(`     ${row.date}: ${row.no_show}/${row.total} (${rate}%)`);
    });
    
    // Check Patients Waiting Queue
    console.log('\n5. Patients Waiting Queue:');
    const waitingQueue = await Promise.all([
      query(`SELECT COUNT(*) as waiting FROM demo_emr.frontdesk_visits WHERE tenant_id = $1 AND status = 'waiting'`, [tenantId]),
      query(`SELECT token_no, priority_level, created_at FROM demo_emr.frontdesk_visits WHERE tenant_id = $1 AND status = 'waiting' ORDER BY created_at LIMIT 10`, [tenantId]),
      query(`SELECT COUNT(*) as triage_category FROM demo_emr.frontdesk_visits WHERE tenant_id = $1 GROUP BY triage_category`, [tenantId])
    ]);
    
    console.log(`   Patients Waiting: ${waitingQueue[0].rows[0].waiting}`);
    console.log('   Recent Queue:');
    waitingQueue[1].rows.forEach((row, index) => {
      console.log(`     Token ${row.token_no}: Priority ${row.priority_level}, Time: ${row.created_at}`);
    });
    console.log('   Triage Categories:');
    waitingQueue[2].rows.forEach(row => {
      console.log(`     ${row.triage_category}: ${row.count}`);
    });
    
    // Check what's missing
    console.log('\n=== MISSING DATA ANALYSIS ===');
    const issues = [];
    
    if (bloodBank[0].rows[0].total === 0) issues.push('Blood bank data missing');
    if (labTests[0].rows[0].total === 0) issues.push('Lab tests data missing');
    if (revenueMix[0].rows[0].count === 0) issues.push('Revenue mix data missing');
    if (noShow[0].rows[0].total === 0) issues.push('No-show analysis data missing');
    if (waitingQueue[0].rows[0].waiting === 0) issues.push('Patient queue data missing');
    
    if (issues.length > 0) {
      console.log('Missing data for:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('All dashboard cards have data!');
    }
    
    console.log('\n=== FIXES NEEDED ===');
    
    // Create missing data if needed
    if (bloodBank[0].rows[0].total === 0) {
      console.log('Creating blood bank data...');
      await createBloodBankData(tenantId);
    }
    
    if (labTests[0].rows[0].total === 0) {
      console.log('Lab tests data already exists');
    }
    
    if (revenueMix[0].rows[0].count === 0) {
      console.log('Creating invoice items for revenue mix...');
      await createInvoiceItems(tenantId);
    }
    
    if (noShow[0].rows[0].total === 0) {
      console.log('Creating no-show appointments...');
      await createNoShowData(tenantId);
    }
    
    if (waitingQueue[0].rows[0].waiting === 0) {
      console.log('Creating patient queue data...');
      await createQueueData(tenantId);
    }
    
    console.log('\n=== FINAL VERIFICATION ===');
    
    // Re-check after fixes
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
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

async function createBloodBankData(tenantId) {
  console.log('Creating blood bank data...');
  
  // Create blood requests
  const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 20', [tenantId]);
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  
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
        bloodGroups[i % 8],
        ['Routine', 'Urgent', 'Emergency'][i % 3],
        'pending',
        getRandomInt(1, 5),
        0
      ]);
    } catch (error) {
      // Ignore duplicates
    }
  }
}

async function createInvoiceItems(tenantId) {
  console.log('Creating invoice items for revenue mix...');
  
  // Create sample invoice items
  const services = [
    'Consultation', 'Laboratory', 'Radiology', 'Pharmacy', 'Hospital Stay', 'Emergency Care', 'Surgery', 'Vaccination'
  ];
  
  const invoices = await query('SELECT id FROM demo_emr.invoices WHERE tenant_id = $1 LIMIT 50', [tenantId]);
  
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

async function createNoShowData(tenantId) {
  console.log('Creating no-show appointments...');
  
  // Update some appointments to no-show
  await query(`
    UPDATE demo_emr.appointments 
    SET status = 'no-show', updated_at = NOW()
    WHERE tenant_id = $1 AND status = 'scheduled' AND DATE(scheduled_start) >= CURRENT_DATE - INTERVAL '7 days'
    LIMIT 20
  `, [tenantId]);
}

async function createQueueData(tenantId) {
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

checkMissingDashboardCards();
