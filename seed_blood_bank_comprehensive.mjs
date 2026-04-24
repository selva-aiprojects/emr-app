// Comprehensive Blood Bank Module Seed Script
// Creates realistic blood units, requests, and inventory for dashboard validation

import { query } from '../server/db/connection.js';

const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'; // New Age Hospital

// Blood types and their distribution
const bloodTypes = [
  { type: 'A+', percentage: 35.7, rh: 'Positive' },
  { type: 'A-', percentage: 6.3, rh: 'Negative' },
  { type: 'B+', percentage: 8.5, rh: 'Positive' },
  { type: 'B-', percentage: 1.5, rh: 'Negative' },
  { type: 'AB+', percentage: 3.4, rh: 'Positive' },
  { type: 'AB-', percentage: 0.6, rh: 'Negative' },
  { type: 'O+', percentage: 37.4, rh: 'Positive' },
  { type: 'O-', percentage: 6.6, rh: 'Negative' }
];

// Blood components
const bloodComponents = [
  { name: 'whole_blood', displayName: 'Whole Blood', volume: 450, shelfLife: 35 },
  { name: 'rbc', displayName: 'Packed RBC', volume: 300, shelfLife: 42 },
  { name: 'plasma', displayName: 'Fresh Frozen Plasma', volume: 250, shelfLife: 365 },
  { name: 'platelets', displayName: 'Platelet Concentrate', volume: 50, shelfLife: 5 },
  { name: 'cryoprecipitate', displayName: 'Cryoprecipitate', volume: 15, shelfLife: 365 }
];

// Donors data
const donors = [
  { id: 'donor-001', name: 'Rahul Sharma', age: 28, bloodType: 'O+', weight: 75, hemoglobin: 14.5 },
  { id: 'donor-002', name: 'Priya Patel', age: 24, bloodType: 'A+', weight: 62, hemoglobin: 13.2 },
  { id: 'donor-003', name: 'Amit Kumar', age: 32, bloodType: 'B+', weight: 80, hemoglobin: 15.1 },
  { id: 'donor-004', name: 'Sunita Reddy', age: 29, bloodType: 'AB+', weight: 58, hemoglobin: 12.8 },
  { id: 'donor-005', name: 'Vikram Singh', age: 35, bloodType: 'O-', weight: 72, hemoglobin: 14.2 },
  { id: 'donor-006', name: 'Anjali Gupta', age: 26, bloodType: 'A-', weight: 55, hemoglobin: 13.5 },
  { id: 'donor-007', name: 'Sanjay Verma', age: 31, bloodType: 'B-', weight: 78, hemoglobin: 14.8 },
  { id: 'donor-008', name: 'Meera Joshi', age: 27, bloodType: 'O+', weight: 60, hemoglobin: 13.8 },
  { id: 'donor-009', name: 'Rajesh Kumar', age: 33, bloodType: 'AB-', weight: 70, hemoglobin: 14.0 },
  { id: 'donor-010', name: 'Deepa Nair', age: 25, bloodType: 'A+', weight: 56, hemoglobin: 12.9 }
];

// Request departments and urgency levels
const departments = ['Emergency', 'Surgery', 'ICU', 'Obstetrics', 'Oncology', 'Pediatrics', 'Cardiology'];
const urgencyLevels = ['routine', 'urgent', 'emergency'];

