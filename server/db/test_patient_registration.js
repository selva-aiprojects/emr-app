import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

const PORT = 4001;
const BASE_URL = `http://localhost:${PORT}/api`;
const NHGL_TENANT_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';

async function testRegistration() {
  console.log('--- STARTING AUTHENTICATED API REGISTRATION TEST ---');
  
  try {
    // 1. LOGIN to get Token
    console.log('Attempting login...');
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: NHGL_TENANT_ID,
        email: 'admin@nhgl.local',
        password: 'Admin@123'
      })
    });

    if (!loginRes.ok) {
      const errData = await loginRes.json();
      throw new Error(`Login failed: ${JSON.stringify(errData)}`);
    }

    const { token } = await loginRes.json();
    console.log('✅ LOGIN SUCCESS. Token acquired.');

    // 2. REGISTER Patient
    const testPatient = {
      tenantId: NHGL_TENANT_ID,
      firstName: 'Direct',
      lastName: 'Test-' + Date.now(),
      dob: '1990-01-01',
      gender: 'Male',
      phone: '1234567890',
      email: `direct-${Date.now()}@test.local`,
      address: 'Internal Test Suite',
      bloodGroup: 'O+',
      medicalHistory: { allergies: ['None'] }
    };

    console.log('POSTing registration to:', `${BASE_URL}/patients`);
    const regRes = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': NHGL_TENANT_ID
      },
      body: JSON.stringify(testPatient)
    });

    const status = regRes.status;
    console.log('Response Status:', status);

    const data = await regRes.json();
    if (regRes.ok) {
      console.log('✅ REGISTRATION SUCCESS:', data);
    } else {
      console.error('❌ REGISTRATION FAILED:', data);
    }

  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err.message);
  }
}

testRegistration();
