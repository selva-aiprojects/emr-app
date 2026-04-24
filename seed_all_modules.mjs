// Master Seed Script for All Modules
// Runs comprehensive seeding for Lab, Blood Bank, Prescription, and Pharmacy modules

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const modules = [
  {
    name: 'Lab Module',
    script: 'seed_lab_comprehensive.mjs',
    description: 'Lab orders, results, and service requests'
  },
  {
    name: 'Blood Bank Module',
    script: 'seed_blood_bank_comprehensive.mjs',
    description: 'Blood units, requests, and donor records'
  },
  {
    name: 'Prescription Module',
    script: 'seed_prescription_comprehensive.mjs',
    description: 'Enhanced prescriptions and drug master data'
  },
  {
    name: 'Pharmacy Module',
    script: 'seed_pharmacy_comprehensive.mjs',
    description: 'Pharmacy inventory, dispensing, and stock management'
  }
];

async function runSeedScript(scriptPath, moduleName) {
  try {
    console.log(`\n🚀 Starting ${moduleName}...`);
    console.log('='.repeat(60));
    
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
    
    if (stderr) {
      console.error(`❌ Error in ${moduleName}:`, stderr);
      return false;
    }
    
    console.log(stdout);
    console.log(`✅ ${moduleName} completed successfully!`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to run ${moduleName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🏥 EMR Application - Comprehensive Data Seeding');
  console.log('='.repeat(60));
  console.log('📋 This will seed data for all modules with clean metrics for dashboard validation');
  console.log('');
  
  const results = [];
  
  for (const module of modules) {
    const success = await runSeedScript(module.script, module.name);
    results.push({ name: module.name, success, description: module.description });
  }
  
  console.log('\n');
  console.log('🎉 SEEDING SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${status} - ${result.name}: ${result.description}`);
  });
  
  const successfulModules = results.filter(r => r.success).length;
  const totalModules = results.length;
  
  console.log('\n📊 OVERALL RESULT');
  console.log('='.repeat(60));
  console.log(`✅ Successfully seeded: ${successfulModules}/${totalModules} modules`);
  
  if (successfulModules === totalModules) {
    console.log('🎊 All modules seeded successfully!');
    console.log('\n📈 Generated Data Summary:');
    console.log('   🔬 Lab Module: 150+ lab orders, realistic test results, critical results');
    console.log('   🩸 Blood Bank: 200+ blood units, 80+ requests, donor records');
    console.log('   💊 Prescription: 200+ prescriptions, 32+ drugs, statistics');
    console.log('   🏪 Pharmacy: 24+ inventory items, dispensing logs, stock movements');
    console.log('\n🎯 Dashboard Metrics Ready:');
    console.log('   • Clean, realistic metrics for all modules');
    console.log('   • Proper status distribution (active, completed, pending)');
    console.log('   • Critical alerts and expiry tracking');
    console.log('   • Financial and operational statistics');
    console.log('   • Compliance and regulatory data');
    console.log('\n🚀 Ready for dashboard validation and testing!');
    
  } else {
    console.log(`⚠️  ${totalModules - successfulModules} modules failed to seed.`);
    console.log('Please check the error messages above and fix any issues.');
  }
  
  console.log('\n🔄 Next Steps:');
  console.log('1. Verify database tables are populated');
  console.log('2. Check dashboard metrics display correctly');
  console.log('3. Validate module functionality');
  console.log('4. Test search and filter features');
  console.log('5. Verify compliance and regulatory features');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Seeding process interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Seeding process terminated');
  process.exit(1);
});

// Run the master seeding
main().catch(error => {
  console.error('\n❌ Fatal error during seeding:', error);
  process.exit(1);
});
