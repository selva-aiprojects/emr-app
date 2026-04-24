import { managementClient } from '../server/db/prisma_manager.js';

async function check() {
  try {
    const patientsCount = await managementClient.$queryRawUnsafe('SELECT count(*) FROM emr.patients');
    const usersCount = await managementClient.$queryRawUnsafe('SELECT count(*) FROM emr.users');
    const tenantsCount = await managementClient.$queryRawUnsafe('SELECT count(*) FROM emr.tenants');
    console.log('--- LEGACY EMR SCHEMA ---');
    console.log('Patients:', patientsCount);
    console.log('Users:', usersCount);
    console.log('Tenants:', tenantsCount);

    const isolatedCount = await managementClient.$queryRawUnsafe('SELECT count(*) FROM management_tenants');
    console.log('--- NEW MANAGEMENT SCHEMA ---');
    console.log('Tenants:', isolatedCount);
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
