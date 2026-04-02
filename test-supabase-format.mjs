// Test different Supabase connection formats
import pg from 'pg';

// Different possible formats to test
const connectionFormats = [
  // Format 1: Standard Supabase format
  "postgresql://postgres:hms-app@2020@db.vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres",
  
  // Format 2: With quotes removed
  "postgresql://postgres:hms-app@2020@db.vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres",
  
  // Format 3: URL encoded
  "postgresql://postgres:hms-app%402020@db.vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres",
  
  // Format 4: Different host format
  "postgresql://postgres:hms-app@2020@vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres",
];

async function testConnectionFormat(connectionString, formatName) {
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`🔍 Testing ${formatName}...`);
    
    await client.connect();
    console.log(`✅ ${formatName} - Connected successfully!`);
    
    const result = await client.query('SELECT version()');
    console.log(`📊 Database version: ${result.rows[0].version.substring(0, 50)}...`);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.log(`❌ ${formatName} - Failed: ${error.message}`);
    await client.end().catch(() => {});
    return false;
  }
}

async function testAllFormats() {
  console.log('🧪 Testing different Supabase connection formats...\n');
  
  for (let i = 0; i < connectionFormats.length; i++) {
    const formatName = `Format ${i + 1}`;
    const connectionString = connectionFormats[i];
    
    const success = await testConnectionFormat(connectionString, formatName);
    
    if (success) {
      console.log(`\n🎉 SUCCESS! Use this connection string:`);
      console.log(connectionString);
      return connectionString;
    }
    
    console.log('---\n');
  }
  
  console.log('❌ All connection formats failed.');
  console.log('💡 Please check:');
  console.log('   1. Supabase project is active');
  console.log('   2. Project reference is correct');
  console.log('   3. Password is correct');
  console.log('   4. Network connectivity');
  
  return null;
}

testAllFormats().catch(console.error);
