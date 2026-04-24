const axios = require('axios');

async function debugSuperadmin() {
    const API_URL = 'http://localhost:4000/api';

    try {
        console.log('--- Logging in as Superadmin ---');
        const loginRes = await axios.post(`${API_URL}/login`, {
            tenantId: 'superadmin',
            email: 'superadmin@emr.local',
            password: 'superadmin123'
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful');
        console.log('Role:', loginRes.data.role);

        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('\n--- Fetching Superadmin Overview ---');
        try {
            const overviewRes = await axios.get(`${API_URL}/superadmin/overview`, { headers });
            console.log('✅ Overview fetched');
            console.log('Data Shape:', JSON.stringify(overviewRes.data, (k, v) => k === 'tenants' ? `[Array(${v.length})]` : v, 2));

            if (!overviewRes.data.totals) {
                console.error('❌ CRITICAL: overview.totals is missing!');
            } else {
                const { tenants, users, patients, appointments } = overviewRes.data.totals;
                console.log(`Totals: Tenants=${tenants}, Users=${users}, Patients=${patients}, Appointments=${appointments}`);
            }
        } catch (e) {
            console.error('❌ Overview fetch failed:', e.response?.status, e.response?.data || e.message);
        }

        console.log('\n--- Fetching Kill Switches ---');
        try {
            const ksRes = await axios.get(`${API_URL}/admin/kill-switches`, { headers });
            console.log('✅ Kill switches fetched');
            console.log('Kill Switches:', ksRes.data);
        } catch (e) {
            console.error('❌ Kill switches fetch failed:', e.response?.status, e.response?.data || e.message);
        }

        console.log('\n--- Fetching Tenants List ---');
        try {
            const tenantsRes = await axios.get(`${API_URL}/tenants`, { headers });
            console.log('✅ Tenants list fetched. Count:', tenantsRes.data.length);
        } catch (e) {
            console.error('❌ Tenants fetch failed:', e.response?.status, e.response?.data || e.message);
        }

    } catch (error) {
        console.error('❌ Login failed:', error.response?.status, error.response?.data || error.message);
    }
}

debugSuperadmin();
