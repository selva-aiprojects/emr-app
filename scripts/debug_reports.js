
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';
const EMAIL = 'admin@ehs.local';
const PASSWORD = 'Test@123';
const TENANT_ID = 'EHS'; // Code, not UUID yet

async function test() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: EMAIL,
            password: PASSWORD,
            tenantId: TENANT_ID
        });
        const { token, user } = loginRes.data;
        const tenantUuid = user.tenantId;
        console.log(`Login success. Token: ${token.substring(0, 20)}...`);
        console.log(`Tenant UUID: ${tenantUuid}`);

        console.log(`Requesting reports summary for ${tenantUuid}...`);
        try {
            const res = await axios.get(`${API_URL}/reports/summary/${tenantUuid}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Success! Status: ${res.status}`);
            console.log(res.data);
        } catch (err) {
            console.log(`Report Failed: ${err.message}`);
            if (err.response) {
                console.log(`Status: ${err.response.status}`);
                console.log(`Data:`, err.response.data);
            }
        }

    } catch (err) {
        console.error('Login Failed:', err.message);
        if (err.response) console.log(err.response.data);
    }
}

test();
