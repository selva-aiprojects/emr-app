import { query } from './server/db/connection.js';
import * as repo from './server/db/repository.js';
async function run() {
  const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed';
  const userId = 'e448b2ae-b557-4ce4-81a0-0b15da426e4f';
  try {
    const data = await repo.getBootstrapData(tenantId, userId);
    console.log('Bootstrap success! Found', Object.keys(data).length, 'keys');
  } catch(e) {
    console.error('BOOTSTRAP FAILED:', e.message);
  }
}
run().catch(console.error).finally(() => process.exit(0));
