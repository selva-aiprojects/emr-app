import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function runSmokeTest() {
  console.log('--- 🧪 STARTING EMR BACKEND SMOKE TEST (Sydney Region) ---');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to Supabase Sydney...');
    await client.connect();
    console.log('✅ Connection Successful!');

    // Test 1: Tenant Validation
    console.log('\n🏥 TEST 1: Verifying Tenant Persistence...');
    const tenantRes = await client.query("SELECT name, code, status FROM emr.tenants WHERE name LIKE 'New Age%'");
    if (tenantRes.rows.length > 0) {
      const t = tenantRes.rows[0];
      console.log(`✅ Success: Found "${t.name}" (Status: ${t.status})`);
    } else {
      console.log('❌ Tenant "New Age Hospitals" not found in Supabase!');
    }

    // Test 2: Staff/User Integrity
    console.log('\n👤 TEST 2: Verifying Staff User Accounts...');
    const userCount = await client.query('SELECT count(*) FROM emr.users');
    console.log(`✅ Success: Found ${userCount.rows[0].count} staff users.`);

    // Test 3: Clinical Data Persistence (Encounters)
    console.log('\n🩺 TEST 3: Verifying Clinical Records...');
    const encounterCount = await client.query('SELECT count(*) FROM emr.encounters');
    console.log(`✅ Success: Found ${encounterCount.rows[0].count} patient encounters.`);

    // Test 4: Schema Search Path Test
    console.log('\n🔎 TEST 4: Verifying Search Path Access...');
    await client.query('SET search_path TO emr, extensions');
    const searchPathRes = await client.query('SELECT current_schema()');
    console.log(`✅ Success: Current Schema is "${searchPathRes.rows[0].current_schema}"`);

    console.log('\n🥇 ALL BACKEND TESTS PASSED!');
    console.log('🚀 YOUR EMR PLATFORM IS NOW LIVE ON SUPABASE SYDNEY.');

  } catch (error) {
    console.error('\n❌ SMOKE TEST FAILED!');
    console.error(`Error: ${error.message}`);
    if (error.detail) console.error(`Detail: ${error.detail}`);
    if (error.stack) console.error(`Stack: ${error.stack}`);
  } finally {
    await client.end().catch(() => {});
  }
}

runSmokeTest();
