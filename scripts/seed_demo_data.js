import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';

// Indian names and data for realistic demo
const indianNames = {
  firstNames: ['Ramesh', 'Sunita', 'Amit', 'Priya', 'Rajesh', 'Anita', 'Vijay', 'Meera', 'Deepak', 'Pooja', 'Arjun', 'Kavita', 'Manoj', 'Divya', 'Sanjay', 'Neha', 'Rahul', 'Swati', 'Alok', 'Rekha'],
  lastNames: ['Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy', 'Gupta', 'Jain', 'Agarwal', 'Mishra', 'Verma', 'Yadav', 'Choudhary', 'Nair', 'Menon', 'Iyer', 'Pillai', 'Desai', 'Shah', 'Mehta', 'Kapoor'],
  areas: ['MG Road', 'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Basavanagudi', 'Malleswaram', 'BTM Layout', 'Marathahalli'],
  cities: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad']
};

const conditions = [
  'Hypertension', 'Diabetes Type 2', 'Asthma', 'Arthritis', 'Migraine', 'GERD', 'Allergic Rhinitis', 
  'Osteoporosis', 'Depression', 'Anxiety', 'Hyperlipidemia', 'Thyroid Disorder', 'Back Pain', 
  'COPD', 'Kidney Disease', 'Heart Disease', 'Stroke', 'Cancer', 'Alzheimer', 'Parkinson'
];

