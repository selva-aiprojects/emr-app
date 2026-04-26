import { query } from '../server/db/connection.js';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    const sql = fs.readFileSync('database/migrations/20260426_add_communications.sql', 'utf8');
    await query(sql);
    console.log("✅ Communications table created successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit();
  }
}

migrate();
