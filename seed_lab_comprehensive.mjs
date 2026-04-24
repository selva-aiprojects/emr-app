// Comprehensive Lab Module Seed Script
// Creates realistic lab orders, results, and service requests for dashboard validation

import { query } from '../server/db/connection.js';

const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'; // New Age Hospital

// Lab test categories and tests
const labTests = [
  // Hematology
  { category: 'Hematology', name: 'Complete Blood Count (CBC)', code: 'CBC', normalRange: 'RBC: 4.5-5.5 M/uL, WBC: 4.0-11.0 K/uL, Platelets: 150-450 K/uL' },
  { category: 'Hematology', name: 'ESR', code: 'ESR', normalRange: '0-20 mm/hr' },
  { category: 'Hematology', name: 'Peripheral Smear', code: 'PS', normalRange: 'Normal RBC morphology' },
  
  // Biochemistry
  { category: 'Biochemistry', name: 'Fasting Blood Sugar', code: 'FBS', normalRange: '70-100 mg/dL' },
  { category: 'Biochemistry', name: 'Post Prandial Blood Sugar', code: 'PPBS', normalRange: '<140 mg/dL' },
  { category: 'Biochemistry', name: 'HbA1c', code: 'HBA1C', normalRange: '4.0-5.6%' },
  { category: 'Biochemistry', name: 'Liver Function Test', code: 'LFT', normalRange: 'SGOT: 5-40 U/L, SGPT: 7-56 U/L, ALP: 40-129 U/L' },
  { category: 'Biochemistry', name: 'Kidney Function Test', code: 'KFT', normalRange: 'Creatinine: 0.6-1.2 mg/dL, BUN: 7-20 mg/dL' },
  { category: 'Biochemistry', name: 'Lipid Profile', code: 'LP', normalRange: 'Total Cholesterol: <200 mg/dL, Triglycerides: <150 mg/dL' },
  { category: 'Biochemistry', name: 'Uric Acid', code: 'UA', normalRange: '3.5-7.2 mg/dL' },
  { category: 'Biochemistry', name: 'Electrolytes', code: 'ELECT', normalRange: 'Na: 135-145 mEq/L, K: 3.5-5.0 mEq/L, Cl: 98-106 mEq/L' },
  
  // Microbiology
  { category: 'Microbiology', name: 'Blood Culture', code: 'BC', normalRange: 'No growth' },
  { category: 'Microbiology', name: 'Urine Culture', code: 'UC', normalRange: 'No growth' },
  { category: 'Microbiology', name: 'Throat Swab Culture', code: 'TSC', normalRange: 'No growth' },
  { category: 'Microbiology', name: 'Wound Swab Culture', code: 'WSC', normalRange: 'No growth' },
  
  // Serology
  { category: 'Serology', name: 'HIV 1 & 2', code: 'HIV', normalRange: 'Non-reactive' },
  { category: 'Serology', name: 'Hepatitis B Surface Antigen', code: 'HBsAg', normalRange: 'Non-reactive' },
  { category: 'Serology', name: 'Hepatitis C Antibody', code: 'HCV', normalRange: 'Non-reactive' },
  { category: 'Serology', name: 'VDRL', code: 'VDRL', normalRange: 'Non-reactive' },
  { category: 'Serology', name: 'Widal Test', code: 'WIDAL', normalRange: 'TO < 1:80, TH < 1:80' },
  
  // Hormones
  { category: 'Hormones', name: 'TSH', code: 'TSH', normalRange: '0.4-4.0 mIU/L' },
  { category: 'Hormones', name: 'T3', code: 'T3', normalRange: '80-200 ng/dL' },
  { category: 'Hormones', name: 'T4', code: 'T4', normalRange: '4.5-12.5 µg/dL' },
  { category: 'Hormones', name: 'Insulin', code: 'INS', normalRange: '2-20 µIU/mL' },
  
  // Cardiac
  { category: 'Cardiac', name: 'Troponin I', code: 'TROP', normalRange: '<0.04 ng/mL' },
  { category: 'Cardiac', name: 'CK-MB', code: 'CKMB', normalRange: '0-25 IU/L' },
  { category: 'Cardiac', name: 'LDH', code: 'LDH', normalRange: '140-280 U/L' },
  
  // Immunology
  { category: 'Immunology', name: 'CRP', code: 'CRP', normalRange: '<1.0 mg/L' },
  { category: 'Immunology', name: 'RA Factor', code: 'RAF', normalRange: '<20 IU/mL' },
  { category: 'Immunology', name: 'ASO Titer', code: 'ASOT', normalRange: '<200 IU/mL' },
  
  // Special Tests
  { category: 'Special Tests', name: 'D-Dimer', code: 'DDIMER', normalRange: '<0.5 µg/mL' },
  { category: 'Special Tests', name: 'Prothrombin Time', code: 'PT', normalRange: '11-13.5 seconds' },
  { category: 'Special Tests', name: 'INR', code: 'INR', normalRange: '0.8-1.2' },
  { category: 'Special Tests', name: 'APTT', code: 'APTT', normalRange: '25-35 seconds' }
];

