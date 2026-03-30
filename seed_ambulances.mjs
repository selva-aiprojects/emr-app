import { query } from './server/db/connection.js';

async function seedAmbulances() {
  try {
    console.log('🚑 Seeding ambulance fleet data...');

    // Get New Age Hospital tenant ID
    const tenantResult = await query('SELECT id FROM emr.tenants WHERE name ILIKE $1', ['%New Age%']);
    if (tenantResult.rows.length === 0) {
      console.log('❌ New Age Hospital tenant not found');
      process.exit(1);
    }
    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Found tenant: ${tenantId}`);

    // Clear existing ambulances for this tenant
    await query('DELETE FROM emr.ambulances WHERE tenant_id = $1', [tenantId]);
    console.log('🧹 Cleared existing ambulance data');

    // Insert sample ambulances
    const ambulances = [
      {
        vehicle_number: 'AMB-001',
        model: 'Advanced Life Support',
        status: 'Available',
        current_driver: 'Rahul Sharma',
        contact_number: '+91 98822 10293',
        lat: 18.5204,
        lng: 73.8567
      },
      {
        vehicle_number: 'AMB-002', 
        model: 'Basic Life Support',
        status: 'On Mission',
        current_driver: 'Vikram Kumar',
        contact_number: '+91 98822 44556',
        lat: 18.5304,
        lng: 73.8467
      },
      {
        vehicle_number: 'AMB-003',
        model: 'Patient Transport',
        status: 'maintenance',
        current_driver: null,
        contact_number: null,
        lat: null,
        lng: null
      },
      {
        vehicle_number: 'AMB-004',
        model: 'Advanced Life Support',
        status: 'Available',
        current_driver: 'Priya Deshmukh',
        contact_number: '+91 98822 78901',
        lat: 18.5204,
        lng: 73.8567
      },
      {
        vehicle_number: 'AMB-005',
        model: 'Basic Life Support',
        status: 'Available',
        current_driver: 'Amit Patil',
        contact_number: '+91 98822 34567',
        lat: 18.5204,
        lng: 73.8567
      }
    ];

    for (const ambulance of ambulances) {
      const result = await query(`
        INSERT INTO emr.ambulances (tenant_id, vehicle_number, model, status, current_driver, contact_number, lat, lng)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, vehicle_number, status
      `, [
        tenantId,
        ambulance.vehicle_number,
        ambulance.model,
        ambulance.status,
        ambulance.current_driver,
        ambulance.contact_number,
        ambulance.lat,
        ambulance.lng
      ]);

      console.log(`✅ Created ambulance: ${result.rows[0].vehicle_number} - Status: ${result.rows[0].status}`);
    }

    console.log('🎉 Ambulance fleet seeding completed successfully!');
    
    // Verify the data
    const verifyResult = await query('SELECT COUNT(*) as count FROM emr.ambulances WHERE tenant_id = $1', [tenantId]);
    console.log(`📊 Total ambulances in database: ${verifyResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding ambulances:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

seedAmbulances();
