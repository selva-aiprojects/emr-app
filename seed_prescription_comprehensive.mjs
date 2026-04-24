// Comprehensive Prescription Module Seed Script
// Creates realistic prescriptions, medicines, and prescription data for dashboard validation

import { query } from '../server/db/connection.js';

const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'; // New Age Hospital

// Drug master data with realistic medications
const drugMaster = [
  // Pain and Fever
  { id: 'drug-001', brandName: 'Crocin', genericName: 'Paracetamol', category: 'Analgesic', dosageForm: 'TABLET', strength: '500mg', schedule: 'OTC' },
  { id: 'drug-002', brandName: 'Brufen', genericName: 'Ibuprofen', category: 'Analgesic', dosageForm: 'TABLET', strength: '400mg', schedule: 'H' },
  { id: 'drug-003', brandName: 'Aspirin', genericName: 'Aspirin', category: 'Analgesic', dosageForm: 'TABLET', strength: '75mg', schedule: 'H' },
  { id: 'drug-004', brandName: 'Voveran', genericName: 'Diclofenac', category: 'Analgesic', dosageForm: 'TABLET', strength: '50mg', schedule: 'H' },
  
  // Antibiotics
  { id: 'drug-005', brandName: 'Azithral', genericName: 'Azithromycin', category: 'Antibiotic', dosageForm: 'TABLET', strength: '500mg', schedule: 'H' },
  { id: 'drug-006', brandName: 'Augmentin', genericName: 'Amoxicillin+Clavulanate', category: 'Antibiotic', dosageForm: 'TABLET', strength: '625mg', schedule: 'H' },
  { id: 'drug-007', brandName: 'Ceftum', genericName: 'Cefuroxime', category: 'Antibiotic', dosageForm: 'TABLET', strength: '500mg', schedule: 'H' },
  { id: 'drug-008', brandName: 'Levoflox', genericName: 'Levofloxacin', category: 'Antibiotic', dosageForm: 'TABLET', strength: '500mg', schedule: 'H' },
  
  // Cardiovascular
  { id: 'drug-009', brandName: 'Metolar', genericName: 'Metoprolol', category: 'Cardiovascular', dosageForm: 'TABLET', strength: '25mg', schedule: 'H' },
  { id: 'drug-010', brandName: 'Amlong', genericName: 'Amlodipine', category: 'Cardiovascular', dosageForm: 'TABLET', strength: '5mg', schedule: 'H' },
  { id: 'drug-011', brandName: 'Ecosprin', genericName: 'Aspirin', category: 'Cardiovascular', dosageForm: 'TABLET', strength: '75mg', schedule: 'H' },
  { id: 'drug-012', brandName: 'Storvas', genericName: 'Atorvastatin', category: 'Cardiovascular', dosageForm: 'TABLET', strength: '40mg', schedule: 'H' },
  
  // Diabetes
  { id: 'drug-013', brandName: 'Glycomet', genericName: 'Metformin', category: 'Antidiabetic', dosageForm: 'TABLET', strength: '500mg', schedule: 'H' },
  { id: 'drug-014', brandName: 'Januvia', genericName: 'Sitagliptin', category: 'Antidiabetic', dosageForm: 'TABLET', strength: '100mg', schedule: 'H' },
  { id: 'drug-015', brandName: 'Lantus', genericName: 'Insulin Glargine', category: 'Antidiabetic', dosageForm: 'INJECTION', strength: '100U/ml', schedule: 'H' },
  { id: 'drug-016', brandName: 'Actrapid', genericName: 'Insulin Human', category: 'Antidiabetic', dosageForm: 'INJECTION', strength: '100U/ml', schedule: 'H' },
  
  // Respiratory
  { id: 'drug-017', brandName: 'Asthalin', genericName: 'Salbutamol', category: 'Respiratory', dosageForm: 'INHALER', strength: '100mcg', schedule: 'H' },
  { id: 'drug-018', brandName: 'Budecort', genericName: 'Budesonide', category: 'Respiratory', dosageForm: 'INHALER', strength: '200mcg', schedule: 'H' },
  { id: 'drug-019', brandName: 'Montair', genericName: 'Montelukast', category: 'Respiratory', dosageForm: 'TABLET', strength: '10mg', schedule: 'H' },
  { id: 'drug-020', brandName: 'Allegra', genericName: 'Fexofenadine', category: 'Respiratory', dosageForm: 'TABLET', strength: '120mg', schedule: 'OTC' },
  
  // Gastrointestinal
  { id: 'drug-021', brandName: 'Pantocid', genericName: 'Pantoprazole', category: 'GI', dosageForm: 'TABLET', strength: '40mg', schedule: 'H' },
  { id: 'drug-022', brandName: 'Rantac', genericName: 'Ranitidine', category: 'GI', dosageForm: 'TABLET', strength: '150mg', schedule: 'OTC' },
  { id: 'drug-023', brandName: 'Cremaffin', genericName: 'Liquid Paraffin', category: 'GI', dosageForm: 'SYRUP', strength: '100ml', schedule: 'OTC' },
  { id: 'drug-024', brandName: 'Lanzol', genericName: 'Lansoprazole', category: 'GI', dosageForm: 'CAPSULE', strength: '30mg', schedule: 'H' },
  
  // CNS/Psychiatry
  { id: 'drug-025', brandName: 'Serenace', genericName: 'Haloperidol', category: 'Psychiatric', dosageForm: 'TABLET', strength: '5mg', schedule: 'H1' },
  { id: 'drug-026', brandName: 'Rivotril', genericName: 'Clonazepam', category: 'Psychiatric', dosageForm: 'TABLET', strength: '0.5mg', schedule: 'H1' },
  { id: 'drug-027', brandName: 'Alprax', genericName: 'Alprazolam', category: 'Psychiatric', dosageForm: 'TABLET', strength: '0.5mg', schedule: 'H1' },
  { id: 'drug-028', brandName: 'Seroquel', genericName: 'Quetiapine', category: 'Psychiatric', dosageForm: 'TABLET', strength: '100mg', schedule: 'H1' },
  
  // Vitamins and Supplements
  { id: 'drug-029', brandName: 'Supradyn', genericName: 'Multivitamin', category: 'Vitamin', dosageForm: 'TABLET', strength: '1 tablet', schedule: 'OTC' },
  { id: 'drug-030', brandName: 'Shelcal', genericName: 'Calcium+Vit D3', category: 'Vitamin', dosageForm: 'TABLET', strength: '500mg', schedule: 'OTC' },
  { id: 'drug-031', brandName: 'Zincovit', genericName: 'Zinc+Vit C', category: 'Vitamin', dosageForm: 'TABLET', strength: '1 tablet', schedule: 'OTC' },
  { id: 'drug-032', brandName: 'Becosules', genericName: 'Vitamin B Complex', category: 'Vitamin', dosageForm: 'CAPSULE', strength: '1 capsule', schedule: 'OTC' }
];

