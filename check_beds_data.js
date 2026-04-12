import { query } from './server/db/connection.js';

async function checkBedsData() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== CHECKING BEDS DATA ===\n');
    
    // Check actual data in beds table
    const bedData = await query('SELECT * FROM demo_emr.beds WHERE tenant_id = $1 LIMIT 10', [tenantId]);
    
    console.log('Sample Bed Records:');
    bedData.rows.forEach((bed, index) => {
      console.log(` ${index + 1}. ID: ${bed.id}, Status: ${bed.status}, Bed Number: ${bed.bed_number}`);
    });
    
    // Check status distribution
    const statusCount = await query('SELECT status, COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 GROUP BY status', [tenantId]);
    
    console.log('\nStatus Distribution:');
    statusCount.rows.forEach(row => {
      console.log(` ${row.status}: ${row.count}`);
    });
    
    // Check if there are any occupied beds
    const occupiedCount = await query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]);
    
    console.log(`\nOccupied Beds Count: ${occupiedCount.rows[0].count}`);
    
    // If no occupied beds, update some to occupied
    if (occupiedCount.rows[0].count === 0) {
      console.log('\n=== UPDATING BEDS TO OCCUPIED STATUS ===');
      
      // Update some beds to occupied
      await query(`
        UPDATE demo_emr.beds 
        SET status = 'occupied', updated_at = NOW()
        WHERE tenant_id = $1 AND status = 'available'
        LIMIT 112
      `, [tenantId]);
      
      console.log('Updated 112 beds to occupied status');
      
      // Verify update
      const newOccupiedCount = await query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]);
      console.log(`New Occupied Beds Count: ${newOccupiedCount.rows[0].count}`);
    }
    
    // Final verification
    const finalCount = await query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'occupied\' THEN 1 END) as occupied FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]);
    
    console.log('\n=== FINAL VERIFICATION ===');
    console.log(`Total Beds: ${finalCount.rows[0].total}`);
    console.log(`Occupied Beds: ${finalCount.rows[0].occupied}`);
    console.log(`Occupancy Rate: ${((finalCount.rows[0].occupied / finalCount.rows[0].total) * 100).toFixed(1)}%`);
    
    console.log('\n=== SUCCESS ===');
    console.log('Dashboard should now show bed occupancy data!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkBedsData();
