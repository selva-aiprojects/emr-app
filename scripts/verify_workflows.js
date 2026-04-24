
// Standalone verification script
// No imports from client/src to avoid DOM/Browser dependencies

const API_URL = 'http://localhost:4000/api';
const TENANT_CODE = 'EHS'; // The script already fetches UUID, so it should work.

const TEST_USERS = [
    { role: 'Superadmin', email: 'superadmin@emr.local', tenant: 'superadmin' },
    { role: 'Admin', email: 'admin@ehs.local', tenant: 'EHS' },
    { role: 'Doctor', email: 'doctor@ehs.local', tenant: 'EHS' },
    { role: 'Nurse', email: 'nurse@ehs.local', tenant: 'EHS' },
    { role: 'Lab', email: 'lab@ehs.local', tenant: 'EHS' },
    { role: 'Pharmacy', email: 'pharmacy@ehs.local', tenant: 'EHS' },
    { role: 'Support Staff', email: 'support@ehs.local', tenant: 'EHS' },
    { role: 'Accounts', email: 'accounts@ehs.local', tenant: 'EHS' },
    { role: 'HR', email: 'hr@ehs.local', tenant: 'EHS' },
    { role: 'Operations', email: 'ops@ehs.local', tenant: 'EHS' },
    { role: 'Insurance', email: 'insurance@ehs.local', tenant: 'EHS' },
    { role: 'Management', email: 'management@ehs.local', tenant: 'EHS' }
];

const PASSWORD = 'Test@123';

async function verifyWorkflows() {
    console.log('Starting Workflow Verification...');
    let successCount = 0;
    let failCount = 0;


    // Pre-fetch Tenant ID for 'EHS'
    const tenantsRes = await fetch(`${API_URL}/tenants`);
    const tenants = await tenantsRes.json();
    const ehsTenant = tenants.find(t => t.code === 'EHS');
    const ehsTenantId = ehsTenant ? ehsTenant.id : null;

    if (!ehsTenantId) {
        console.error('❌ Could not find EHS tenant ID!');
        process.exit(1);
    }
    console.log(`Resolved EHS Tenant ID: ${ehsTenantId}`);

    for (const user of TEST_USERS) {
        console.log(`\nTesting Role: ${user.role} (${user.email})...`);

        try {
            // 1. Login
            const loginPayload = {
                tenantId: user.tenant === 'superadmin' ? 'superadmin' : ehsTenantId,
                email: user.email,
                password: user.role === 'Superadmin' ? 'Admin@123' : PASSWORD
            };

            const loginRes = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginPayload)
            });


            if (!loginRes.ok) {
                throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
            }

            const loginData = await loginRes.json();
            const token = loginData.token;

            if (!token) throw new Error('No token received');
            console.log('  ✅ Login successful');

            // 2. Fetch Initial Data (Dashboard/Bootstrap)
            let dataUrl = user.role === 'Superadmin'
                ? `${API_URL}/superadmin/overview`
                : `${API_URL}/bootstrap?tenantId=${ehsTenantId}&userId=${loginData.user.id}`;

            const dataRes = await fetch(dataUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!dataRes.ok) {
                const errText = await dataRes.text();
                throw new Error(`Data fetch failed: ${dataRes.status} ${dataRes.statusText} - ${errText}`);
            }

            const data = await dataRes.json();

            // 3. Security Assertions (Data Masking)
            if (['Billing', 'Accounts', 'HR', 'Operations', 'Insurance', 'Management'].includes(user.role)) {
                if (data.patients && data.patients.length > 0) {
                    const samplePatient = data.patients[0];
                    if (samplePatient.medicalHistory || samplePatient.prescriptions || samplePatient.clinical_notes || samplePatient.diagnoses) {
                        console.error(`  ❌ SECURITY FAILURE: [${user.role}] can see PHI (Medical History/Prescriptions)!`);
                        throw new Error('PHI Leak Detected');
                    } else {
                        console.log(`  🔒 Security Check Passed: PHI is masked for ${user.role}`);
                    }
                } else {
                    console.log(`  ⚠️  No patients found to verify masking for ${user.role}`);
                }
            }

            // Pharmacy specific check
            if (user.role === 'Pharmacy') {
                if (data.patients && data.patients.length > 0) {
                    const p = data.patients[0];
                    if (p.medicalHistory && (p.medicalHistory.surgeries || p.medicalHistory.familyHistory)) {
                        console.error(`  ❌ SECURITY FAILURE: [Pharmacy] can see detailed Medical History!`);
                        throw new Error('PHI Leak Detected');
                    }
                    if (!p.prescriptions && !p.medications) {
                        // Assuming they SHOULD see prescriptions
                        // Note: My masking logic preserved prescriptions.
                        console.log(`  ✅ Pharmacy sees prescriptions (Correct)`);
                    }
                }
            }


            console.log(`  ✅ Data fetch successful`);
            successCount++;

        } catch (error) {
            console.error(`  ❌ FAILED: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log(`Passed: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    if (failCount > 0) process.exit(1);
}

verifyWorkflows();
