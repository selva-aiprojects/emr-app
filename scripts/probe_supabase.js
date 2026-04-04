import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const projectRef = "vfmnjnwcorlqwxqdklfi";
const password = "hms-app@2020";
const encodedPassword = encodeURIComponent(password);

const configs = [
  {
    name: "Standard Direct (db.*.supabase.co:5432)",
    url: `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`
  },
  {
    name: "Dashboard Pooler (project-ref.supabase.co:6543)",
    url: `postgresql://postgres:${encodedPassword}@${projectRef}.supabase.co:6543/postgres`
  },
  {
    name: "Global Pooler IPv4 (aws-0-ap-south-1.pooler.supabase.com:6543)",
    url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: "Global Pooler Session (aws-0-ap-south-1.pooler.supabase.com:5432)",
    url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`
  }
];

async function findWorkingConnection() {
  console.log('🔍 PROBING SUPABASE CONNECTION METHODS...\n');

  for (const config of configs) {
    console.log(`📡 testing: ${config.name}...`);
    const client = new Client({ 
      connectionString: config.url, 
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000 
    });

    try {
      await client.connect();
      console.log(`✅ SUCCESS: ${config.name} is working!\n`);
      
      const res = await client.query('SELECT version()');
      console.log(`📊 DB Version: ${res.rows[0].version.split(',')[0]}\n`);
      
      console.log('🎯 USE THIS URL IN YOUR .env:');
      console.log(config.url);
      
      await client.end();
      process.exit(0);
    } catch (err) {
      console.error(`❌ FAILED: ${err.message}`);
    } finally {
      await client.end().catch(() => {});
    }
  }

  console.log('\n❌ ALL CONNECTION METHODS FAILED.');
  console.log('Possible causes:');
  console.log('1. Your project is currently Paused (check Supabase Dashboard).');
  console.log('2. Outbound ports 5432/6543 are blocked by your firewall.');
  console.log('3. The project reference "vfmnjnwcorlqwxqdklfi" is for a different region.');
}

findWorkingConnection();