// Sample patients
const patients = [
  { id: 'patient-001', name: 'Rajesh Kumar', age: 45, gender: 'Male', weight: 75, allergies: ['Penicillin', 'Sulfa'] },
  { id: 'patient-002', name: 'Priya Sharma', age: 32, gender: 'Female', weight: 62, allergies: ['NSAIDs'] },
  { id: 'patient-003', name: 'Amit Patel', age: 28, gender: 'Male', weight: 70, allergies: [] },
  { id: 'patient-004', name: 'Sunita Reddy', age: 55, gender: 'Female', weight: 68, allergies: ['Egg', 'Dust'] },
  { id: 'patient-005', name: 'Vikram Singh', age: 38, gender: 'Male', weight: 82, allergies: ['Latex'] },
  { id: 'patient-006', name: 'Anjali Gupta', age: 41, gender: 'Female', weight: 58, allergies: ['Shellfish'] },
  { id: 'patient-007', name: 'Rahul Verma', age: 29, gender: 'Male', weight: 72, allergies: [] },
  { id: 'patient-008', name: 'Meera Joshi', age: 48, gender: 'Female', weight: 65, allergies: ['Pollen'] },
  { id: 'patient-009', name: 'Sanjay Kumar', age: 52, gender: 'Male', weight: 78, allergies: ['Codeine'] },
  { id: 'patient-010', name: 'Deepa Nair', age: 35, gender: 'Female', weight: 60, allergies: ['Aspirin'] }
];

