// Test Final Pooler Connection String
import pg from 'pg';

const DATABASE_URL = "postgres://postgres:REDACTED@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true";

async function testPoolerConnection() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Testing pooler connection with pgbouncer=true...');
    console.log('📋 Connection string:');
    console.log(`   ${DATABASE_URL}`);
    console.log('');
    
    await client.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test basic query
    const versionResult = await client.query('SELECT version() as version, current_database() as database, current_user as user');
    console.log('📊 Database info:');
    console.log(`   Version: ${versionResult.rows[0].version.substring(0, 50)}...`);
    console.log(`   Database: ${versionResult.rows[0].database}`);
    console.log(`   User: ${versionResult.rows[0].user}`);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
      LIMIT 10
    `);
    
    console.log('📋 Existing tables (first 10):');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found - ready for fresh migration');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Test connection info
    const infoResult = await client.query(`
      SELECT 
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        current_setting('timezone') as timezone,
        version() as full_version
    `);
    
    console.log('🌐 Server info:');
    console.log(`   IP: ${infoResult.rows[0].server_ip}`);
    console.log(`   Port: ${infoResult.rows[0].server_port}`);
    console.log(`   Timezone: ${infoResult.rows[0].timezone}`);
    
    // Test table creation permissions
    try {
      await client.query('CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())');
      console.log('✅ Table creation test passed');
      
      await client.query('DROP TABLE IF EXISTS test_connection');
      console.log('✅ Table deletion test passed');
    } catch (error) {
      console.log('⚠️ Table creation test failed:', error.message);
    }
    
    console.log('✅ Connection test completed successfully!');
    console.log('');
    console.log('🎉 READY FOR DEPLOYMENT!');
    console.log('📋 This connection string works perfectly!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - check if project is active');
    } else if (error.code === '28P01') {
      console.log('💡 Authentication failed - check password');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Host not found - check hostname');
    }
    
    return false;
    
  } finally {
    await client.end();
    console.log('🔌 Disconnected from Supabase');
  }
}

testPoolerConnection().catch(console.error);
