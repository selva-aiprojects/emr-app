const modules = [
  './routes/superadmin.routes.js',
  './routes/patient.routes.js',
  './routes/encounter.routes.js',
  './routes/billing.routes.js',
  './routes/pharmacy.routes.js',
  './routes/inventory.routes.js',
  './routes/appointment.routes.js',
  './routes/employee.routes.js',
  './routes/auth.routes.js',
  './routes/user.routes.js',
  './routes/tenant.routes.js',
  './routes/infrastructure.routes.js',
  './routes/report.routes.js',
  './routes/hr.routes.js',
  './routes/insurance.routes.js',
  './routes/master.routes.js',
  './routes/communication.routes.js',
  './routes/laboratory.routes.js',
  './routes/document.routes.js',
  './routes/support.routes.js',
  './routes/ambulance.routes.js',
  './routes/bloodbank.routes.js',
  './routes/clinical.routes.js',
  './routes/admin.routes.js',
  './routes/ai.routes.js'
];

async function check() {
  for (const m of modules) {
    try {
      console.log(`Checking ${m}...`);
      await import(m);
      console.log(`✅ ${m} OK`);
    } catch (e) {
      console.error(`❌ ${m} FAILED:`, e.message);
    }
  }
}

check();
