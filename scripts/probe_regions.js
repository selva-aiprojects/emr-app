import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const projectRef = "vfmnjnwcorlqwxqdklfi";
const password = "hms-app@2020";
const encodedPassword = encodeURIComponent(password);

const regions = ["us-east-1", "ap-southeast-1", "eu-central-1", "ap-south-1"];

async function probeRegions() {
  console.log('🔍 PROBING MULTIPLE SUPABASE REGIONS...');

  for (const region of regions) {
    const url = `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    console.log(`📡 Testing Region: ${region}...`);
    
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 3000 });

    try {
      await client.connect();
      console.log(`✅ SUCCESS IN REGION: ${region}`);
      console.log(`🎯 USE THIS URL: ${url}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`   ❌ ${err.message}`);
    } finally {
      await client.end().catch(() => {});
    }
  }

  console.log('\n❌ ALL REGIONS FAILED.');
  console.log('Please confirm your Supabase Region and Project ID from the Dashboard.');
}

probeRegions();
