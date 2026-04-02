// Basic PostgreSQL Connection Test
import pg from 'pg';

const DATABASE_URL = "postgresql://postgres:'hms-app@2020'@db.vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres";

async function testBasicConnection() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 Testing basic PostgreSQL connection...');
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test basic query
    const result = await client.query('SELECT version() as version, NOW() as current_time');
    console.log('📊 Database version:', result.rows[0].version);
    console.log('🕐 Current time:', result.rows[0].current_time);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found - ready for fresh migration');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    console.log('✅ Basic connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Basic connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Possible issues:');
      console.log('   1. Supabase project is not active');
      console.log('   2. Connection URL is incorrect');
      console.log('   3. Network connectivity issues');
    } else if (error.code === '28P01') {
      console.log('💡 Authentication failed - check password');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist');
    }
    
    console.log('🔗 Connection URL being used:');
    console.log(`   ${DATABASE_URL}`);
    
  } finally {
    await client.end();
    console.log('🔌 Disconnected from PostgreSQL');
  }
}

testBasicConnection().catch(console.error);
