import pg from "pg";
const { Client } = pg;
const connString = "postgres://postgres:hms-app@2020@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true";
const client = new Client({
  connectionString: connString,
  ssl: {
    rejectUnauthorized: false, // Supabase commonly works with this for quick connectivity tests
  },
});

try {
  await client.connect();
  console.log("✅ Connected");
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
