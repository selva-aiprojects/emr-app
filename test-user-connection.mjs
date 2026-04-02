// Test User Provided Supabase Connection Details
import pg from 'pg';

// User provided connection details
const connectionConfig = {
  host: 'db.vfmnjnwcorlqwxqdklfi.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'hms-app@2020',
  ssl: {
    rejectUnauthorized: false
  }
};

async function testUserConnection() {
  const client = new pg.Client(connectionConfig);

  try {
    console.log('🔍 Testing user provided connection details...');
    console.log('📋 Connection details:');
    console.log(`   Host: ${connectionConfig.host}`);
    console.log(`   Port: ${connectionConfig.port}`);
    console.log(`   Database: ${connectionConfig.database}`);
    console.log(`   User: ${connectionConfig.user}`);
    console.log(`   Password: ${connectionConfig.password}`);
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
    
    console.log('✅ Connection test completed successfully!');
    
    // Create the correct connection string
    const connectionString = `postgresql://postgres:'hms-app@2020'@db.vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres`;
    console.log('');
    console.log('🎯 Connection string for configuration:');
    console.log(connectionString);
    
    // Test if we can create a table (to test permissions)
    try {
      await client.query('CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())');
      console.log('✅ Table creation test passed');
      
      await client.query('DROP TABLE IF EXISTS test_connection');
      console.log('✅ Table deletion test passed');
    } catch (error) {
      console.log('⚠️ Table creation test failed:', error.message);
    }
    
    return connectionString;
    
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
    
    throw error;
    
  } finally {
    await client.end();
    console.log('🔌 Disconnected from Supabase');
  }
}

testUserConnection().catch(console.error);
