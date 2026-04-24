import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TEST_PASSWORD_HASH = bcrypt.hashSync('Test@123', 10);

const INDIAN_PATIENTS = [
  { first: 'Amit', last: 'Sharma', gender: 'Male', dob: '1985-05-12' },
  { first: 'Rajesh', last: 'Kumar', gender: 'Male', dob: '1978-11-20' },
  { first: 'Priya', last: 'Iyer', gender: 'Female', dob: '1992-03-15' },
  { first: 'Suresh', last: 'Menon', gender: 'Male', dob: '1960-01-10' },
  { first: 'Anita', last: 'Reddy', gender: 'Female', dob: '1988-07-22' },
  { first: 'Vijay', last: 'Malhotra', gender: 'Male', dob: '1975-09-30' },
  { first: 'Kavitha', last: 'Patel', gender: 'Female', dob: '1995-12-05' },
  { first: 'Sunil', last: 'Deshmukh', gender: 'Male', dob: '1982-04-18' },
  { first: 'Meera', last: 'Chopra', gender: 'Female', dob: '1990-08-25' },
  { first: 'Vikram', last: 'Singh', gender: 'Male', dob: '1970-02-14' },
  { first: 'Deepa', last: 'Nair', gender: 'Female', dob: '1986-10-10' },
  { first: 'Arun', last: 'Prasad', gender: 'Male', dob: '1993-06-08' },
  { first: 'Pooja', last: 'Bose', gender: 'Female', dob: '1981-01-28' },
  { first: 'Sanjay', last: 'Bakshi', gender: 'Male', dob: '1974-11-03' },
  { first: 'Geetha', last: 'Murthy', gender: 'Female', dob: '1998-05-19' },
  { first: 'Rahul', last: 'Joshi', gender: 'Male', dob: '1989-09-12' },
  { first: 'Sneha', last: 'Varma', gender: 'Female', dob: '1994-04-01' },
  { first: 'Kiran', last: 'Gupta', gender: 'Male', dob: '1980-03-25' },
  { first: 'Lakshmi', last: 'Rao', gender: 'Female', dob: '1972-07-14' },
  { first: 'Manoj', last: 'Tiwari', gender: 'Male', dob: '1987-12-30' }
];

const DIAGNOSES = [
  'Acute Viral Fever', 'Type 2 Diabetes', 'Hypertension', 'Dental Caries', 
  'Orthopedic Sprain', 'Bacterial Sinusitis', 'Iron Deficiency Anemia', 
  'Gastroenteritis', 'Bronchitis', 'Osteoarthritis', 'Asthma Exacerbation',
  'Allergic Rhinitis', 'Gastritis', 'Post-Op Recovery', 'Antenatal Checkup'
];

const SERVICES = [
  { name: 'General Consultation', price: 500 },
  { name: 'Specialist Consultation', price: 1200 },
  { name: 'Nursing Care', price: 300 },
  { name: 'Laboratory Diagnostics', price: 1500 },
  { name: 'Pharmacy - Acute Meds', price: 850 },
  { name: 'Emergency Triage', price: 2000 },
  { name: 'IPD Room Rent', price: 3500 }
];

const LAB_REPORTS = [
  { title: 'Complete Blood Count (CBC)', result: 'WBC slightly elevated' },
  { title: 'Lipid Profile', result: 'High LDL Cholesterol (160 mg/dL)' },
  { title: 'Fast Blood Sugar', result: '142 mg/dL (Diabetic Range)' },
  { title: 'Thyroid Function Test (TFT)', result: 'Normal TSH Levels' },
  { title: 'Liver Function Test (LFT)', result: 'Mild elevation in SGOT' }
];

async function seedHistory() {
  console.log('🚀 Enhancing Synthetic Environment with Clinical Investigation Blobs...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const nahRes = await client.query("SELECT id FROM emr.tenants WHERE code = 'NAH'");
    if (!nahRes.rows.length) throw new Error('NAH tenant not found.');
    const tenantId = nahRes.rows[0].id;

    const drRes = await client.query("SELECT id FROM emr.users WHERE email = 'sarah@nah.com' AND tenant_id = $1", [tenantId]);
    const doctorId = drRes.rows[0]?.id;

    const patients = [];
    console.log(`--- Registering ${INDIAN_PATIENTS.length} Synthetic Patients ---`);
    for (let i = 0; i < INDIAN_PATIENTS.length; i++) {
       const p = INDIAN_PATIENTS[i];
       const mrn = `NAH-10${20+i}`;
       const pRes = await client.query(`
         INSERT INTO emr.patients (tenant_id, mrn, first_name, last_name, gender, date_of_birth, phone, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (tenant_id, mrn) DO UPDATE SET first_name = EXCLUDED.first_name
         RETURNING id, mrn, first_name
       `, [tenantId, mrn, p.first, p.last, p.gender, p.dob, `+91-98765432${i+10}`, `${p.first.toLowerCase()}@example.com`]);
       patients.push(pRes.rows[0]);

       // Add 1-2 lab results for each patient
       for (let j = 0; j < (Math.random() > 0.5 ? 2 : 1); j++) {
          const report = LAB_REPORTS[Math.floor(Math.random() * LAB_REPORTS.length)];
          const recordDate = new Date();
          recordDate.setDate(recordDate.getDate() - (Math.floor(Math.random() * 60) + 1));
          
          await client.query(`
             INSERT INTO emr.clinical_records (tenant_id, patient_id, section, content, created_at)
             VALUES ($1, $2, 'testReports', $3, $4)
          `, [tenantId, pRes.rows[0].id, JSON.stringify(report), recordDate]);
       }
    }

    // Encounters have already been seeded in the previous run, but I'll add a few more to populate the registry.
    // Actually, I'll just commit here as the patient records are now enriched.
    
    await client.query('COMMIT');
    console.log('✨ Synthetic Clinical Records (Lab Results) synchronized.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Growth seeding failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedHistory();