// Sample patient data
const patients = [
  { id: 'patient-001', name: 'Rajesh Kumar', age: 45, gender: 'Male' },
  { id: 'patient-002', name: 'Priya Sharma', age: 32, gender: 'Female' },
  { id: 'patient-003', name: 'Amit Patel', age: 28, gender: 'Male' },
  { id: 'patient-004', name: 'Sunita Reddy', age: 55, gender: 'Female' },
  { id: 'patient-005', name: 'Vikram Singh', age: 38, gender: 'Male' },
  { id: 'patient-006', name: 'Anjali Gupta', age: 41, gender: 'Female' },
  { id: 'patient-007', name: 'Rahul Verma', age: 29, gender: 'Male' },
  { id: 'patient-008', name: 'Meera Joshi', age: 48, gender: 'Female' },
  { id: 'patient-009', name: 'Sanjay Kumar', age: 52, gender: 'Male' },
  { id: 'patient-010', name: 'Deepa Nair', age: 35, gender: 'Female' }
];

// Sample doctors
const doctors = [
  { id: 'doctor-001', name: 'Dr. Ashok Kumar', department: 'Pathology' },
  { id: 'doctor-002', name: 'Dr. Priya Nair', department: 'Medicine' },
  { id: 'doctor-003', name: 'Dr. Rajesh Sharma', department: 'Surgery' },
  { id: 'doctor-004', name: 'Dr. Anita Desai', department: 'Pediatrics' },
  { id: 'doctor-005', name: 'Dr. Vikram Singh', department: 'Orthopedics' }
];

// Test results generation
function generateTestResult(testCode, patientAge, patientGender) {
  const results = {
    'CBC': {
      RBC: (4.2 + Math.random() * 1.3).toFixed(2),
      WBC: (5.5 + Math.random() * 4.5).toFixed(2),
      Hemoglobin: (11.5 + Math.random() * 4).toFixed(1),
      Hematocrit: (36 + Math.random() * 12).toFixed(1),
      Platelets: Math.floor(200 + Math.random() * 200),
      MCV: (80 + Math.random() * 20).toFixed(1),
      MCH: (25 + Math.random() * 10).toFixed(1),
      MCHC: (30 + Math.random() * 5).toFixed(1)
    },
    'FBS': {
      'Fasting Blood Sugar': (85 + Math.random() * 30).toFixed(1)
    },
    'PPBS': {
      'Post Prandial Blood Sugar': (100 + Math.random() * 60).toFixed(1)
    },
    'HBA1C': {
      'HbA1c': (5.0 + Math.random() * 3).toFixed(1)
    },
    'LFT': {
      SGOT: (20 + Math.random() * 30).toFixed(1),
      SGPT: (15 + Math.random() * 40).toFixed(1),
      ALP: (60 + Math.random() * 60).toFixed(1),
      'Total Bilirubin': (0.5 + Math.random() * 1).toFixed(2),
      'Direct Bilirubin': (0.2 + Math.random() * 0.5).toFixed(2),
      'Indirect Bilirubin': (0.3 + Math.random() * 0.7).toFixed(2),
      'Total Protein': (6.5 + Math.random() * 2).toFixed(1),
      Albumin: (3.8 + Math.random() * 1.2).toFixed(1),
      Globulin: (2.5 + Math.random() * 1.5).toFixed(1),
      'A/G Ratio': ((3.8 + Math.random() * 1.2) / (2.5 + Math.random() * 1.5)).toFixed(2)
    },
    'KFT': {
      'Blood Urea': (15 + Math.random() * 15).toFixed(1),
      'Serum Creatinine': (0.7 + Math.random() * 0.8).toFixed(2),
      'Uric Acid': (4.0 + Math.random() * 4).toFixed(1),
      'Sodium': (138 + Math.random() * 8).toFixed(1),
      Potassium: (4.0 + Math.random() * 1.5).toFixed(1),
      Chloride: (100 + Math.random() * 8).toFixed(1),
      'Bicarbonate': (22 + Math.random() * 4).toFixed(1)
    },
    'LP': {
      'Total Cholesterol': (160 + Math.random() * 80).toFixed(1),
      'HDL Cholesterol': (35 + Math.random() * 25).toFixed(1),
      'LDL Cholesterol': (80 + Math.random() * 60).toFixed(1),
      'VLDL Cholesterol': (15 + Math.random() * 15).toFixed(1),
      Triglycerides: (80 + Math.random() * 120).toFixed(1)
    },
    'TSH': {
      'TSH': (1.5 + Math.random() * 3).toFixed(2)
    },
    'T3': {
      'T3': (120 + Math.random() * 60).toFixed(1)
    },
    'T4': {
      'T4': (7.5 + Math.random() * 6).toFixed(1)
    },
    'CRP': {
      'C-Reactive Protein': (Math.random() * 2).toFixed(2)
    },
    'TROP': {
      'Troponin I': (Math.random() * 0.05).toFixed(3)
    },
    'CKMB': {
      'CK-MB': Math.floor(5 + Math.random() * 15)
    }
  };
  
  return results[testCode] || { 'Result': 'Normal' };
}

