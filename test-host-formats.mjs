// Test different host formats for Supabase
import pg from 'pg';

const projectRef = 'vfmnjnwcorlqwxqdklfi';
const password = 'hms-app@2020';

const hostFormats = [
  // Standard format
  `db.${projectRef}.supabase.co`,
  
  // Alternative formats
  `${projectRef}.supabase.co`,
  `postgres.${projectRef}.supabase.co`,
  `${projectRef}.db.supabase.co`,
  
  // Pooler formats
  `${projectRef}.supabase.co:6543`,
  `db.${projectRef}.supabase.co:6543`,
  
  // Regional formats
  `db.${projectRef}.eu-west-1.supabase.co`,
  `${projectRef}.eu-west-1.supabase.co`,
];

async function testHostFormat(host, formatName) {
  const [hostname, port] = host.split(':');
  
  const connectionConfig = {
    host: hostname,
    port: port || 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: {
      rejectUnauthorized: false
    }
  };

  const client = new pg.Client(connectionConfig);

  try {
    console.log(`🔍 Testing ${formatName}: ${hostname}:${port || 5432}`);
    
    await client.connect();
    console.log(`✅ ${formatName} - Connected successfully!`);
    
    const result = await client.query('SELECT version()');
    console.log(`📊 Database: ${result.rows[0].version.substring(0, 50)}...`);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.log(`❌ ${formatName} - Failed: ${error.message}`);
    await client.end().catch(() => {});
    return false;
  }
}

async function testAllHostFormats() {
  console.log('🧪 Testing different Supabase host formats...\n');
  console.log(`📋 Project Reference: ${projectRef}`);
  console.log('');
  
  for (let i = 0; i < hostFormats.length; i++) {
    const host = hostFormats[i];
    const formatName = `Format ${i + 1}`;
    
    const success = await testHostFormat(host, formatName);
    
    if (success) {
      console.log(`\n🎉 SUCCESS! Host format works: ${host}`);
      return host;
    }
    
    console.log('---\n');
  }
  
  console.log('❌ All host formats failed.');
  console.log('💡 Possible issues:');
  console.log('   1. Project reference is incorrect');
  console.log('   2. Project is not active');
  console.log('   3. Database is not enabled');
  console.log('   4. Network connectivity issues');
  
  return null;
}

testAllHostFormats().catch(console.error);