// Sample doctors
const doctors = [
  { id: 'doctor-001', name: 'Dr. Ashok Kumar', department: 'General Medicine', registration: 'MC12345' },
  { id: 'doctor-002', name: 'Dr. Priya Nair', department: 'Cardiology', registration: 'MC12346' },
  { id: 'doctor-003', name: 'Dr. Rajesh Sharma', department: 'Surgery', registration: 'MC12347' },
  { id: 'doctor-004', name: 'Dr. Anita Desai', department: 'Pediatrics', registration: 'MC12348' },
  { id: 'doctor-005', name: 'Dr. Vikram Singh', department: 'Orthopedics', registration: 'MC12349' }
];

// Common dosage instructions
const dosageInstructions = [
  '1-1-1', '1-0-1', '0-0-1', '1-0-0', '0-1-1', 
  '2-2-2', '1-2-1', '2-1-2', 'After meals', 'Before meals',
  'Twice daily', 'Three times daily', 'Once daily', 'As needed'
];

// Common frequencies
const frequencies = [
  'Three times daily', 'Twice daily', 'Once daily', 'Four times daily',
  'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed'
];

// Common indications
const indications = [
  'Fever', 'Pain', 'Infection', 'Hypertension', 'Diabetes', 'Asthma',
  'GERD', 'Arthritis', 'Depression', 'Anxiety', 'Insomnia',
  'Allergy', 'Nausea', 'Constipation', 'Headache', 'Cough'
];

