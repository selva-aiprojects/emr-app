
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';
const EMAIL = 'superadmin@emr.local';
const PASSWORD = 'Admin@123';

async function verifySuperadminReports() {
    try {
        console.log('Logging in as Superadmin...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: EMAIL,
            password: PASSWORD,
            tenantId: 'superadmin' // Actually superadmin doesn't need tenantId usually but the script uses one of the admins who is superadmin? 
            // Wait, I need a REAL superadmin.
            // checking seed script... 
            // The superadmin is usually created with role 'Superadmin'.
            // I'll try with the known superadmin credentials if I have them, or use the one I created.
        });

        // Actually, let's just use the known superadmin from previous context or seed.
        // I'll assume 'admin@ehs.local' might NOT be superadmin. 
        // Let's check the seed file to be sure, or just try to hit the endpoint with the token I get.

        let token = loginRes.data.token;
        if (!token) throw new Error('No token');

        // Check if role is Superadmin
        if (loginRes.data.user.role !== 'Superadmin') {
            console.log('User is not Superadmin. Searching for Superadmin...');
            // This is just a test script, I need valid coords.
            // I'll skip login if I don't have creds and just assume I can use specific creds.
            // Let's use the 'system' superadmin if possible.
            // user: superadmin@medflow.sys / SysAdmin@123 (Common default in my memory of this project?)
            // No, let's verify seed.
        }

        console.log('Fetching Superadmin Overview...');
        const res = await axios.get(`${API_URL}/superadmin/overview`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Superadmin Overview Data Keys:', Object.keys(res.data));
        console.log('Monthly Comparison:', JSON.stringify(res.data.monthlyComparison, null, 2));

        if (res.data.monthlyComparison && res.data.monthlyComparison.revenue.length > 0) {
            console.log('✅ Monthly Revenue Data Present');
        } else {
            console.error('❌ Monthly Revenue Data MISSING');
        }

    } catch (err) {
        console.error('Verification Failed:', err.message);
        if (err.response) console.log(err.response.data);
    }
}

verifySuperadminReports();
