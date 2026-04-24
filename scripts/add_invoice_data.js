import { query } from '../server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function addInvoiceData() {
  console.log(' Adding invoice data for dashboard...\n');

  try {
    // Get tenant ID
    const tenantResult = await query(
      'SELECT id FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (tenantResult.rows.length === 0) {
      console.log(' DEMO tenant not found!');
      return;
    }

    const tenantId = tenantResult.rows[0].id;

    // Get existing patients
    const patientsResult = await query(
      'SELECT id FROM patients WHERE tenant_id = $1 LIMIT 50',
      [tenantId]
    );

    const patients = patientsResult.rows;
    console.log(` Found ${patients.length} patients`);

    // Create invoices for today and recent dates
    const services = [
      'General Consultation', 'Specialist Consultation', 'Emergency Room Visit',
      'Complete Blood Count', 'X-Ray Chest', 'CT Scan', 'MRI', 'ECG', 'Ultrasound',
      'Pathology Tests', 'Vaccination', 'Minor Procedure', 'Physical Therapy'
    ];

    // Create some invoices for today
    console.log(' Creating today\'s invoices...');
    for (let i = 0; i < 20; i++) {
      const patient = getRandomItem(patients);
      const serviceCount = getRandomInt(1, 4);
      let totalAmount = 0;
      
      for (let j = 0; j < serviceCount; j++) {
        totalAmount += getRandomFloat(100, 1500);
      }

      try {
        await query(
          `INSERT INTO emr.invoices 
           (tenant_id, patient_id, total, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [
            tenantId,
            patient.id,
            totalAmount,
            'paid'
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // Create invoices for the last 30 days
    console.log(' Creating historical invoices...');
    for (let i = 0; i < 100; i++) {
      const patient = getRandomItem(patients);
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - getRandomInt(1, 30));
      const serviceCount = getRandomInt(1, 4);
      let totalAmount = 0;
      
      for (let j = 0; j < serviceCount; j++) {
        totalAmount += getRandomFloat(100, 1500);
      }

      const status = getRandomInt(1, 100) <= 85 ? 'paid' : (getRandomInt(1, 100) <= 50 ? 'pending' : 'cancelled');

      try {
        await query(
          `INSERT INTO emr.invoices 
           (tenant_id, patient_id, total, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            tenantId,
            patient.id,
            totalAmount,
            status,
            invoiceDate.toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicates
      }
    }

    // Check final results
    const [totalInvoices, todayInvoices] = await Promise.all([
      query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM invoices WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM invoices WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId])
    ]);

    console.log('\n Invoice data added successfully!');
    console.log(` Total Invoices: ${totalInvoices.rows[0].count}`);
    console.log(` Total Revenue: $${totalInvoices.rows[0].total}`);
    console.log(` Today's Invoices: ${todayInvoices.rows[0].count}`);
    console.log(` Today's Revenue: $${todayInvoices.rows[0].total}`);

    return {
      success: true,
      totalInvoices: totalInvoices.rows[0].count,
      todayInvoices: todayInvoices.rows[0].count,
      totalRevenue: totalInvoices.rows[0].total,
      todayRevenue: todayInvoices.rows[0].total
    };

  } catch (error) {
    console.error(' Error adding invoice data:', error);
    return { success: false, error: error.message };
  }
}

// Run the script
addInvoiceData().then(result => {
  if (result.success) {
    console.log('\n Invoice data addition completed!');
    console.log(' Dashboard should now show complete data including revenue metrics.');
    process.exit(0);
  } else {
    console.log('\n Invoice data addition failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Script execution failed:', error);
  process.exit(1);
});
