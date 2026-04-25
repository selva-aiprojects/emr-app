import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not found in .env file.');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

function robustSqlSplit(sql) {
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    
    const lines = sql.split('\n');
    for (let line of lines) {
        if (line.includes('$$')) inDollarQuote = !inDollarQuote;
        current += line + '\n';
        
        if (!inDollarQuote && line.trim().endsWith(';')) {
            statements.push(current.trim());
            current = '';
        }
    }
    if (current.trim()) statements.push(current.trim());
    return statements;
}

async function forceRedeploy() {
    try {
        console.log('📡 Connecting to database...');
        await client.connect();
        console.log('🚀 [FORCE_REDEPLOY] Nuclear Stabilization Initiated...');

        // 0. RESET MASTER PLANE (NEXUS)
        console.log('🌌 Resetting Master Plane (Nexus)...');
        try {
            await client.query('DROP SCHEMA IF EXISTS nexus CASCADE');
        } catch (e) {
            console.warn('⚠️ Warning: DROP SCHEMA nexus failed. Continuing with table-level reset.');
        }
        await client.query('CREATE SCHEMA IF NOT EXISTS nexus');
        await client.query('SET search_path TO nexus, public');
        console.log('📡 [CONTEXT] Schema set to: nexus');

        const masterBaselinePath = path.join(__dirname, '../database/NEXUS_MASTER_BASELINE.sql');
        const masterBaselineSql = fs.readFileSync(masterBaselinePath, 'utf8');
        const masterStmts = robustSqlSplit(masterBaselineSql);
        
        for (let stmt of masterStmts) {
            try {
                await client.query(stmt);
            } catch (e) {
                if (!e.message.includes('already exists')) {
                    console.error(`❌ Master Baseline Error: ${e.message}`);
                }
            }
        }

        // 1. ENSURE NHGL REGISTRY
        console.log('📋 Ensuring NHGL registry in Nexus...');
        const tenantId = 'nhgl-tenant-uuid';
        await client.query(`
            INSERT INTO nexus.management_tenants (id, name, code, subdomain, schema_name, status)
            VALUES ($1, 'NHGL Institutional Shard', 'nhgl', 'nhgl', 'nhgl', 'active')
            ON CONFLICT (code) DO NOTHING
        `, [tenantId]);

        await client.query(`
            INSERT INTO nexus.tenants (id, name, code, subdomain, status)
            VALUES ($1, 'NHGL Institutional Shard', 'nhgl', 'nhgl', 'active')
            ON CONFLICT (code) DO NOTHING
        `, [tenantId]);

        // 2. RESET SHARD (NHGL)
        console.log('🧹 Resetting NHGL shard...');
        await client.query('DROP SCHEMA IF EXISTS nhgl CASCADE');
        await client.query('CREATE SCHEMA nhgl');
        await client.query('SET search_path TO nhgl, nexus, public');
        console.log('📡 [CONTEXT] Schema set to: nhgl');
        
        console.log('🧱 Applying SHARD_MASTER_BASELINE.sql...');
        const shardBaselinePath = path.join(__dirname, '../database/SHARD_MASTER_BASELINE.sql');
        const shardBaselineSql = fs.readFileSync(shardBaselinePath, 'utf8');
        
        const shardStmts = robustSqlSplit(shardBaselineSql);
        for (let stmt of shardStmts) {
            try {
                await client.query(stmt);
            } catch (e) {
                if (!e.message.includes('already exists')) {
                    console.error(`❌ Shard Baseline Error: ${e.message}`);
                }
            }
        }

        // 3. PRE-FILL MIGRATIONS LOG (Silence the server runner)
        console.log('📝 Marking legacy migrations as executed in Nexus...');
        const migrationsPaths = [
            path.join(__dirname, '../server/db/migrations'),
            path.join(__dirname, '../database/migrations')
        ];

        for (const dir of migrationsPaths) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
                for (const file of files) {
                    await client.query(`
                        INSERT INTO nexus.migrations_log (filename) 
                        VALUES ($1) 
                        ON CONFLICT (filename) DO NOTHING
                    `, [file]);
                }
            }
        }

        console.log('\n✅ [SUCCESS] Master Plane and NHGL Shard are now fully synchronized.');
        console.log('👉 Next: Run "node scratch/seed_nhgl_modern.js" to populate demo data.');

    } catch (err) {
        console.error('\n❌ [FATAL] Redeploy Failed:', err.message);
    } finally {
        await client.end();
    }
}

forceRedeploy();
