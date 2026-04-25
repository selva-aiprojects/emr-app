
import { testConnection } from './server/db/connection.js';

async function run() {
  console.log('🚀 Triggering migrations...');
  const success = await testConnection();
  if (success) {
    console.log('✅ Migrations completed successfully.');
  } else {
    console.error('❌ Migrations failed.');
  }
  process.exit(success ? 0 : 1);
}

run();
