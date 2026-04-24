// Comprehensive Import Diagnostic Script
console.log('--- STARTING IMPORT DIAGNOSTIC ---');

async function test() {
  try {
    console.log('Testing Core Imports...');
    const { default: express } = await import('express');
    const { default: cors } = await import('cors');
    const { default: dotenv } = await import('dotenv');
    console.log('Core Imports: OK');

    console.log('Testing DB/Connection...');
    const { query, pool } = await import('./server/db/connection.js');
    console.log('DB/Connection: OK');

    console.log('Testing Repository...');
    const repo = await import('./server/db/repository.js');
    console.log('Repository: OK');

    console.log('Testing Modular Routes...');
    const routes = [
      'admin.routes.js', 'ai.routes.js', 'ambulance.routes.js', 'appointment.routes.js',
      'auth.routes.js', 'billing.routes.js', 'bloodbank.routes.js', 'clinical.routes.js',
      'communication.routes.js', 'document.routes.js', 'employee.routes.js', 'encounter.routes.js',
      'hr.routes.js', 'infrastructure.routes.js', 'insurance.routes.js', 'inventory.routes.js',
      'laboratory.routes.js', 'master.routes.js', 'patient.routes.js', 'pharmacy.routes.js',
      'report.routes.js', 'superadmin.routes.js', 'support.routes.js', 'tenant.routes.js',
      'user.routes.js'
    ];

    for (const route of routes) {
      process.stdout.write(`  Checking ${route}... `);
      await import(`./server/routes/${route}`);
      process.stdout.write('OK\n');
    }
    console.log('All Routes: OK');

    console.log('--- DIAGNOSTIC COMPLETE: ALL IMPORTS LOADED SUCCESSFULLY ---');
  } catch (err) {
    console.error('\n--- DIAGNOSTIC FAILED ---');
    console.error('Error Type:', err.constructor.name);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

test();
