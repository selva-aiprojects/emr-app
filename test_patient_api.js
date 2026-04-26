// Test patient API endpoint
import { api } from './client/src/api.js';

async function testPatientAPI() {
  console.log('=== TESTING PATIENT API ===\n');
  
  try {
    // Test 1: Check if we can access the patients endpoint
    console.log('1. Testing patients endpoint access...');
    const patients = await api.getPatients();
    console.log('✅ Patients endpoint accessible:', patients.length, 'patients');
    
    // Test 2: Try to create a test patient
    console.log('\n2. Testing patient creation...');
    const testPatient = await api.createPatient({
      firstName: 'Test',
      lastName: 'Patient',
      dob: '1990-01-01',
      gender: 'Male',
      phone: '1234567890',
      email: 'test@example.com',
      address: '123 Test St'
    });
    
    console.log('✅ Patient creation successful:');
    console.log('  ID:', testPatient.id);
    console.log('  MRN:', testPatient.mrn);
    console.log('  Name:', `${testPatient.firstName} ${testPatient.lastName}`);
    
    // Test 3: Check if the created patient appears in the list
    console.log('\n3. Testing patient retrieval...');
    const updatedPatients = await api.getPatients();
    const foundPatient = updatedPatients.find(p => p.id === testPatient.id);
    
    if (foundPatient) {
      console.log('✅ Created patient found in list');
    } else {
      console.log('❌ Created patient not found in list');
    }
    
  } catch (error) {
    console.error('❌ Patient API test failed:', error.message);
    console.log('Error details:', error.stack);
  }
}

testPatientAPI();
