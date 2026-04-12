import { query } from '../server/db/connection.js';

const complaints = [
  'Fever', 'Cough', 'Chest Pain', 'Headache', 'Abdominal Pain', 'Back Pain', 
  'Joint Pain', 'Dizziness', 'Fatigue', 'Nausea', 'Vomiting', 'Diarrhea', 
  'Shortness of Breath', 'Palpitations', 'Loss of Appetite', 'Weight Loss'
];

const conditions = [
  'Hypertension', 'Diabetes Type 2', 'Asthma', 'Arthritis', 'Migraine', 'GERD', 
  'Allergic Rhinitis', 'Osteoporosis', 'Depression', 'Anxiety', 'Hyperlipidemia', 
  'Thyroid Disorder', 'Back Pain', 'COPD', 'Kidney Disease', 'Heart Disease'
];

const encounterTypes = ['Out-patient', 'In-patient', 'Emergency', 'Follow-up', 'Consultation'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedEncounters() {
  console.log(' Seeding encounters for demo patients...\n');

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

    // Get all patients
    const patientsResult = await query(
      'SELECT id, first_name, last_name FROM emr.patients WHERE tenant_id = $1',
      [tenantId]
    );

    console.log(` Found ${patientsResult.rows.length} patients`);

    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago
    const endDate = new Date();

    let totalEncounters = 0;

    for (const patient of patientsResult.rows) {
      const patientId = patient.id;
      const encounterCount = Math.floor(Math.random() * 8) + 2; // 2-9 encounters per patient
      const encounterDates = [];
      
      for (let j = 0; j < encounterCount; j++) {
        encounterDates.push(getRandomDate(startDate, endDate));
      }
      
      encounterDates.sort((a, b) => a - b); // chronological order

      for (const encounterDate of encounterDates) {
        try {
          await query(
            `INSERT INTO emr.encounters 
             (tenant_id, patient_id, encounter_type, visit_date, chief_complaint, diagnosis, notes, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'closed', $8, NOW())`,
            [
              tenantId, 
              patientId, 
              getRandomItem(encounterTypes),
              encounterDate.toISOString().split('T')[0], // YYYY-MM-DD format
              getRandomItem(complaints),
              getRandomItem(conditions),
              `Patient presented with symptoms on ${encounterDate.toLocaleDateString()}. Examination performed. Treatment provided. Follow up scheduled if needed.`,
              encounterDate.toISOString()
            ]
          );
          totalEncounters++;
        } catch (error) {
          console.log(`  Warning: Could not create encounter for patient ${patient.first_name} ${patient.last_name}: ${error.message}`);
        }
      }
    }

    console.log(`\n Successfully created ${totalEncounters} encounters!`);
    console.log('\n Encounter Summary:');
    console.log(` Total Patients: ${patientsResult.rows.length}`);
    console.log(` Total Encounters: ${totalEncounters}`);
    console.log(` Average Encounters per Patient: ${(totalEncounters / patientsResult.rows.length).toFixed(1)}`);
    console.log(` Time Period: 2 years of medical history`);
    console.log(` Encounter Types: Out-patient, In-patient, Emergency, Follow-up, Consultation`);

  } catch (error) {
    console.error(' Error seeding encounters:', error);
    process.exit(1);
  }
}

// Run the script
seedEncounters().then(() => {
  console.log('\n Encounter seeding completed!');
  process.exit(0);
}).catch(error => {
  console.error(' Script failed:', error);
  process.exit(1);
});
