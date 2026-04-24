import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pkg;
dotenv.config();

async function addRoles() {
    console.log('🏁 Standardizing roles and users...\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Get Tenant ID (Selva Care Hospital)
        const tenantRes = await client.query("SELECT id FROM emr.tenants WHERE code = 'SCH'");
        if (tenantRes.rows.length === 0) {
            console.log('❌ Tenant SCH not found. Run init_quick.sql first.');
            return;
        }
        const tenantId = tenantRes.rows[0].id;
        console.log(`🏥 Found Tenant ID for SCH: ${tenantId}`);

        const commonPassword = await bcrypt.hash('Staff@123', 10);

        const users = [
            { email: 'arun@sch.local', name: 'Arun Lab Tech', role: 'Lab' },
            { email: 'meera@sch.local', name: 'Meera Pharmacist', role: 'Pharmacy' },
            { email: 'lakshmi@sch.local', name: 'Lakshmi Support', role: 'Support Staff' }
        ];

        for (const u of users) {
            try {
                console.log(`👤 Processing ${u.role}: ${u.email}...`);
                const res = await client.query(`
            INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            ON CONFLICT (tenant_id, email) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name
            RETURNING id
          `, [tenantId, u.email, commonPassword, u.name, u.role]);
                console.log(`✅ Success: ${u.email} (ID: ${res.rows[0].id})`);
            } catch (userErr) {
                console.error(`❌ Error processing ${u.email}:`, userErr.message);
            }
        }

        console.log('\n✅ Roles and users standardized successfully!');
        console.log('   Users can login with password: Staff@123');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

addRoles();