// Generate enhanced prescriptions
async function seedEnhancedPrescriptions() {
  console.log('💊 Seeding Enhanced Prescriptions...');
  
  let prescriptionCounter = 1;
  
  for (let i = 0; i < 200; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    
    // Generate prescription date (last 30 days)
    const daysAgo = Math.floor(Math.random() * 30);
    const prescriptionDate = new Date();
    prescriptionDate.setDate(prescriptionDate.getDate() - daysAgo);
    
    // Generate prescription number
    const prescriptionNumber = `RX${new Date().getFullYear()}${String(prescriptionCounter).padStart(4, '0')}`;
    
    // Determine status
    const statusOptions = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'];
    const weights = [0.5, 0.3, 0.1, 0.1]; // 50% active, 30% completed, 10% cancelled, 10% expired
    const status = weightedRandom(statusOptions, weights);
    
    // Calculate validity days based on status
    let validityDays = 30;
    if (status === 'EXPIRED') {
      validityDays = Math.floor(5 + Math.random() * 25); // Expired prescriptions have shorter validity
    }
    
    const prescriptionQuery = `
      INSERT INTO emr.prescriptions_enhanced (
        tenant_id, prescription_number, patient_id, encounter_id, doctor_id,
        doctor_registration, prescription_date, validity_days, patient_weight_kg,
        patient_age_years, patient_gender, known_allergies, chronic_conditions,
        current_medications, diagnosis_icd10_codes, special_instructions,
        doctor_digital_signature, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
      RETURNING id
    `;
    
    const encounterId = `encounter-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const chronicConditions = ['Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'Heart Disease'];
    const selectedConditions = chronicConditions.filter(() => Math.random() < 0.3);
    
    const diagnosisCodes = ['I10', 'E11.9', 'J45.909', 'M15.9', 'I25.1'];
    const selectedDiagnoses = diagnosisCodes.filter(() => Math.random() < 0.4);
    
    const prescriptionResult = await query(prescriptionQuery, [
      tenantId,
      prescriptionNumber,
      patient.id,
      encounterId,
      doctor.id,
      doctor.registration,
      prescriptionDate,
      validityDays,
      patient.weight,
      patient.age,
      patient.gender,
      patient.allergies,
      selectedConditions,
      [], // Current medications (will be populated from previous prescriptions)
      selectedDiagnoses,
      'Take medication as prescribed. Complete full course.',
      Math.random() < 0.7, // 70% have digital signature
      status,
      doctor.id
    ]);
    
    const prescriptionId = prescriptionResult.rows[0].id;
    
    // Add medicines to prescription (1-5 medicines per prescription)
    const medicineCount = Math.floor(1 + Math.random() * 5);
    
    for (let j = 0; j < medicineCount; j++) {
      const drug = drugMaster[Math.floor(Math.random() * drugMaster.length)];
      const dosageInstruction = dosageInstructions[Math.floor(Math.random() * dosageInstructions.length)];
      const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
      const indication = indications[Math.floor(Math.random() * indications.length)];
      const durationDays = Math.floor(3 + Math.random() * 27); // 3-30 days
      const totalQuantity = Math.floor(durationDays * (1 + Math.random() * 3)); // 1-4 times per day
      
      // Calculate dispensed quantity based on status
      let dispensedQuantity = 0;
      let medicineStatus = 'PENDING';
      
      if (status === 'COMPLETED') {
        dispensedQuantity = totalQuantity;
        medicineStatus = 'DISPENSED';
      } else if (status === 'ACTIVE' && Math.random() < 0.3) {
        dispensedQuantity = Math.floor(totalQuantity * 0.5); // Partially dispensed
        medicineStatus = 'PARTIALLY_DISPENSED';
      }
      
      const medicineQuery = `
        INSERT INTO emr.prescription_medicines (
          prescription_id, drug_id, brand_name, generic_name, dosage_form, strength,
          route_of_administration, dosage_instructions, frequency, duration_days,
          total_quantity, quantity_unit, indication, special_instructions,
          is_prn, max_daily_dose, warnings, contraindications, status,
          dispensed_quantity, dispensed_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
      `;
      
      const warnings = [];
      const contraindications = [];
      
      // Add warnings based on drug category
      if (drug.category === 'Antibiotic') {
        warnings.push('Complete full course', 'May cause diarrhea');
      }
      if (drug.category === 'Psychiatric') {
        warnings.push('May cause drowsiness', 'Do not drive');
        contraindications.push('Pregnancy', 'Liver disease');
      }
      if (drug.category === 'Cardiovascular') {
        warnings.push('Monitor blood pressure', 'May cause dizziness');
      }
      
      await query(medicineQuery, [
        prescriptionId,
        drug.id,
        drug.brandName,
        drug.genericName,
        drug.dosageForm,
        drug.strength,
        drug.dosageForm === 'INJECTION' ? 'IV' : 'ORAL',
        dosageInstruction,
        frequency,
        durationDays,
        totalQuantity,
        drug.dosageForm === 'TABLET' ? 'TABLETS' : drug.dosageForm === 'INJECTION' ? 'ML' : 'UNITS',
        indication,
        durationDays > 7 ? 'Continue as prescribed' : 'Short course',
        Math.random() < 0.2, // 20% PRN medications
        dosageInstruction.includes('1-1-1') ? '3 tablets' : '2 tablets',
        warnings,
        contraindications,
        medicineStatus,
        dispensedQuantity,
        dispensedQuantity > 0 ? prescriptionDate : null
      ]);
    }
    
    prescriptionCounter++;
  }
  
  console.log('✅ Enhanced Prescriptions Seeded Successfully');
}

// Generate drug master data
async function seedDrugMaster() {
  console.log('📚 Seeding Drug Master Data...');
  
  for (const drug of drugMaster) {
    const drugQuery = `
      INSERT INTO emr.drug_master (
        tenant_id, brand_name, generic_name, therapeutic_category, dosage_form,
        strength, schedule_category, is_narcotic, is_psychotropic, is_antibiotic,
        requires_prescription, contraindications, side_effects, drug_interactions,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      ON CONFLICT (tenant_id, brand_name, generic_name) DO UPDATE SET
        therapeutic_category = EXCLUDED.therapeutic_category,
        dosage_form = EXCLUDED.dosage_form,
        strength = EXCLUDED.strength,
        schedule_category = EXCLUDED.schedule_category,
        updated_at = NOW()
    `;
    
    const contraindications = [];
    const sideEffects = [];
    const drugInteractions = [];
    
    // Add category-specific information
    if (drug.category === 'Antibiotic') {
      contraindications.push('Allergy to drug', 'Pregnancy (some)');
      sideEffects.push('Nausea', 'Diarrhea', 'Allergic reaction');
      drugInteractions.push('Antacids', 'Warfarin');
    }
    if (drug.category === 'Psychiatric') {
      contraindications.push('Pregnancy', 'Liver disease', 'Glaucoma');
      sideEffects.push('Drowsiness', 'Dizziness', 'Dry mouth');
      drugInteractions.push('Alcohol', 'Sedatives');
    }
    if (drug.category === 'Cardiovascular') {
      contraindications.push('Severe hypotension', 'Heart block');
      sideEffects.push('Bradycardia', 'Fatigue', 'Dizziness');
      drugInteractions.push('Other antihypertensives', 'CYP3A4 inhibitors');
    }
    
    await query(drugQuery, [
      tenantId,
      drug.brandName,
      drug.genericName,
      drug.category,
      drug.dosageForm,
      drug.strength,
      drug.schedule,
      drug.schedule === 'H1' || drug.schedule === 'H2', // Narcotic or psychotropic
      drug.schedule === 'H1', // Psychotropic
      drug.category === 'Antibiotic',
      drug.schedule !== 'OTC', // Requires prescription if not OTC
      contraindications,
      sideEffects,
      drugInteractions
    ]);
  }
  
  console.log('✅ Drug Master Data Seeded Successfully');
}

// Generate prescription statistics
async function seedPrescriptionStatistics() {
  console.log('📊 Seeding Prescription Statistics...');
  
  const stats = [
    {
      category: 'Antibiotics',
      totalPrescriptions: 45,
      activePrescriptions: 28,
      completedPrescriptions: 15,
      cancelledPrescriptions: 2,
      averageMedicinesPerPrescription: 2.1
    },
    {
      category: 'Analgesics',
      totalPrescriptions: 38,
      activePrescriptions: 22,
      completedPrescriptions: 14,
      cancelledPrescriptions: 2,
      averageMedicinesPerPrescription: 1.3
    },
    {
      category: 'Cardiovascular',
      totalPrescriptions: 52,
      activePrescriptions: 35,
      completedPrescriptions: 15,
      cancelledPrescriptions: 2,
      averageMedicinesPerPrescription: 2.8
    },
    {
      category: 'Antidiabetics',
      totalPrescriptions: 28,
      activePrescriptions: 20,
      completedPrescriptions: 6,
      cancelledPrescriptions: 2,
      averageMedicinesPerPrescription: 1.5
    },
    {
      category: 'Respiratory',
      totalPrescriptions: 22,
      activePrescriptions: 15,
      completedPrescriptions: 6,
      cancelledPrescriptions: 1,
      averageMedicinesPerPrescription: 1.8
    },
    {
      category: 'Psychiatric',
      totalPrescriptions: 15,
      activePrescriptions: 10,
      completedPrescriptions: 4,
      cancelledPrescriptions: 1,
      averageMedicinesPerPrescription: 1.2
    }
  ];
  
  for (const stat of stats) {
    const query = `
      INSERT INTO emr.prescription_statistics (
        tenant_id, category, total_prescriptions, active_prescriptions,
        completed_prescriptions, cancelled_prescriptions, average_medicines_per_prescription,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (tenant_id, category) DO UPDATE SET
        total_prescriptions = EXCLUDED.total_prescriptions,
        active_prescriptions = EXCLUDED.active_prescriptions,
        completed_prescriptions = EXCLUDED.completed_prescriptions,
        cancelled_prescriptions = EXCLUDED.cancelled_prescriptions,
        average_medicines_per_prescription = EXCLUDED.average_medicines_per_prescription,
        updated_at = NOW()
    `;
    
    await query(query, [
      tenantId,
      stat.category,
      stat.totalPrescriptions,
      stat.activePrescriptions,
      stat.completedPrescriptions,
      stat.cancelledPrescriptions,
      stat.averageMedicinesPerPrescription
    ]);
  }
  
  console.log('✅ Prescription Statistics Seeded Successfully');
}

// Helper function for weighted random selection
function weightedRandom(options, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < options.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return options[i];
    }
  }
  
  return options[options.length - 1];
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Prescription Module Data Seeding...');
    
    await seedDrugMaster();
    await seedEnhancedPrescriptions();
    await seedPrescriptionStatistics();
    
    console.log('🎉 Prescription Module Data Seeding Complete!');
    console.log('📈 Generated:');
    console.log('   - 32+ drugs in master database');
    console.log('   - 200+ enhanced prescriptions');
    console.log('   - 500+ prescription medicines');
    console.log('   - Complete drug categories and schedules');
    console.log('   - Realistic dosage instructions and frequencies');
    console.log('   - Prescription statistics for dashboard');
    
  } catch (error) {
    console.error('❌ Error seeding prescription data:', error);
    process.exit(1);
  }
}

main();