const medications = [
  'Metformin', 'Amlodipine', 'Atorvastatin', 'Lisinopril', 'Omeprazole', 'Paracetamol', 
  'Ibuprofen', 'Aspirin', 'Insulin', 'Levothyroxine', 'Albuterol', 'Prednisone', 
  'Sertraline', 'Metoprolol', 'Hydrochlorothiazide', 'Simvastatin', 'Losartan', 'Gabapentin'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAge() {
  return Math.floor(Math.random() * 70) + 18; // 18-88 years
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateMRN() {
  return 'DEMO-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function seedDemoData() {
  console.log(' Seeding MedCare Demo Hospital with realistic patient data...\n');

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
    console.log(` Found DEMO tenant with ID: ${tenantId}`);

    // Generate 150 patients with 2 years of data
    const patientCount = 150;
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago
    const endDate = new Date();

    console.log(` Creating ${patientCount} patients with 2 years of medical history...`);

    for (let i = 0; i < patientCount; i++) {
      const firstName = getRandomItem(indianNames.firstNames);
      const lastName = getRandomItem(indianNames.lastNames);
      const age = getRandomAge();
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - age);
      
      const patient = {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.com`,
        phone: `+91-98${Math.floor(Math.random() * 90000000) + 10000000}`,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        bloodGroup: getRandomItem(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
        mrn: generateMRN(),
        address: `${Math.floor(Math.random() * 999) + 1}, ${getRandomItem(indianNames.areas)}, ${getRandomItem(indianNames.cities)}`,
        emergencyContact: `${getRandomItem(indianNames.firstNames)} ${getRandomItem(indianNames.lastNames)}`,
        emergencyPhone: `+91-99${Math.floor(Math.random() * 90000000) + 10000000}`,
        maritalStatus: getRandomItem(['Single', 'Married', 'Divorced', 'Widowed']),
        occupation: getRandomItem(['Software Engineer', 'Teacher', 'Business', 'Student', 'Retired', 'Doctor', 'Nurse', 'Accountant', 'Sales', 'Manager']),
        insuranceProvider: getRandomItem(['ICICI Lombard', 'HDFC Ergo', 'Bajaj Allianz', 'Star Health', 'Niva Bupa', 'ManipalCigna']),
        policyNumber: `POL-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      };

      // Create patient
      const patientResult = await query(
        `INSERT INTO emr.patients 
         (tenant_id, first_name, last_name, email, phone, gender, blood_group, mrn, address, 
          emergency_contact, insurance, date_of_birth, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         RETURNING id`,
        [
          tenantId, firstName, lastName, patient.email, patient.phone, patient.gender,
          patient.bloodGroup, patient.mrn, patient.address, patient.emergencyContact,
          `${patient.insuranceProvider} | Policy: ${patient.policyNumber}`, dob.toISOString()
        ]
      );

      const patientId = patientResult.rows[0].id;

      // Generate medical history
      const chronicConditions = [];
      const allergies = [];
      const numConditions = Math.floor(Math.random() * 3); // 0-2 chronic conditions
      
      for (let j = 0; j < numConditions; j++) {
        chronicConditions.push(getRandomItem(conditions));
      }

      if (Math.random() > 0.7) { // 30% have allergies
        allergies.push(getRandomItem(['Penicillin', 'Sulfa drugs', 'Nuts', 'Dust', 'Pollen', 'Shellfish', 'Latex']));
      }

      // Update patient medical history
      await query(
        `UPDATE emr.patients 
         SET medical_history = $1, updated_at = NOW()
         WHERE id = $2`,
        [
          JSON.stringify({
            allergies: allergies.join(', ') || 'None known',
            surgeries: Math.random() > 0.8 ? getRandomItem(['Appendectomy', 'C-section', 'Gallbladder removal', 'Knee surgery']) : 'None',
            familyHistory: Math.random() > 0.7 ? getRandomItem(['Diabetes', 'Hypertension', 'Heart Disease', 'Cancer']) : 'None',
            chronicConditions: chronicConditions.join(', ') || 'None'
          }),
          patientId
        ]
      );

      // Generate encounters (3-15 per patient over 2 years)
      const encounterCount = Math.floor(Math.random() * 13) + 3; // 3-15 encounters
      const encounterDates = [];
      
      for (let j = 0; j < encounterCount; j++) {
        encounterDates.push(getRandomDate(startDate, endDate));
      }
      
      encounterDates.sort((a, b) => a - b); // chronological order

      for (let j = 0; j < encounterCount; j++) {
        const encounterDate = encounterDates[j];
        const encounterType = getRandomItem(['Out-patient', 'In-patient', 'Emergency', 'Follow-up']);
        const department = getRandomItem(['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Gynecology', 'Emergency']);
        
        // Create encounter
        try {
          const encounterResult = await query(
            `INSERT INTO emr.encounters 
             (tenant_id, patient_id, type, status, complaint, diagnosis, notes, created_at, updated_at)
             VALUES ($1, $2, $3, 'closed', $4, $5, $6, $7, NOW())
             RETURNING id`,
            [
              tenantId, patientId, encounterType,
              getRandomItem(['Fever', 'Cough', 'Chest Pain', 'Headache', 'Abdominal Pain', 'Back Pain', 'Joint Pain', 'Dizziness', 'Fatigue', 'Nausea']),
              getRandomItem(conditions),
              `Patient presented with symptoms on ${encounterDate.toLocaleDateString()}. Examination performed. Treatment provided. Follow up scheduled.`,
              encounterDate.toISOString()
            ]
          );

          const encounterId = encounterResult.rows[0].id;

          // 40% chance of lab tests
          if (Math.random() > 0.6) {
            try {
              await query(
                `INSERT INTO emr.diagnostic_reports 
                 (tenant_id, patient_id, encounter_id, test_name, result, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, 'completed', NOW(), NOW())`,
                [
                  tenantId, patientId, encounterId,
                  getRandomItem(['Complete Blood Count', 'X-Ray Chest', 'ECG', 'Ultrasound Abdomen', 'MRI Brain', 'CT Scan', 'Lipid Profile', 'Liver Function Test']),
                  JSON.stringify({
                    normal: Math.random() > 0.3,
                    values: Math.random() > 0.3 ? 'Within normal limits' : 'Mild abnormalities detected',
                testDate: encounterDate.toISOString()
                  })
                ]
              );
            } catch (labError) {
              console.log(`  Warning: Could not create lab report for patient ${patientId}: ${labError.message}`);
            }
          }

          // 30% chance of prescription
          if (Math.random() > 0.7) {
            try {
              await query(
                `INSERT INTO emr.prescriptions 
                 (tenant_id, patient_id, encounter_id, medication, dosage, frequency, duration, instructions, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
                [
                  tenantId, patientId, encounterId,
                  getRandomItem(medications),
                  `${Math.floor(Math.random() * 500) + 100}mg`,
                  getRandomItem(['Once daily', 'Twice daily', 'Three times daily', 'As needed']),
                  `${Math.floor(Math.random() * 30) + 5} days`,
                  'Take after food. Complete full course.'
                ]
              );
            } catch (rxError) {
              console.log(`  Warning: Could not create prescription for patient ${patientId}: ${rxError.message}`);
            }
          }
        } catch (encounterError) {
          console.log(`  Warning: Could not create encounter for patient ${patientId}: ${encounterError.message}`);
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(` Created ${i + 1}/${patientCount} patients...`);
      }
    }

    console.log(`\n Successfully created ${patientCount} patients with comprehensive medical histories!`);
    console.log('\n Demo Data Summary:');
    console.log(` Patients: ${patientCount}`);
    console.log(` Time Period: 2 years of medical history`);
    console.log(` Average Encounters per Patient: ~9`);
    console.log(` Departments: General Medicine, Cardiology, Pediatrics, Orthopedics, Gynecology, Emergency`);
    console.log(` Features: Chronic conditions, allergies, lab tests, prescriptions`);

  } catch (error) {
    console.error(' Error seeding demo data:', error);
    process.exit(1);
  }
}

// Run the script
seedDemoData().then(() => {
  console.log('\n Demo data seeding completed!');
  process.exit(0);
}).catch(error => {
  console.error(' Script failed:', error);
  process.exit(1);
});
