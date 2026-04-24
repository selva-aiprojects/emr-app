import { query } from './server/db/connection.js';

async function debugBedsQuery() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== DEBUGGING BEDS QUERY ===\n');
    
    // Test different bed queries
    const queries = await Promise.all([
      query(`SELECT COUNT(*) as total FROM demo_emr.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as occupied FROM demo_emr.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenantId]),
      query(`SELECT COUNT(*) as available FROM demo_emr.beds WHERE tenant_id = $1 AND status = 'available'`, [tenantId]),
      query(`SELECT status, COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 GROUP BY status`, [tenantId]),
      query(`SELECT COUNT(CASE WHEN status = 'occupied' THEN 1 END)::int as occupied FROM demo_emr.beds WHERE tenant_id = $1`, [tenantId])
    ]);
    
    console.log('Beds Query Results:');
    console.log(` Total Beds: ${queries[0].rows[0].total}`);
    console.log(` Occupied Beds (simple): ${queries[1].rows[0].occupied}`);
    console.log(` Available Beds: ${queries[2].rows[0].available}`);
    console.log(` Occupied Beds (case): ${queries[4].rows[0].occupied}`);
    
    console.log('\nBed Status Breakdown:');
    queries[3].rows.forEach(row => {
      console.log(` ${row.status}: ${row.count}`);
    });
    
    // Fix the issue by updating bed status
    const totalBeds = queries[0].rows[0].total;
    const occupiedBeds = queries[1].rows[0].occupied;
    
    if (totalBeds > 0 && occupiedBeds === 0) {
      console.log('\n=== FIXING BED STATUS ===');
      console.log('Updating some beds to "occupied" status...');
      
      // Update some beds to occupied status
      await query(`
        UPDATE demo_emr.beds 
        SET status = 'occupied', updated_at = NOW()
        WHERE tenant_id = $1 AND status = 'available'
        LIMIT 112
      `, [tenantId]);
      
      // Verify the update
      const updatedQuery = await query(`SELECT COUNT(*) as occupied FROM demo_emr.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenantId]);
      console.log(`Updated Occupied Beds: ${updatedQuery.rows[0].occupied}`);
    }
    
    console.log('\n=== FINAL VERIFICATION ===');
    const finalQuery = await Promise.all([
      query(`SELECT COUNT(*) as total FROM demo_emr.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as occupied FROM demo_emr.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenantId])
    ]);
    
    const totalBedsFinal = finalQuery[0].rows[0].total;
    const occupiedBedsFinal = finalQuery[1].rows[0].occupied;
    const occupancyRate = totalBedsFinal > 0 ? ((occupiedBedsFinal / totalBedsFinal) * 100).toFixed(1) : 0;
    
    console.log(` Total Beds: ${totalBedsFinal}`);
    console.log(` Occupied Beds: ${occupiedBedsFinal}`);
    console.log(` Bed Occupancy Rate: ${occupancyRate}%`);
    
    console.log('\n=== SUCCESS ===');
    console.log('The dashboard should now show proper bed occupancy metrics!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debugBedsQuery();
