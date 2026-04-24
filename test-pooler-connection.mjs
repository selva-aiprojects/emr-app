// Test Supabase Pooler Connection
import pg from 'pg';

// Try both direct and pooler connections
const connectionStrings = [
  "postgresql://postgres:hms-app%402020@vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres",
  "postgresql://postgres:hms-app%402020@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres",
  "postgresql://postgres.hms-app%402020@vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres",
  "postgresql://postgres.hms-app%402020@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres"
];

async function testConnection(connectionString, testName) {
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`🔍 Testing ${testName}...`);
    console.log(`📋 ${connectionString}`);
    
    await client.connect();
    console.log(`✅ ${testName} - Connected successfully!`);
    
    const result = await client.query('SELECT version() as version, current_database() as database');
    console.log(`📊 Database: ${result.rows[0].database}`);
    console.log(`📊 Version: ${result.rows[0].version.substring(0, 50)}...`);
    
    await client.end();
    return connectionString;
    
  } catch (error) {
    console.log(`❌ ${testName} - Failed: ${error.message}`);
    await client.end().catch(() => {});
    return null;
  }
}

async function testAllConnections() {
  console.log('🧪 Testing different Supabase connection formats...');
  console.log('===============================================');
  console.log('');
  
  const testNames = [
    'Direct Connection (Port 5432)',
    'Pooler Connection (Port 6543)',
    'Direct Connection (User.Password format)',
    'Pooler Connection (User.Password format)'
  ];
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const result = await testConnection(connectionStrings[i], testNames[i]);
    
    if (result) {
      console.log('');
      console.log('🎉 SUCCESS! Working connection found:');
      console.log(result);
      console.log('');
      console.log('🔧 Use this connection string in your configuration!');
      return result;
    }
    
    console.log('---');
    console.log('');
  }
  
  console.log('❌ All connection attempts failed.');
  console.log('');
  console.log('🔧 Troubleshooting steps:');
  console.log('1. Check if Supabase project is active');
  console.log('2. Verify password is correct');
  console.log('3. Check if database is enabled');
  console.log('4. Try accessing Supabase dashboard directly');
  
  return null;
}

testAllConnections().catch(console.error);
