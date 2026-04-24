/**
 * Integration Test Suite for EMR Application
 * Tests Auth, Patients, Appointments, Encounters, and Pharmacy Workflow
 */
// Node 24+ has global fetch

const BASE_URL = 'http://127.0.0.1:4005/api';
let token = '';
let tenantId = 'superadmin';
let patientId = '';
let encounterId = '';
let prescriptionId = '';
let inventoryItemId = '';

async function runTests() {
    console.log('🧪 Starting Integration Tests...\n');

    try {
        // 1. Health Check
        await testStep('Health Check', async () => {
            const res = await fetch(`${BASE_URL}/health`);
            const data = await res.json();
            if (!data.ok) throw new Error('Health check failed');
        });

        // 2. Superadmin Login
        await testStep('Superadmin Login', async () => {
            const res = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: 'superadmin',
                    email: 'superadmin@emr.local',
                    password: 'Admin@123'
                })
            });
            const data = await res.json();
            console.log('      DEBUG: Superadmin login response:', JSON.stringify(data));
            if (!data.token) {
                const err = new Error('Login failed');
                err.responseBody = JSON.stringify(data);
                throw err;
            }
            token = data.token;
        });

        // 3. Fetch Tenants
        await testStep('Fetch Tenants', async () => {
            const res = await fetch(`${BASE_URL}/tenants`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) {
                const err = new Error('Failed to fetch tenants');
                err.responseBody = JSON.stringify(data);
                throw err;
            }
            // Use the first real tenant for subsequent tests
            console.log('      DEBUG: Tenants data:', JSON.stringify(data));
            const realTenant = data.find(t => t.code !== 'superadmin');
            if (realTenant) {
                tenantId = realTenant.id;
                console.log('      DEBUG: Selected tenantId:', tenantId);
            } else {
                console.log('      DEBUG: No real tenant found, using:', tenantId);
            }
        });

        let providerId = '00000000-0000-0000-0000-000000000000';

        // 3b. Fetch Provider (Doctor)
        await testStep('Fetch Provider', async () => {
            const res = await fetch(`${BASE_URL}/users?tenantId=${tenantId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': tenantId
                }
            });
            const data = await res.json();
            console.log('      DEBUG: Users data:', JSON.stringify(data));
            const doctor = data.find(u => u.role === 'Doctor' || u.role === 'Admin');
            if (doctor) {
                providerId = doctor.id;
                console.log('      DEBUG: Selected providerId:', providerId);
            } else {
                console.log('      DEBUG: No doctor found, using placeholder:', providerId);
            }
        });

        // 4. Create Patient
        await testStep('Create Patient', async () => {
            const res = await fetch(`${BASE_URL}/patients`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    firstName: 'Integration',
                    lastName: 'Test Patient',
                    dob: '1990-01-01',
                    gender: 'Male',
                    phone: '1234567890'
                })
            });
            const data = await res.json();
            if (!data.id) {
                const err = new Error('Failed to create patient');
                err.responseBody = JSON.stringify(data);
                throw err;
            }
            patientId = data.id;
        });

        // 5. Create Encounter
        await testStep('Create Encounter', async () => {
            const res = await fetch(`${BASE_URL}/encounters`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    patientId,
                    providerId,
                    type: 'Out-patient',
                    complaint: 'Testing pharmacy workflow',
                    diagnosis: 'Healthy'
                })
            });
            const data = await res.json();
            if (!data.id) {
                const err = new Error('Failed to create encounter');
                err.responseBody = JSON.stringify(data);
                throw err;
            }
            encounterId = data.id;
        });

        // 6. Create Prescription (Pharmacy Workflow Start)
        await testStep('Create Prescription', async () => {
            const res = await fetch(`${BASE_URL}/prescriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    encounter_id: encounterId,
                    drug_name: 'Paracetamol 500mg',
                    dosage: '1 tablet',
                    frequency: 'Thrice a day',
                    duration: '3 days',
                    is_followup: true,
                    followup_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                    followup_notes: 'Check for fever reduction'
                })
            });
            const data = await res.json();
            if (!data.id) {
                const err = new Error('Failed to create prescription');
                err.responseBody = JSON.stringify(data);
                throw err;
            }
            prescriptionId = data.id;
            if (data.status !== 'Pending') throw new Error('Initial status should be Pending');
        });

        // 7. Check Inventory & Dispense
        await testStep('Dispense Prescription & Update Inventory', async () => {
            // First, find or create an inventory item for Paracetamol
            await fetch(`${BASE_URL}/inventory-items`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    code: 'PARA500',
                    name: 'Paracetamol 500mg',
                    category: 'Analgesics',
                    stock: 100,
                    reorder: 20
                })
            }).catch(() => null); // Might already exist

            let itemsRes = await fetch(`${BASE_URL}/inventory-items`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': tenantId
                }
            });
            let items = await itemsRes.json();
            let item = items.find(i => i.code === 'PARA500');
            if (!item) throw new Error('Failed to find/create inventory item');
            inventoryItemId = item.id;
            const initialStock = item.stock;

            // Dispense
            const dispenseRes = await fetch(`${BASE_URL}/prescriptions/${prescriptionId}/dispense`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    itemId: inventoryItemId,
                    quantity: 10
                })
            });
            const dispensedData = await dispenseRes.json();
            if (dispensedData.status !== 'Dispensed') {
                const err = new Error('Status should be Dispensed');
                err.responseBody = JSON.stringify(dispensedData);
                throw err;
            }

            // Verify Stock
            itemsRes = await fetch(`${BASE_URL}/inventory-items`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': tenantId
                }
            });
            items = await itemsRes.json();
            item = items.find(i => i.id === inventoryItemId);
            if (item.stock !== initialStock - 10) throw new Error(`Stock mismatch: expected ${initialStock - 10}, got ${item.stock}`);
        });

        let invoiceId = '';

        // 8. Billing Workflow (Create Invoice)
        await testStep('Create Invoice', async () => {
            const res = await fetch(`${BASE_URL}/invoices`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    patientId,
                    description: 'Consultation & Medicine',
                    amount: 500,
                    taxPercent: 5,
                    paymentMethod: 'Pending'
                })
            });
            const data = await res.json();
            if (!data.id) {
                const err = new Error('Failed to create invoice');
                err.responseBody = JSON.stringify(data);
                throw err;
            }
            invoiceId = data.id;
            if (data.status !== 'issued') throw new Error('Initial invoice status should be issued');
        });

        // 9. Billing Workflow (Pay Invoice)
        await testStep('Pay Invoice', async () => {
            const res = await fetch(`${BASE_URL}/invoices/${invoiceId}/pay`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    paymentMethod: 'Cash'
                })
            });
            const data = await res.json();
            if (data.status !== 'paid') {
                const err = new Error('Invoice status should be paid');
                err.responseBody = JSON.stringify(data);
                throw err;
            }
        });

        // 10. Lab Workflow (Add Test Report)
        await testStep('Add Lab Report', async () => {
            const res = await fetch(`${BASE_URL}/patients/${patientId}/clinical`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantId
                },
                body: JSON.stringify({
                    section: 'testReports',
                    payload: {
                        date: new Date().toISOString().split('T')[0],
                        testName: 'Complete Blood Count',
                        result: 'Normal',
                        notes: 'All parameters within range'
                    }
                })
            });
            const data = await res.json();

            // Verify it was added
            const report = data.medicalHistory.testReports.find(r => r.testName === 'Complete Blood Count');
            if (!report) {
                const err = new Error('Lab report not found in patient record');
                err.responseBody = JSON.stringify(data);
                throw err;
            }
        });

        console.log('\n✨ ALL TESTS PASSED! ✨');
    } catch (error) {
        console.error('\n❌ TEST FAILED:');
        console.error(error.message);
        process.exit(1);
    }
}

async function testStep(name, fn) {
    process.stdout.write(`🏃 Testing ${name}... `);
    try {
        await fn();
        console.log('✅');
    } catch (error) {
        console.log('❌');
        if (error.responseBody) {
            console.log('   Response Body:', error.responseBody);
        }
        throw error;
    }
}

runTests();