// Generate blood units
async function seedBloodUnits() {
  console.log('🩸 Seeding Blood Units...');
  
  let unitCounter = 1;
  
  for (const bloodType of bloodTypes) {
    const unitsPerType = Math.floor(15 + Math.random() * 20); // 15-35 units per blood type
    
    for (let i = 0; i < unitsPerType; i++) {
      const donor = donors[Math.floor(Math.random() * donors.length)];
      const component = bloodComponents[Math.floor(Math.random() * bloodComponents.length)];
      
      // Generate collection date (last 30 days)
      const daysAgo = Math.floor(Math.random() * 30);
      const collectedAt = new Date();
      collectedAt.setDate(collectedAt.getDate() - daysAgo);
      
      // Calculate expiry date based on component
      const expiryDate = new Date(collectedAt);
      expiryDate.setDate(expiryDate.getDate() + component.shelfLife);
      
      // Generate batch number
      const batchNumber = `BB${new Date().getFullYear()}${String(unitCounter).padStart(4, '0')}`;
      
      // Determine status based on expiry
      const today = new Date();
      let status = 'available';
      if (expiryDate < today) {
        status = 'expired';
      } else if (expiryDate < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        status = 'expiring_soon';
      } else if (Math.random() < 0.15) {
        status = 'reserved';
      } else if (Math.random() < 0.05) {
        status = 'issued';
      }
      
      const unitQuery = `
        INSERT INTO emr.blood_units (
          tenant_id, unit_number, blood_type, rh_factor, component, 
          volume_ml, batch_number, donor_id, donor_name, donor_age,
          collection_date, expiry_date, status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      `;
      
      await query(unitQuery, [
        tenantId,
        `BU${String(unitCounter).padStart(6, '0')}`,
        bloodType.type,
        bloodType.rh,
        component.name,
        component.volume,
        batchNumber,
        donor.id,
        donor.name,
        donor.age,
        collectedAt,
        expiryDate,
        status,
        'admin-user-id'
      ]);
      
      unitCounter++;
    }
  }
  
  console.log('✅ Blood Units Seeded Successfully');
}

