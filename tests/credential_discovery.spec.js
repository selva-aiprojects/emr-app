import { test } from '@playwright/test';
import { query } from '../server/db/connection.js';

test('Discover NHGL Credentials', async () => {
  const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
  const usersRes = await query('SELECT email, role, name FROM emr.users WHERE tenant_id = $1', [tenantId]);
  
  console.log('--- NHGL USER DISCOVERY ---');
  console.log(JSON.stringify(usersRes.rows, null, 2));
  console.log('---------------------------');
});
