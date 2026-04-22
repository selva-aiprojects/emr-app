import fs from 'fs';
import path from 'path';
import { query } from '../server/db/connection.js';

async function forceMigration() {
    try {
        const migrationFile = 'd:\\Training\\working\\emr-app\\server\\db\\migrations\\14_complete_institutional_masters.sql';
        console.log(`🚀 Force-applying migration: ${path.basename(migrationFile)}`);
        
        let sql = fs.readFileSync(migrationFile, 'utf8');
        
        // Fix 1: Remove the problematic user insertion
        sql = sql.replace(/INSERT INTO emr\.users[\s\S]*?ON CONFLICT[\s\S]*?;/gi, '-- Skipped non-compliant user insert');
        
        // Fix 2: Convert VARCHAR IDs to UUID to match existing schema
        // Replace 'VARCHAR(255) PRIMARY KEY' with 'UUID PRIMARY KEY'
        sql = sql.replace(/VARCHAR\(255\) PRIMARY KEY/gi, 'UUID PRIMARY KEY');
        // Replace tenant_id, patient_id, etc. definitions
        sql = sql.replace(/tenant_id VARCHAR\(255\)/gi, 'tenant_id UUID');
        sql = sql.replace(/patient_id VARCHAR\(255\)/gi, 'patient_id UUID');
        sql = sql.replace(/doctor_id VARCHAR\(255\)/gi, 'doctor_id UUID');
        sql = sql.replace(/ward_id VARCHAR\(255\)/gi, 'ward_id UUID');
        sql = sql.replace(/ambulance_id VARCHAR\(255\)/gi, 'ambulance_id UUID');
        sql = sql.replace(/document_id VARCHAR\(255\)/gi, 'document_id UUID');
        sql = sql.replace(/actor_id VARCHAR\(255\)/gi, 'actor_id UUID');
        sql = sql.replace(/encounter_id VARCHAR\(255\)/gi, 'encounter_id UUID');
        
        // Fix 3: Remove the '::text' cast from defaults
        sql = sql.replace(/::text/gi, '');
        
        console.log('⚡ Executing Type-Corrected migration...');
        await query(sql);
        
        // Record it in the log
        await query("INSERT INTO emr.migrations_log (filename) VALUES ($1)", [path.basename(migrationFile)]);
        
        console.log('✅ Migration applied and logged successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

forceMigration();