// Generate blood requests
async function seedBloodRequests() {
  console.log('📋 Seeding Blood Requests...');
  
  let requestCounter = 1;
  
  for (let i = 0; i < 80; i++) {
    const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    const component = bloodComponents[Math.floor(Math.random() * bloodComponents.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const urgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)];
    
    // Generate request date (last 15 days)
    const daysAgo = Math.floor(Math.random() * 15);
    const requestedAt = new Date();
    requestedAt.setDate(requestedAt.getDate() - daysAgo);
    
    // Generate patient details
    const patientId = `patient-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const patientName = `Patient ${Math.floor(Math.random() * 1000)}`;
    const patientAge = Math.floor(20 + Math.random() * 60);
    const patientGender = Math.random() < 0.5 ? 'Male' : 'Female';
    
    // Generate quantity based on urgency
    let quantity;
    switch (urgency) {
      case 'emergency':
        quantity = Math.floor(1 + Math.random() * 4); // 1-4 units
        break;
      case 'urgent':
        quantity = Math.floor(1 + Math.random() * 3); // 1-3 units
        break;
      default:
        quantity = Math.floor(1 + Math.random() * 2); // 1-2 units
    }
    
    // Determine status
    let status;
    if (Math.random() < 0.6) {
      status = 'completed';
    } else if (Math.random() < 0.8) {
      status = 'approved';
    } else if (Math.random() < 0.95) {
      status = 'pending';
    } else {
      status = 'rejected';
    }
    
    // Generate request number
    const requestNumber = `BR${new Date().getFullYear()}${String(requestCounter).padStart(4, '0')}`;
    
    const requestQuery = `
      INSERT INTO emr.blood_requests (
        tenant_id, request_number, patient_id, patient_name, patient_age,
        patient_gender, blood_type, rh_factor, component, quantity,
        department, urgency, requested_by, request_date, status,
        clinical_indication, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
    `;
    
    const indications = [
      'Surgery - Elective',
      'Surgery - Emergency',
      'Trauma',
      'Anemia',
      'Obstetric Hemorrhage',
      'Oncology Surgery',
      'Cardiac Surgery',
      'Organ Transplant',
      'Burns',
      'GI Bleed'
    ];
    
    const indication = indications[Math.floor(Math.random() * indications.length)];
    
    await query(requestQuery, [
      tenantId,
      requestNumber,
      patientId,
      patientName,
      patientAge,
      patientGender,
      bloodType.type,
      bloodType.rh,
      component.name,
      quantity,
      department,
      urgency,
      'doctor-user-id',
      requestedAt,
      status,
      indication,
      'admin-user-id'
    ]);
    
    requestCounter++;
  }
  
  console.log('✅ Blood Requests Seeded Successfully');
}

// Generate blood bank inventory statistics
async function seedBloodBankStatistics() {
  console.log('📊 Seeding Blood Bank Statistics...');
  
  for (const bloodType of bloodTypes) {
    // Get current inventory for this blood type
    const inventoryQuery = `
      SELECT component, COUNT(*) as count, SUM(volume_ml) as total_volume
      FROM emr.blood_units 
      WHERE tenant_id = $1 AND blood_type = $2 AND status = 'available'
      GROUP BY component
    `;
    
    const inventoryResult = await query(inventoryQuery, [tenantId, bloodType.type]);
    
    for (const row of inventoryResult.rows) {
      const statsQuery = `
        INSERT INTO emr.blood_bank_statistics (
          tenant_id, blood_type, rh_factor, component, available_units,
          total_volume_ml, last_updated, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
        ON CONFLICT (tenant_id, blood_type, rh_factor, component) DO UPDATE SET
          available_units = EXCLUDED.available_units,
          total_volume_ml = EXCLUDED.total_volume_ml,
          last_updated = NOW(),
          updated_at = NOW()
      `;
      
      await query(statsQuery, [
        tenantId,
        bloodType.type,
        bloodType.rh,
        row.component,
        parseInt(row.count),
        parseInt(row.total_volume)
      ]);
    }
  }
  
  console.log('✅ Blood Bank Statistics Seeded Successfully');
}

// Generate donor records
async function seedDonorRecords() {
  console.log('👥 Seeding Donor Records...');
  
  for (const donor of donors) {
    // Generate donation history (1-5 donations per donor)
    const donationCount = Math.floor(1 + Math.random() * 5);
    
    for (let i = 0; i < donationCount; i++) {
      const daysAgo = Math.floor(Math.random() * 365); // Last year
      const donationDate = new Date();
      donationDate.setDate(donationDate.getDate() - daysAgo);
      
      const donationQuery = `
        INSERT INTO emr.donor_donations (
          tenant_id, donor_id, donor_name, blood_type, rh_factor,
          donation_date, volume_ml, donation_type, hemoglobin_level,
          blood_pressure, weight, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `;
      
      await query(donationQuery, [
        tenantId,
        donor.id,
        donor.name,
        donor.bloodType,
        donor.bloodType.includes('+') ? 'Positive' : 'Negative',
        donationDate,
        450, // Standard donation volume
        'Voluntary',
        donor.hemoglobin,
        '120/80', // Standard BP
        donor.weight
      ]);
    }
    
    // Create donor profile
    const donorProfileQuery = `
      INSERT INTO emr.blood_donors (
        tenant_id, donor_id, name, age, blood_type, rh_factor,
        contact_number, email, address, last_donation_date,
        total_donations, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (tenant_id, donor_id) DO UPDATE SET
        last_donation_date = EXCLUDED.last_donation_date,
        total_donations = EXCLUDED.total_donations,
        updated_at = NOW()
    `;
    
    await query(donorProfileQuery, [
      tenantId,
      donor.id,
      donor.name,
      donor.age,
      donor.bloodType,
      donor.bloodType.includes('+') ? 'Positive' : 'Negative',
      `+91${Math.floor(9000000000 + Math.random() * 1000000000)}`,
      `${donor.name.toLowerCase().replace(' ', '.')}@email.com`,
      `Address ${Math.floor(Math.random() * 100)}, City, State`,
      new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
      donationCount,
      'active'
    ]);
  }
  
  console.log('✅ Donor Records Seeded Successfully');
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Blood Bank Module Data Seeding...');
    
    await seedDonorRecords();
    await seedBloodUnits();
    await seedBloodRequests();
    await seedBloodBankStatistics();
    
    console.log('🎉 Blood Bank Module Data Seeding Complete!');
    console.log('📈 Generated:');
    console.log('   - 200+ blood units across all blood types');
    console.log('   - 80+ blood requests with various urgency levels');
    console.log('   - 10+ donor profiles with donation history');
    console.log('   - Complete blood bank inventory statistics');
    console.log('   - Realistic expiry dates and status tracking');
    console.log('   - Multiple blood components and departments');
    
  } catch (error) {
    console.error('❌ Error seeding blood bank data:', error);
    process.exit(1);
  }
}

main();