// Generate lab orders
async function seedLabOrders() {
  console.log('🧪 Seeding Lab Orders...');
  
  const statuses = ['active', 'completed', 'cancelled'];
  const priorities = ['routine', 'urgent', 'stat'];
  
  for (let i = 0; i < 150; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const test = labTests[Math.floor(Math.random() * labTests.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // Create service request for lab test
    const serviceRequestQuery = `
      INSERT INTO emr.service_requests (
        tenant_id, patient_id, encounter_id, category, code, display, 
        status, priority, intent, ordered_by_id, created_by, notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id
    `;
    
    const encounterId = `encounter-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const notes = `Lab test ordered for ${test.name}. Priority: ${priority}`;
    
    const serviceResult = await query(serviceRequestQuery, [
      tenantId,
      patient.id,
      encounterId,
      'lab',
      test.code,
      test.name,
      status,
      priority,
      'order',
      doctor.id,
      doctor.id,
      notes
    ]);
    
    const serviceRequestId = serviceResult.rows[0].id;
    
    // Create lab result if status is completed
    if (status === 'completed') {
      const testResult = generateTestResult(test.code, patient.age, patient.gender);
      const resultJson = JSON.stringify(testResult);
      
      const criticalFlag = Math.random() < 0.1; // 10% critical results
      
      const resultQuery = `
        INSERT INTO emr.service_requests (
          tenant_id, patient_id, encounter_id, category, code, display,
          status, priority, intent, ordered_by_id, created_by, notes,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id
      `;
      
      await query(resultQuery, [
        tenantId,
        patient.id,
        encounterId,
        'lab',
        test.code + '_RESULT',
        `${test.name} - Result`,
        'completed',
        priority,
        'result',
        doctor.id,
        doctor.id,
        JSON.stringify({
          serviceRequestId: serviceRequestId,
          results: testResult,
          normalRange: test.normalRange,
          criticalFlag: criticalFlag,
          reportedBy: 'Dr. Lab Technician',
          reportedAt: new Date().toISOString()
        }),
        NOW(),
        NOW()
      ]);
    }
  }
  
  console.log('✅ Lab Orders Seeded Successfully');
}

// Generate lab statistics
async function seedLabStatistics() {
  console.log('📊 Seeding Lab Statistics...');
  
  const stats = [
    {
      category: 'Hematology',
      totalTests: 450,
      completedTests: 420,
      pendingTests: 25,
      criticalResults: 12,
      averageTurnaround: 45 // minutes
    },
    {
      category: 'Biochemistry',
      totalTests: 680,
      completedTests: 620,
      pendingTests: 55,
      criticalResults: 28,
      averageTurnaround: 60
    },
    {
      category: 'Microbiology',
      totalTests: 120,
      completedTests: 95,
      pendingTests: 20,
      criticalResults: 8,
      averageTurnaround: 180
    },
    {
      category: 'Serology',
      totalTests: 200,
      completedTests: 185,
      pendingTests: 15,
      criticalResults: 5,
      averageTurnaround: 90
    },
    {
      category: 'Hormones',
      totalTests: 150,
      completedTests: 140,
      pendingTests: 10,
      criticalResults: 3,
      averageTurnaround: 120
    },
    {
      category: 'Cardiac',
      totalTests: 80,
      completedTests: 75,
      pendingTests: 5,
      criticalResults: 15,
      averageTurnaround: 30
    }
  ];
  
  for (const stat of stats) {
    const query = `
      INSERT INTO emr.lab_statistics (
        tenant_id, category, total_tests, completed_tests, pending_tests,
        critical_results, average_turnaround_time, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (tenant_id, category) DO UPDATE SET
        total_tests = EXCLUDED.total_tests,
        completed_tests = EXCLUDED.completed_tests,
        pending_tests = EXCLUDED.pending_tests,
        critical_results = EXCLUDED.critical_results,
        average_turnaround_time = EXCLUDED.average_turnaround_time,
        updated_at = NOW()
    `;
    
    await query(query, [
      tenantId,
      stat.category,
      stat.totalTests,
      stat.completedTests,
      stat.pendingTests,
      stat.criticalResults,
      stat.averageTurnaround
    ]);
  }
  
  console.log('✅ Lab Statistics Seeded Successfully');
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Lab Module Data Seeding...');
    
    await seedLabOrders();
    await seedLabStatistics();
    
    console.log('🎉 Lab Module Data Seeding Complete!');
    console.log('📈 Generated:');
    console.log('   - 150+ lab orders across all categories');
    console.log('   - Realistic test results with normal ranges');
    console.log('   - Critical results for dashboard validation');
    console.log('   - Comprehensive lab statistics');
    console.log('   - Multiple test categories and priorities');
    
  } catch (error) {
    console.error('❌ Error seeding lab data:', error);
    process.exit(1);
  }
}

main();
