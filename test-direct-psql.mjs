// Test Direct PostgreSQL Connection (like psql command)
import pg from 'pg';

// Connection parameters matching your psql command
// psql -h db.vfmnjnwcorlqwxqdklfi.supabase.co -p 5432 -d postgres -U postgres

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

async function testDirectConnection() {
  const client = new pg.Client(connectionConfig);

  try {
    console.log('🔍 Testing direct PostgreSQL connection...');
    console.log('📋 Connection details:');
    console.log(`   Host: ${connectionConfig.host}`);
    console.log(`   Port: ${connectionConfig.port}`);
    console.log(`   Database: ${connectionConfig.database}`);
    console.log(`   User: ${connectionConfig.user}`);
    console.log(`   Password: [hidden]`);
    console.log('');
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test basic query
    const versionResult = await client.query('SELECT version() as version, current_database() as database');
    console.log('📊 Database version:', versionResult.rows[0].version.substring(0, 50) + '...');
    console.log('🗄️ Current database:', versionResult.rows[0].database);
    
    // Test current user
    const userResult = await client.query('SELECT current_user as user, current_database() as db');
    console.log('👤 Current user:', userResult.rows[0].user);
    
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
    
    console.log('✅ Direct connection test completed successfully!');
    
    // Create the correct connection string
    const connectionString = `postgresql://postgres:'hms-app@2020'@db.vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres`;
    console.log('');
    console.log('🎯 Correct connection string for your configuration:');
    console.log(connectionString);
    
    return connectionString;
    
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - possible issues:');
      console.log('   1. Supabase project is not active');
      console.log('   2. Host name is incorrect');
      console.log('   3. Port is blocked');
    } else if (error.code === '28P01') {
      console.log('💡 Authentication failed - check password');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Host not found - check hostname');
    }
    
    console.log('');
    console.log('🔧 Try these troubleshooting steps:');
    console.log('1. Test with psql directly:');
    console.log(`   psql -h ${connectionConfig.host} -p ${connectionConfig.port} -d ${connectionConfig.database} -U ${connectionConfig.user}`);
    console.log('2. Check if you can ping the host:');
    console.log(`   ping ${connectionConfig.host}`);
    console.log('3. Verify Supabase project status');
    
    throw error;
    
  } finally {
    await client.end();
    console.log('🔌 Disconnected from PostgreSQL');
  }
}

testDirectConnection().catch(console.error);
