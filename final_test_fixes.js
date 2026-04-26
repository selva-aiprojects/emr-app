// Test all the fixes we've applied
import fs from 'fs';
import path from 'path';

async function testAllFixes() {
  console.log('=== TESTING ALL FIXES ===\n');
  
  try {
    // 1. Test patient module fix
    console.log('1. Testing patient module fix:');
    const patientModulePath = path.join(process.cwd(), 'client/src/pages/PatientsPage.jsx');
    const patientModuleContent = fs.readFileSync(patientModulePath, 'utf8');
    
    const patientModuleFixed = patientModuleContent.includes('title: \'Registration Failed\'') &&
                              patientModuleContent.includes('First name and last name are required') &&
                              !patientModuleContent.includes('REGISTRATION_CRITICAL_FAILURE');
    
    console.log('✅ PatientPage.jsx error handling:', patientModuleFixed ? 'FIXED' : 'NOT FIXED');
    
    // 2. Test App.jsx fixes
    const appPath = path.join(process.cwd(), 'client/src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    const appFixed = appContent.includes('title: \'Registration Failed\'') &&
                  appContent.includes('First name and last name are required') &&
                  !appContent.includes("Registration failed: ' + err.message");
    
    console.log('✅ App.jsx error handling:', appFixed ? 'FIXED' : 'NOT FIXED');
    
    // 3. Check for any remaining cryptic errors
    const remainingCriticalErrors = patientModuleContent.includes('REGISTRATION_CRITICAL_FAILURE') ||
                                    appContent.includes('REGISTRATION_CRITICAL_FAILURE');
    
    console.log('✅ Cryptic errors removed:', !remainingCriticalErrors ? 'YES' : 'NO');
    
    // 4. Test communication routes
    console.log('\n2. Testing communication routes:');
    const commRoutesPath = path.join(process.cwd(), 'server/routes/communication.routes.js');
    const commRoutesContent = fs.readFileSync(commRoutesPath, 'utf8');
    
    const hasNoticesEndpoint = commRoutesContent.includes('/notices') &&
                               commRoutesContent.includes('router.get(\'/notices\'');
    
    console.log('✅ Communication /notices endpoint:', hasNoticesEndpoint ? 'ADDED' : 'MISSING');
    
    // 5. Test expenses routes
    console.log('\n3. Testing expenses routes:');
    const expensesRoutesPath = path.join(process.cwd(), 'server/routes/expenses.routes.js');
    
    try {
      fs.accessSync(expensesRoutesPath);
      console.log('✅ Expenses routes file: EXISTS');
    } catch (error) {
      console.log('❌ Expenses routes file: MISSING');
    }
    
    // 6. Test server registration
    console.log('\n4. Testing server route registration:');
    const serverIndexPath = path.join(process.cwd(), 'server/index.js');
    const serverContent = fs.readFileSync(serverIndexPath, 'utf8');
    
    const hasExpensesImport = serverContent.includes('import expensesRoutes') &&
                           serverContent.includes('app.use(\'/api/expenses\'');
    
    console.log('✅ Expenses routes registered:', hasExpensesImport ? 'YES' : 'NO');
    
    // 7. Summary
    console.log('\n5. Complete Fix Summary:');
    const allFixed = patientModuleFixed && appFixed && !remainingCriticalErrors && hasNoticesEndpoint && hasExpensesImport;
    
    if (allFixed) {
      console.log('🎉 ALL FIXES SUCCESSFULLY APPLIED!');
      console.log('\nFixed Issues:');
      console.log('- ✅ Patient creation error handling (PatientsPage.jsx)');
      console.log('- ✅ Patient creation error handling (App.jsx)');
      console.log('- ✅ Cryptic error messages removed');
      console.log('- ✅ Communication /notices endpoint added');
      console.log('- ✅ Expenses routes created and registered');
      
      console.log('\nExpected Behavior After Restart:');
      console.log('- Patient creation: Shows user-friendly error messages');
      console.log('- Communication notices: No more 404 errors');
      console.log('- Expenses: No more 404 errors');
      console.log('- Feature Flags: Should work (if modules are enabled)');
      console.log('- System Settings: Should work (if modules are enabled)');
      
      console.log('\n✅ RESTART THE APPLICATION TO SEE ALL CHANGES!');
      
    } else {
      console.log('❌ Some fixes still needed:');
      if (!patientModuleFixed) console.log('   - PatientPage.jsx error handling');
      if (!appFixed) console.log('   - App.jsx error handling');
      if (remainingCriticalErrors) console.log('   - Remove remaining cryptic errors');
      if (!hasNoticesEndpoint) console.log('   - Add communication /notices endpoint');
      if (!hasExpensesImport) console.log('   - Add expenses routes');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllFixes();
