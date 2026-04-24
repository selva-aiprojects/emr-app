// Test Supabase Connection with Actual Certificate File
import pg from "pg";
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Connection string with certificate
const connString = "postgres://postgres:hms-app%402020@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30";

// Path to certificate file
const certPath = path.join(process.cwd(), 'database', 'prod-ca-2021.crt');

// Check if certificate file exists
let sslConfig = {
  rejectUnauthorized: false
};

if (fs.existsSync(certPath)) {
  console.log("📋 Certificate file found:", certPath);
  try {
    const certContent = fs.readFileSync(certPath);
    console.log("📋 Certificate loaded successfully");
    sslConfig = {
      ca: certContent,
      rejectUnauthorized: true // Use true with certificate
    };
  } catch (error) {
    console.log("⚠️ Error reading certificate:", error.message);
  }
} else {
  console.log("⚠️ Certificate file not found, using default SSL config");
}

const client = new Client({
  connectionString: connString,
  ssl: sslConfig,
});

try {
  console.log("🔍 Testing Supabase connection with certificate...");
  console.log("📋 Connection string:");
  console.log(`   postgres://postgres:***@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30`);
  console.log("📋 SSL Config:", sslConfig.ca ? "Using certificate file" : "Using default SSL");
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
  console.log("📋 Certificate file:", certPath);
  
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
