import { query } from '../server/db/connection.js';

const NAH_TENANT_CODE = 'nah';
const SCHEMA = 'nah';

const MASTER_DEPARTMENTS = [
  { code: 'OPD-01', name: 'Outpatient Department' },
  { code: 'IPD-01', name: 'Inpatient Department' },
  { code: 'ER-01', name: 'Emergency & Trauma' },
  { code: 'PHARM-01', name: 'Pharmacy' },
  { code: 'LAB-01', name: 'Laboratory' }
];

const MASTER_SPECIALITIES = [
  { name: 'Cardiology', description: 'Heart and vascular care' },
  { name: 'Neurology', description: 'Brain and nervous system' },
  { name: 'Pediatrics', description: 'Child and adolescent care' },
  { name: 'Orthopedics', description: 'Musculoskeletal system' },
  { name: 'General Medicine', description: 'Primary and internal care' },
  { name: 'Dermatology', description: 'Skin and related tissue care' },
  { name: 'Gynecology', description: 'Female reproductive health' },
  { name: 'Oncology', description: 'Cancer diagnosis and treatment' },
  { name: 'Psychiatry', description: 'Mental health and behavior' }
];

const MASTER_DISEASES = [
  { code: 'ICD10-I10', name: 'Essential (primary) hypertension', category: 'Circulatory' },
  { code: 'ICD10-E11', name: 'Type 2 diabetes mellitus', category: 'Endocrine' },
  { code: 'ICD10-J45', name: 'Asthma', category: 'Respiratory' },
  { code: 'ICD10-M54', name: 'Dorsalgia (Back pain)', category: 'Musculoskeletal' },
  { code: 'ICD10-N39', name: 'Urinary tract infection', category: 'Genitourinary' }
];

const MASTER_TREATMENTS = [
  { code: 'PROC-001', name: 'General Consultation', category: 'Consultation', cost: 500 },
  { code: 'PROC-002', name: 'Specialist Consultation', category: 'Consultation', cost: 1000 },
  { code: 'PROC-003', name: 'Blood Glucose Test', category: 'Laboratory', cost: 150 },
  { code: 'PROC-004', name: 'Complete Blood Count (CBC)', category: 'Laboratory', cost: 450 },
  { code: 'PROC-005', name: 'X-Ray Chest', category: 'Radiology', cost: 800 },
  { code: 'PROC-006', name: 'ECG/EKG', category: 'Cardiology', cost: 600 }
];

async function seedNah() {
    try {
        console.log('Seeding NAH tenant with clinical master data...');
        
        const tenantRes = await query("SELECT id FROM management_tenants WHERE UPPER(code) = 'NAH'");
        if (tenantRes.rows.length === 0) {
            console.error('NAH tenant not found in management_tenants');
            return;
        }
        const tenantId = tenantRes.rows[0].id;

        // Ensure tables exist in schema
        console.log('Ensuring tables exist...');
        await query(`
            CREATE TABLE IF NOT EXISTS "${SCHEMA}"."specialities" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(tenant_id, name)
            );
            CREATE TABLE IF NOT EXISTS "${SCHEMA}"."diseases" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                code VARCHAR(64) NOT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(tenant_id, code)
            );
            CREATE TABLE IF NOT EXISTS "${SCHEMA}"."treatments" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                code VARCHAR(64) NOT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                base_cost NUMERIC(12,2) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(tenant_id, code)
            );
        `);

        for (const dept of MASTER_DEPARTMENTS) {
            await query(`INSERT INTO "${SCHEMA}"."departments" (tenant_id, code, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [tenantId, dept.code, dept.name]);
        }
        for (const spec of MASTER_SPECIALITIES) {
            await query(`INSERT INTO "${SCHEMA}"."specialities" (tenant_id, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [tenantId, spec.name, spec.description]);
        }
        for (const d of MASTER_DISEASES) {
            await query(`INSERT INTO "${SCHEMA}"."diseases" (tenant_id, code, name, category) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [tenantId, d.code, d.name, d.category]);
        }
        for (const t of MASTER_TREATMENTS) {
            await query(`INSERT INTO "${SCHEMA}"."treatments" (tenant_id, code, name, category, base_cost) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`, [tenantId, t.code, t.name, t.category, t.cost]);
        }

        console.log('✅ NAH seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seedNah();
