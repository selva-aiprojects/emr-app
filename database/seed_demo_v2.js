import { query } from '../server/db/connection.js';

async function generateUUID(schema, table, uniqueField, value) {
    try {
        const res = await query(`SELECT id FROM ${schema}.${table} WHERE ${uniqueField} = $1`, [value]);
        if (res.rows.length > 0) return res.rows[0].id;
    } catch(e) {}
    return require('crypto').randomUUID();
}

async function runSeeder() {
  console.log("🚀 Starting V2 Demo Data Seed Generation...");
  try {
    const args = process.argv.slice(2);
    const targetTenantFilter = args[0] ? args[0].toLowerCase() : null;

    let queryStr = 'SELECT id, code, schema_name FROM emr.management_tenants WHERE status = $1';
    let queryArgs = ['active'];

    const tenantsRes = await query(queryStr, queryArgs);
    let tenants = tenantsRes.rows;

    if (targetTenantFilter) {
        tenants = tenants.filter(t => t.code.toLowerCase().includes(targetTenantFilter) || t.schema_name?.toLowerCase().includes(targetTenantFilter) || (t.name && t.name.toLowerCase().includes(targetTenantFilter)));
    }

    if (tenants.length === 0) {
        console.log(`❌ No active tenants found matching "${targetTenantFilter || ''}".`);
        console.log("Here are the currently available ACTIVE tenants:");
        tenantsRes.rows.forEach(t => console.log(`  - Code: ${t.code} | Schema: ${t.schema_name} | ID: ${t.id}`));
        process.exit(0);
    }

    for (const tenant of tenants) {
        const schema = tenant.schema_name || tenant.code.toLowerCase();
        console.log(`\n===========================================`);
        console.log(`Seeding Demo Data for ${tenant.code} (${schema})`);
        console.log(`===========================================\n`);

        const tId = tenant.id;
        
        // 1. Staff (emr.users but mapped to tenant)
        console.log("-> Seeding Staff...");
        const roles = [
            { email: `admin@${schema}.com`, name: 'Dr. Sarah Admin', role: 'Admin', isDr: false },
            { email: `doctor1@${schema}.com`, name: 'Dr. Ryan Cardiologist', role: 'Doctor', isDr: true },
            { email: `doctor2@${schema}.com`, name: 'Dr. Emily Ortho', role: 'Doctor', isDr: true },
            { email: `nurse1@${schema}.com`, name: 'Nurse Joy', role: 'Nurse', isDr: false },
            { email: `lab1@${schema}.com`, name: 'Tech Walter', role: 'Lab', isDr: false },
            { email: `billing1@${schema}.com`, name: 'John Accounts', role: 'Accounts', isDr: false },
        ];

        let doctorIds = [];
        for(const r of roles) {
            await query(`
                INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
                VALUES ($1, $2, '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC', $3, $4, true)
                ON CONFLICT (tenant_id, email) DO UPDATE SET name = EXCLUDED.name
            `, [tId, r.email, r.name, r.role]);
            
            const u = await query(`SELECT id FROM emr.users WHERE tenant_id = $1 AND email = $2`, [tId, r.email]);
            if(r.isDr) doctorIds.push(u.rows[0].id);
        }

        // 2. Patients in Shard Schema
        console.log("-> Seeding Patients...");
        await query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
        
        // Ensure core tables exist inside schema
        await query(`CREATE TABLE IF NOT EXISTS ${schema}.patients (LIKE emr.patients INCLUDING ALL)`);
        await query(`CREATE TABLE IF NOT EXISTS ${schema}.appointments (LIKE emr.appointments INCLUDING ALL)`);
        await query(`CREATE TABLE IF NOT EXISTS ${schema}.encounters (LIKE emr.encounters INCLUDING ALL)`);
        await query(`CREATE TABLE IF NOT EXISTS ${schema}.invoices (LIKE emr.invoices INCLUDING ALL)`);
        await query(`CREATE TABLE IF NOT EXISTS ${schema}.beds (id uuid DEFAULT gen_random_uuid(), tenant_id uuid, status varchar(20), room_no varchar(20))`);
        await query(`CREATE TABLE IF NOT EXISTS ${schema}.service_requests (id uuid DEFAULT gen_random_uuid(), tenant_id uuid, category varchar(20), status varchar(20), notes text, created_at timestamptz DEFAULT now())`);

        let patientIds = [];
        const fnames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
        const lnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        
        for(let i=1; i<=25; i++) {
            const fname = fnames[i%10];
            const lname = lnames[(i+5)%10];
            const mrn = `${tenant.code}-PT-${i.toString().padStart(4, '0')}`;
            
            try {
                await query(`
                    INSERT INTO ${schema}.patients (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, created_at)
                    VALUES ($1, $2, $3, $4, '1980-01-01', 'Male', '555-0000', $5, CURRENT_DATE - INTERVAL '${i} days')
                    ON CONFLICT(tenant_id, mrn) DO NOTHING
                `, [tId, mrn, fname, lname, `${fname.toLowerCase()}@example.com`]);
            } catch(e) {
                // If unique constraint or missing col, fallback simple
            }
            
            const pRes = await query(`SELECT id FROM ${schema}.patients WHERE tenant_id = $1 AND mrn = $2`, [tId, mrn]);
            if(pRes.rows.length > 0) patientIds.push(pRes.rows[0].id);
        }

        // 3. Appointments & Encounters (Patient Journey)
        console.log("-> Seeding Journeys (Appointments, Encounters, Invoices)...");
        for(let i=0; i<patientIds.length; i++) {
            const pId = patientIds[i];
            const dId = doctorIds[i % doctorIds.length];
            
            // Appointment scheduled today
            await query(`
                INSERT INTO ${schema}.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, created_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 hour', 'completed', 'Routine Checkup', CURRENT_TIMESTAMP)
            `, [tId, pId, dId]);

            // Encounter generated
            await query(`
                INSERT INTO ${schema}.encounters (tenant_id, patient_id, provider_id, encounter_type, visit_date, chief_complaint, diagnosis, notes, status, created_at)
                VALUES ($1, $2, $3, 'OPD', CURRENT_DATE, 'Fever', 'Viral Infection', 'Rest for 3 days', 'closed', CURRENT_TIMESTAMP)
            `, [tId, pId, dId]);

            // Invoice for Revenue Metrics
            const invNum = `${tenant.code}-INV-${Math.floor(Math.random()*10000)}`;
            try {
                await query(`
                    INSERT INTO ${schema}.invoices (tenant_id, patient_id, invoice_number, description, subtotal, tax, total, paid, status, created_at)
                    VALUES ($1, $2, $3, 'Consultation Fee', 1000, 50, 1050, 1050, 'paid', CURRENT_TIMESTAMP)
                `, [tId, pId, invNum]);
            } catch(e) {}
        }

        // 4. Operational Tables (Beds, Service Requests)
        console.log("-> Seeding Operational Data (Beds, Labs)...");
        try {
           for(let b=1; b<=15; b++) {
              await query(`INSERT INTO ${schema}.beds (tenant_id, room_no, status) VALUES ($1, $2, $3)`, [tId, `Room ${b}`, b%3==0?'occupied':'available']);
           }
           for(let l=1; l<=5; l++) {
              const flag = l%2===0 ? '{"criticalFlag":"true"}' : '{}';
              await query(`INSERT INTO ${schema}.service_requests (tenant_id, category, status, notes) VALUES ($1, 'lab', 'pending', $2)`, [tId, flag]);
           }
        } catch(e) {
           console.log("Operation table skipped (might not exist yet):", e.message.substring(0, 50));
        }
    }
    
    console.log("✅ Seed Data Generation Completed Successfully!");
    process.exit(0);

  } catch(error) {
    console.error("❌ Fatal Seeding Error:", error);
    process.exit(1);
  }
}

runSeeder();
