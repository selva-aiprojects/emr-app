import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getAvailableColumns(schema, table) {
  try {
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
    `, [schema, table]);
    return res.rows.map(r => r.column_name);
  } catch (e) {
    return [];
  }
}

async function safeInsert(schema, table, data) {
  const columns = await getAvailableColumns(schema, table);
  if (columns.length === 0) {
    console.warn(`⚠️  Table ${schema}.${table} not found or inaccessible. Skipping.`);
    return null;
  }

  const validData = {};
  for (const [key, value] of Object.entries(data)) {
    if (columns.includes(key)) {
      validData[key] = value;
    }
  }

  const keys = Object.keys(validData);
  const values = Object.values(validData);
  if (keys.length === 0) return null;

  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  let sql = `INSERT INTO "${schema}"."${table}" (${keys.join(', ')}) VALUES (${placeholders})`;
  
  // Idempotency: Handle common unique constraints
  if (table === 'patients') {
    sql += ` ON CONFLICT (tenant_id, mrn) DO ${columns.includes('updated_at') ? 'UPDATE SET updated_at = NOW()' : 'NOTHING'}`;
  } else if (table === 'invoices') {
    sql += ` ON CONFLICT (tenant_id, invoice_number) DO ${columns.includes('updated_at') ? 'UPDATE SET updated_at = NOW()' : 'NOTHING'}`;
  }
  
  sql += ` RETURNING *`;
  
  try {
    const res = await client.query(sql, values);
    return res.rows[0];
  } catch (e) {
    if (e.code === '23505') { // Unique constraint
       const lookup = table === 'patients' ? 'mrn' : 'invoice_number';
       if (data[lookup]) {
         const res = await client.query(`SELECT * FROM "${schema}"."${table}" WHERE tenant_id = $1 AND ${lookup} = $2`, [data.tenant_id, data[lookup]]);
         return res.rows[0];
       }
    }
    console.error(`❌ Error inserting into ${schema}.${table}:`, e.message);
    return null;
  }
}

async function seed() {
  try {
    await client.connect();
    console.log('🔗 Connected to DB for Resilient NHGL Workflow Seeding...');

    const tenantRes = await client.query("SELECT id FROM emr.management_tenants WHERE code = 'NHGL'");
    if (tenantRes.rows.length === 0) throw new Error('NHGL tenant record not found in registry!');
    const tenantId = tenantRes.rows[0].id;
    const schema = 'nhgl';

    await client.query(`SET search_path TO "${schema}", emr, public`);
    console.log(`✅ Targeted NHGL Shard: ${tenantId}`);

    // --- WORKFLOW 1: OPD JOURNEY (Amit Sharma) ---
    console.log('\n🏥 Seeding OPD Workflow (Registration -> Appointment -> Consultation -> Lab -> Pharmacy -> Billing)...');
    
    // 1. Patient
    const pt = await safeInsert(schema, 'patients', {
      tenant_id: tenantId,
      mrn: 'NHGL-PT-OPD-101',
      first_name: 'Amit',
      last_name: 'Sharma',
      gender: 'Male',
      date_of_birth: '1985-06-15',
      phone: '9876543210',
      email: 'amit.sharma@example.com'
    });
    const patientId = pt?.id;

    if (patientId) {
      // 2. Appointment
      const appt = await safeInsert(schema, 'appointments', {
        tenant_id: tenantId,
        patient_id: patientId,
        scheduled_start: new Date(),
        scheduled_end: new Date(Date.now() + 3600000),
        status: 'completed',
        reason: 'General Consultation'
      });

      // 3. Encounter (OPD)
      const enc = await safeInsert(schema, 'encounters', {
        tenant_id: tenantId,
        patient_id: patientId,
        encounter_type: 'OPD',
        visit_date: new Date(),
        status: 'closed',
        chief_complaint: 'Frequent Headaches & Fatigue',
        diagnosis: 'Mild Hypertension'
      });
      const encounterId = enc?.id;

      if (encounterId) {
        // 4. Lab Order (via emr.service_requests if nhgl.service_requests fails)
        console.log('   - Seeding Lab Order...');
        await safeInsert(schema, 'service_requests', {
          tenant_id: tenantId,
          patient_id: patientId,
          encounter_id: encounterId,
          category: 'lab',
          code: 'LIPID-001',
          display: 'Lipid Profile',
          status: 'completed',
          notes: JSON.stringify({ results: "Cholesterol: 210, HDL: 45", criticalFlag: false })
        });

        // 5. Pharmacy (Prescription)
        console.log('   - Seeding Pharmacy...');
        await safeInsert(schema, 'prescriptions', {
          tenant_id: tenantId,
          patient_id: patientId,
          encounter_id: encounterId,
          drug_name: 'Amlodipine',
          dosage: '5mg',
          frequency: '1-0-0',
          duration: '30 days',
          status: 'Dispensed'
        });

        // 6. Insurance & Billing
        console.log('   - Seeding Insurance Billing...');
        // Try local shard first, then emr registry
        let provider = await safeInsert(schema, 'insurance_providers', {
          tenant_id: tenantId,
          name: 'Star Health Insurance',
          type: 'INSURANCE',
          provider_type: 'INSURANCE',
          is_active: true
        }) || await safeInsert('emr', 'insurance_providers', {
          tenant_id: tenantId,
          name: 'Star Health Insurance',
          type: 'INSURANCE',
          provider_type: 'INSURANCE',
          is_active: true
        });

        const invoice = await safeInsert(schema, 'invoices', {
          tenant_id: tenantId,
          patient_id: patientId,
          invoice_number: 'INV-NHGL-OPD-1001',
          subtotal: 2400,
          tax: 100,
          total: 2500,
          paid: 500, // Co-pay
          status: 'partially_paid',
          description: 'Consultation & Lab Services'
        });

        if (invoice && provider) {
          await safeInsert(schema, 'insurance_claims', {
            tenant_id: tenantId,
            invoice_id: invoice.id,
            provider_id: provider.id,
            claim_number: 'CLM-OPD-7788',
            requested_amount: 2000,
            status: 'pending'
          });
        }
      }
    }

    // --- WORKFLOW 2: IPD JOURNEY (Suresh Raina) ---
    console.log('\n🏨 Seeding IPD Workflow (Admission -> Surgical Observation -> Discharge -> Insurance)...');
    
    const pt2 = await safeInsert(schema, 'patients', {
      tenant_id: tenantId,
      mrn: 'NHGL-PT-IPD-202',
      first_name: 'Suresh',
      last_name: 'Raina',
      gender: 'Male',
      date_of_birth: '1970-11-20',
      phone: '9888877777',
      email: 'suresh.raina@example.com'
    });
    const patientId2 = pt2?.id;

    if (patientId2) {
      // 1. Bed occupied
      const bed = await safeInsert(schema, 'beds', {
        tenant_id: tenantId,
        room_no: 'ICU-B1',
        bed_number: 'ICU-B1', // Handle both aliases
        status: 'occupied'
      });

      // 2. Admission Encounter
      const enc2 = await safeInsert(schema, 'encounters', {
        tenant_id: tenantId,
        patient_id: patientId2,
        encounter_type: 'IPD',
        visit_date: new Date(Date.now() - 3 * 24 * 3600000), // 3 days ago
        status: 'closed',
        chief_complaint: 'Abdominal Pain',
        diagnosis: 'Acute Appendicitis'
      });
      const encounterId2 = enc2?.id;

      if (encounterId2) {
        await safeInsert(schema, 'admissions', {
          tenant_id: tenantId,
          patient_id: patientId2,
          encounter_id: encounterId2,
          ward: 'ICU',
          bed_no: 'B1',
          bed_number: 'B1',
          status: 'discharged'
        });

        // 3. High Value Invoice
        const inv2 = await safeInsert(schema, 'invoices', {
          tenant_id: tenantId,
          patient_id: patientId2,
          invoice_number: 'INV-NHGL-IPD-2002',
          subtotal: 70000,
          tax: 5000,
          total: 75000,
          paid: 0,
          status: 'unpaid',
          description: 'Appendectomy & ICU Stay'
        });

        if (inv2) {
          const provider2 = await safeInsert(schema, 'insurance_providers', {
            tenant_id: tenantId,
            name: 'HDFC ERGO',
            type: 'INSURANCE',
            provider_type: 'INSURANCE',
            is_active: true
          }) || await safeInsert('emr', 'insurance_providers', {
            tenant_id: tenantId,
            name: 'HDFC ERGO',
            type: 'INSURANCE',
            provider_type: 'INSURANCE',
            is_active: true
          });

          if (provider2) {
            await safeInsert(schema, 'insurance_claims', {
              tenant_id: tenantId,
              invoice_id: inv2.id,
              provider_id: provider2.id,
              claim_number: 'CLM-IPD-9900',
              requested_amount: 75000,
              status: 'approved'
            });
          }
        }
        
        // Final: Release Bed status
        if (bed) {
          await client.query(`UPDATE "${schema}"."beds" SET status = 'available' WHERE id = $1`, [bed.id]);
        }
      }
    }

    console.log('\n✅ Resilient Seeding Complete! NHGL dashboard should now show OPD/IPD flows.');
  } catch (err) {
    console.error('\n❌ Resilient Seeding Failed:', err);
  } finally {
    await client.end();
  }
}

seed();
