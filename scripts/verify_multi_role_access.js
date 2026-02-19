
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';
const PASSWORD = 'Test@123';

const ROLES_TO_VERIFY = [
    { email: 'admin@ehs.local', role: 'Admin' },
    { email: 'doctor@ehs.local', role: 'Doctor' },
    { email: 'nurse@ehs.local', role: 'Nurse' },
    { email: 'lab@ehs.local', role: 'Lab' },
    { email: 'pharmacy@ehs.local', role: 'Pharmacy' },
    { email: 'support@ehs.local', role: 'Support Staff' },
    { email: 'front_office@ehs.local', role: 'Front Office' },
    { email: 'accounts@ehs.local', role: 'Billing' },
    { email: 'hr@ehs.local', role: 'HR' },
    { email: 'ops@ehs.local', role: 'Operations' },
    { email: 'insurance@ehs.local', role: 'Insurance' },
    { email: 'management@ehs.local', role: 'Management' }
];

async function verifyRole(user) {
    console.log(`\n--- VERIFYING ROLE: ${user.role} (${user.email}) ---`);
    try {
        // 1. Login
        console.log('   [1] Testing Login...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            tenantId: 'EHS',
            email: user.email,
            password: PASSWORD
        });

        if (!loginRes.data.token) {
            throw new Error('Login failed: No token returned');
        }
        const token = loginRes.data.token;
        const tenantId = loginRes.data.tenantId; // Correct path
        const userId = loginRes.data.user.id;
        console.log(`   ✅ Login Success (Tenant: ${tenantId})`);

        // 2. Bootstrap (Permissions & Data)
        console.log('   [2] Fetching Bootstrap Data...');
        const bootstrapRes = await axios.get(`${API_URL}/bootstrap?userId=${userId}&tenantId=${tenantId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const permissions = bootstrapRes.data.permissions || [];
        console.log(`   ✅ Bootstrap Success (Permissions found: ${permissions.length > 0})`);

        // 3. Reports Access
        console.log('   [3] Checking Reports Module Accessibility...');
        const reportsRes = await axios.get(`${API_URL}/reports/summary/${tenantId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✅ Reports Access: ${reportsRes.status === 200 ? 'OK' : 'FAILED'}`);

        return { role: user.role, status: 'PASS' };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        const details = error.response?.data ? JSON.stringify(error.response.data) : 'No detail';
        console.error(`   ❌ FAILED: ${errorMsg} (Detail: ${details})`);
        return { role: user.role, status: 'FAIL', error: errorMsg };
    }
}

async function runAudit() {
    console.log('🚀 Starting Multi-Tenant Institutional Integrity Audit...');
    const results = [];

    for (const user of ROLES_TO_VERIFY) {
        results.push(await verifyRole(user));
        // Add a small delay to prevent ECONNRESET
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n\n=================================================');
    console.log('AUDIT RESULTS SUMMARY');
    console.log('=================================================');
    results.forEach(r => {
        const icon = r.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${r.role.padEnd(20)}: ${r.status} ${r.error ? `(${r.error})` : ''}`);
    });
    console.log('=================================================');

    const failures = results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
        process.exit(1);
    }
    process.exit(0);
}

runAudit();
