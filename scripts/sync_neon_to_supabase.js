import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceUrl = process.env.DATABASE_URL;
const targetUrl = "postgresql://postgres.vfmnjnwcorlqwxqdklfi:hms-app%402020@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
const certPath = path.join(__dirname, '..', 'database', 'prod-ca-2021.crt');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Default JSON structures to fill missing data
const DEFAULT_FEATURES = { inventory: true, telehealth: false };
const DEFAULT_THEME = { accent: "#f57f17", primary: "#0f5a6e" };

async function migrate() {
  console.log('🚀 INITIALIZING FINAL MIGRATION (Sydney Region Pooler)...');
  
  let sslOptions = { rejectUnauthorized: false };
  if (fs.existsSync(certPath)) {
    sslOptions.ca = fs.readFileSync(certPath).toString();
  }

  const source = new Client({ connectionString: sourceUrl, ssl: sslOptions });
  const target = new Client({ connectionString: targetUrl, ssl: sslOptions });

  try {
    await source.connect();
    console.log('✅ Connected to Source (Neon)');
    
    await target.connect();
    console.log('✅ Connected to Target (Supabase)');

    // 🚀 BYPASS CONSTRAINTS: Use replication role to ignore FKs during sync
    await target.query("SET session_replication_role = 'replica'");
    console.log('🔓 Constraints bypassed (session_replication_role = replica)');

    // Ensure schema exists
    await target.query('CREATE SCHEMA IF NOT EXISTS emr');
    console.log('✅ Schema "emr" is ready.');

    /**
     * TABLE ORDER MATTERS FOR FOREIGN KEYS:
     * 1. Tenants
     * 2. Users / Roles
     * 3. Patients
     * 4. Everything else
     */
    const tablesRes = await source.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'emr' AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('spatial_ref_sys')
      ORDER BY 
        CASE 
          WHEN table_name = 'tenants' THEN 10
          WHEN table_name = 'roles' THEN 20
          WHEN table_name = 'users' THEN 30
          WHEN table_name = 'departments' THEN 40
          WHEN table_name = 'wards' THEN 50
          WHEN table_name = 'patients' THEN 60
          WHEN table_name = 'encounters' THEN 70
          WHEN table_name = 'beds' THEN 80
          WHEN table_name = 'employees' THEN 90
          WHEN table_name = 'inventory_categories' THEN 100
          WHEN table_name = 'inventory_items' THEN 110
          ELSE 999
        END ASC, table_name ASC
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`📋 Found ${tables.length} tables to migrate.`);

    for (const table of tables) {
      console.log(`🚚 Syncing emr.${table}...`);
      const dataRes = await source.query(`SELECT * FROM emr.${table}`);
      
      if (dataRes.rows.length === 0) {
        console.log(`   - Table is empty.`);
        continue;
      }

      await target.query(`TRUNCATE TABLE emr.${table} CASCADE`);
      
      const columns = Object.keys(dataRes.rows[0]);
      const colList = columns.map(c => `"${c}"`).join(', ');
      
      for (const row of dataRes.rows) {
        // ✨ DATA REPAIR LOGIC ✨
        if (table === 'tenants') {
          if (!row.features) row.features = DEFAULT_FEATURES;
          if (!row.theme) row.theme = DEFAULT_THEME;
        }

        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        // 🛡️ DATA TRANSFORM: Map values correctly for Postgres types
        const values = columns.map(col => {
          let val = row[col];
          const field = dataRes.fields.find(f => f.name === col);
          const dataTypeID = field ? field.dataTypeID : null;

          /**
           * Postgres Type OIDs:
           * 114: json, 3802: jsonb
           * Native Arrays OIDs: 1009 (text[]), 3807 (jsonb[]), 1015 (varchar[]), 1007 (int4[])
           */
          const isJsonType = dataTypeID === 114 || dataTypeID === 3802;
          
          if (val !== null && typeof val === 'object') {
            // Postgres client handles Dates and Buffers directly
            if (val instanceof Date || Buffer.isBuffer(val)) {
              return val;
            }

            // For JSON/JSONB types, we MUST stringify
            if (isJsonType) {
              return JSON.stringify(val);
            }
            
            // For Native Arrays, we MUST NOT stringify (pg handles JS arrays)
            if (Array.isArray(val)) {
              return val;
            }

            // Fallback for other objects
            return JSON.stringify(val);
          }
          
          // Safety fallback for empty strings in JSONB columns
          if (isJsonType && (val === '' || val === null)) {
            return '{}'; 
          }
          
          return val;
        });

        try {
          await target.query(`INSERT INTO emr.${table} (${colList}) VALUES (${placeholders})`, values);
        } catch (insertError) {
          console.error(`\n❌ Error inserting row in ${table}:`);
          console.error(`Row Data: ${JSON.stringify(row)}`);
          console.error(`Processed Values: ${JSON.stringify(values)}`);
          throw insertError;
        }
      }
      console.log(`   ✅ Migrated ${dataRes.rows.length} rows.`);
    }

    console.log('\n✨ MIGRATION COMPLETED SUCCESSFULLY! ✨');
    
  } catch (error) {
    console.error('\n❌ Migration Failed!');
    console.error(`Error: ${error.message}`);
    if (error.detail) console.error(`Detail: ${error.detail}`);
    if (error.where) console.error(`Where: ${error.where}`);
    if (error.stack) console.error(`Stack: ${error.stack}`);
  } finally {
    if (target) {
      await target.query("SET session_replication_role = 'origin'").catch(() => {});
      await target.end().catch(() => {});
    }
    if (source) await source.end().catch(() => {});
  }
}

migrate();
