import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const projectRef = "vfmnjnwcorlqwxqdklfi";
const password = "hms-app@2020";
const encodedPassword = encodeURIComponent(password);

const regions = [
  "ap-south-1",      // Mumbai
  "ap-southeast-1",  // Singapore
  "ap-southeast-2",  // Sydney
  "ap-northeast-1",  // Tokyo
  "us-east-1",       // Virginia
  "us-east-2",       // Ohio
  "us-west-1",       // California
  "us-west-2",       // Oregon
  "eu-west-1",       // Ireland
  "eu-west-2",       // London
  "eu-central-1",    // Frankfurt
  "ca-central-1",    // Canada
  "sa-east-1"        // Sao Paulo
];

async function scanAllRegions() {
  console.log(`🔍 SCANNIG 13 SUPABASE REGIONS FOR PROJECT: ${projectRef}...\n`);

  const tests = regions.map(async (region) => {
    const url = `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });

    try {
      await client.connect();
      console.log(`✅ MATCH FOUND: Region ${region} is the winner!`);
      console.log(`🎯 URL: ${url}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      // Intentionally silent for failures
    } finally {
        await client.end().catch(() => {});
    }
  });

  await Promise.all(tests);
  console.log('\n❌ ALL COMMON REGIONS SCANNED. Project not found on Pooler.');
  console.log('This might be an older project not on the AWS-0 pooler infrastructure.');
}

scanAllRegions();
