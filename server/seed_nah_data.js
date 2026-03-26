/**
 * New Age Hospital (NAH) Data Seeding Script
 * Populates the database with realistic demo data for NAH tenant
 */

import { query } from './db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSQLFile(filePath) {
  try {
    console.log(`Running SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the entire SQL file as one block to preserve transactions (BEGIN/COMMIT)
    await query(sql);
    
    console.log(`✅ Completed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error running ${filePath}:`, error);
    throw error;
  }
}

async function seedNAHData() {
  try {
    console.log('🏥 Starting New Age Hospital (NAH) data seeding...');
    
    // Run all seeding files in order
    const sqlFiles = [
      path.join(__dirname, '../database/seed_nah_tenant.sql'),
      path.join(__dirname, '../database/seed_nah_appointments.sql'),
      path.join(__dirname, '../database/seed_nah_billing.sql'),
      path.join(__dirname, '../database/seed_nah_inventory.sql')
    ];
    
    for (const file of sqlFiles) {
      if (fs.existsSync(file)) {
        await runSQLFile(file);
      } else {
        console.log(`⚠️  File not found: ${file}`);
      }
    }
    
    console.log('🎉 NAH data seeding completed successfully!');
    
    // Verify the data was inserted
    const verificationQueries = [
      'SELECT COUNT(*) as count FROM emr.tenants WHERE code = \'NAH\'',
      'SELECT COUNT(*) as count FROM emr.users WHERE tenant_id = (SELECT id FROM emr.tenants WHERE code = \'NAH\')',
      'SELECT COUNT(*) as count FROM emr.patients WHERE tenant_id = (SELECT id FROM emr.tenants WHERE code = \'NAH\')',
      'SELECT COUNT(*) as count FROM emr.appointments WHERE tenant_id = (SELECT id FROM emr.tenants WHERE code = \'NAH\')',
      'SELECT COUNT(*) as count FROM emr.invoices WHERE tenant_id = (SELECT id FROM emr.tenants WHERE code = \'NAH\')'
    ];
    
    console.log('\n📊 Data Verification:');
    for (const sql of verificationQueries) {
      const result = await query(sql);
      console.log(`✅ ${result.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (process.argv[1] && (process.argv[1].endsWith('seed_nah_data.js'))) {
  seedNAHData();
}

export { seedNAHData };
