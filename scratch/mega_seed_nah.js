import { query } from '../server/db/connection.js';

const NAH_ID = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed';
const NAH_CODE = 'NAH';
const NAH_SCHEMA = 'nah';

async function megaSeedNAH() {
    try {
        console.log('🚀 Starting Robust NAH Seeding...');
        
        // 1. Ensure Tenant Record in Management Plane
        console.log('Checking management_tenants...');
        const checkMgmt = await query("SELECT id FROM nexus.management_tenants WHERE id::text = $1 OR UPPER(code) = 'NAH'", [NAH_ID]);
        
        if (checkMgmt.rows.length === 0) {
            console.log('NAH not found in management_tenants. Creating...');
            await query(`
                INSERT INTO nexus.management_tenants (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier)
                VALUES ($1, 'New Age Hospital', 'NAH', 'nah', 'nah', 'active', 'admin@newage.hospital', 'Professional')
            `, [NAH_ID]);
        } else {
            console.log('NAH found in management_tenants.');
        }

        // 2. Ensure Tenant Record in Legacy Table
        console.log('Checking legacy tenants table...');
        const checkLegacy = await query("SELECT id FROM nexus.tenants WHERE id::text = $1 OR UPPER(code) = 'NAH'", [NAH_ID]);
        if (checkLegacy.rows.length === 0) {
            console.log('NAH not found in legacy tenants. Creating...');
            await query(`
                INSERT INTO nexus.tenants (id, name, code, subdomain, theme, features, subscription_tier, status)
                VALUES ($1, 'New Age Hospital', 'NAH', 'newagehospital', '{}', '{}', 'Professional', 'active')
            `, [NAH_ID]);
        }

        // 3. Ensure Master Data Tables in Shard
        console.log(`Ensuring tables exist in shard "${NAH_SCHEMA}"...`);
        await query(`CREATE SCHEMA IF NOT EXISTS "${NAH_SCHEMA}"`);
        
        const ddl = `
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."departments" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                code VARCHAR(64) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."specialities" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."diseases" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                code VARCHAR(64) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."treatments" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                code VARCHAR(64) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                base_cost NUMERIC(12,2) DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."patients" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                mrn VARCHAR(64) UNIQUE,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                date_of_birth DATE,
                gender VARCHAR(32),
                phone VARCHAR(32),
                email VARCHAR(255),
                address TEXT,
                is_archived BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."encounters" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                patient_id VARCHAR(255) NOT NULL,
                provider_id VARCHAR(255),
                status VARCHAR(32) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."service_requests" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                patient_id VARCHAR(255) NOT NULL,
                encounter_id VARCHAR(255),
                requester_id VARCHAR(255),
                category VARCHAR(64) DEFAULT 'lab',
                code VARCHAR(64),
                display VARCHAR(255),
                status VARCHAR(32) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."opd_tokens" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                patient_id VARCHAR(255),
                token_number INTEGER NOT NULL,
                full_token VARCHAR(32),
                status VARCHAR(32) DEFAULT 'waiting',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS "${NAH_SCHEMA}"."invoices" (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                tenant_id VARCHAR(255) NOT NULL,
                patient_id VARCHAR(255) NOT NULL,
                invoice_number VARCHAR(64) UNIQUE,
                total_amount NUMERIC(12,2) DEFAULT 0,
                status VARCHAR(32) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        
        // Execute DDL statement by statement
        for (const stmt of ddl.trim().split(';')) {
            if (stmt.trim()) await query(stmt);
        }

        // 4. Seed Data
        console.log('Seeding clinical masters...');
        
        const depts = [
            ['OPD-01', 'Outpatient Department'],
            ['IPD-01', 'Inpatient Department'],
            ['ER-01', 'Emergency & Trauma'],
            ['PHARM-01', 'Pharmacy'],
            ['LAB-01', 'Laboratory']
        ];
        for (const [c, n] of depts) {
            const exists = await query(`SELECT id FROM "${NAH_SCHEMA}"."departments" WHERE code = $1`, [c]);
            if (exists.rows.length === 0) {
                await query(`INSERT INTO "${NAH_SCHEMA}"."departments" (tenant_id, code, name) VALUES ($1, $2, $3)`, [NAH_ID, c, n]);
            }
        }

        const specs = [
            ['Cardiology', 'Heart and vascular care'],
            ['Neurology', 'Brain and nervous system'],
            ['Pediatrics', 'Child and adolescent care']
        ];
        for (const [n, d] of specs) {
            const exists = await query(`SELECT id FROM "${NAH_SCHEMA}"."specialities" WHERE name = $1`, [n]);
            if (exists.rows.length === 0) {
                await query(`INSERT INTO "${NAH_SCHEMA}"."specialities" (tenant_id, name, description) VALUES ($1, $2, $3)`, [NAH_ID, n, d]);
            }
        }

        const diseases = [
            ['ICD10-I10', 'Essential (primary) hypertension', 'Circulatory'],
            ['ICD10-E11', 'Type 2 diabetes mellitus', 'Endocrine']
        ];
        for (const [c, n, cat] of diseases) {
            const exists = await query(`SELECT id FROM "${NAH_SCHEMA}"."diseases" WHERE code = $1`, [c]);
            if (exists.rows.length === 0) {
                await query(`INSERT INTO "${NAH_SCHEMA}"."diseases" (tenant_id, code, name, category) VALUES ($1, $2, $3, $4)`, [NAH_ID, c, n, cat]);
            }
        }

        const treats = [
            ['PROC-001', 'General Consultation', 'Consultation', 500],
            ['PROC-002', 'Specialist Consultation', 'Consultation', 1000]
        ];
        for (const [c, n, cat, cost] of treats) {
            const exists = await query(`SELECT id FROM "${NAH_SCHEMA}"."treatments" WHERE code = $1`, [c]);
            if (exists.rows.length === 0) {
                await query(`INSERT INTO "${NAH_SCHEMA}"."treatments" (tenant_id, code, name, category, base_cost) VALUES ($1, $2, $3, $4, $5)`, [NAH_ID, c, n, cat, cost]);
            }
        }

        console.log('✅ Mega Seed for NAH completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Mega Seed failed:', err.message);
        process.exit(1);
    }
}

megaSeedNAH();
