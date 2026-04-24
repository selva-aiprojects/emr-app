// Test Clean Connection with Pooler
import pg from 'pg';

// Use the actual password from earlier: hms-app@2020
const DATABASE_URL = "postgres://postgres:hms-app@2020@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true";

async function testCleanConnection() {
  // Create fresh client instance
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Testing clean pooler connection...');
    console.log('📋 Connection string:');
    console.log(`   postgres://postgres:***@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true`);
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
        current_setting('timezone') as timezone
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
    console.log('📋 Working connection string:');
    console.log(DATABASE_URL);
    
    return DATABASE_URL;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('❌ Error code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - check if project is active');
    } else if (error.code === '28P01') {
      console.log('💡 Authentication failed - check password');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Host not found - check hostname');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Connection timed out - network issue');
    }
    
    return null;
    
  } finally {
    await client.end();
    console.log('🔌 Disconnected from Supabase');
  }
}

testCleanConnection().catch(console.error);
