// Test Supabase Connection with Timeout Parameter
import pg from "pg";
const { Client } = pg;

const connString = "postgres://postgres:hms-app%402020@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30";

const client = new Client({
  connectionString: connString,
  ssl: {
    rejectUnauthorized: false, // Supabase commonly works with this for quick connectivity tests
  },
});

try {
  console.log("🔍 Testing Supabase connection with timeout=30...");
  console.log("📋 Connection string:");
  console.log(`   postgres://postgres:***@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30`);
  console.log("");
  
  await client.connect();
  console.log("✅ Connected to Supabase successfully!");
  
  // Test basic query
  const result = await client.query('SELECT version() as version, current_database() as database, current_user as user');
  console.log("📊 Database info:");
  console.log(`   Version: ${result.rows[0].version.substring(0, 50)}...`);
  console.log(`   Database: ${result.rows[0].database}`);
  console.log(`   User: ${result.rows[0].user}`);
  
  // Test if tables exist
  const tablesResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
    LIMIT 10
  `);
  
  console.log("📋 Existing tables (first 10):");
  if (tablesResult.rows.length === 0) {
    console.log("   No tables found - ready for fresh migration");
  } else {
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
  }
  
  // Test table creation permissions
  try {
    await client.query('CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())');
    console.log("✅ Table creation test passed");
    
    await client.query('DROP TABLE IF EXISTS test_connection');
    console.log("✅ Table deletion test passed");
  } catch (error) {
    console.log("⚠️ Table creation test failed:", error.message);
  }
  
  console.log("✅ Connection test completed successfully!");
  console.log("");
  console.log("🎉 READY FOR DEPLOYMENT!");
  console.log("📋 Working connection string:");
  console.log(connString);
  
} catch (e) {
  console.error("❌ Connection error name:", e?.name);
  console.error("❌ Connection error message:", e?.message);
  console.error("❌ Connection error code:", e?.code);
  console.error("❌ Full error object:", e);
} finally {
  try { 
    await client.end(); 
  } catch {}
}
