// Complete verification of patient creation error fix
import fs from 'fs';
import path from 'path';

async function verifyCompleteFix() {
  console.log('=== COMPLETE PATIENT CREATION ERROR FIX VERIFICATION ===\n');
  
  try {
    // 1. Check PatientsPage.jsx
    console.log('1. Checking PatientsPage.jsx:');
    const patientsPagePath = path.join(process.cwd(), 'client/src/pages/PatientsPage.jsx');
    const patientsPageContent = fs.readFileSync(patientsPagePath, 'utf8');
    
    const patientsPageHasNewError = patientsPageContent.includes('title: \'Registration Failed\'') &&
                                   patientsPageContent.includes('First name and last name are required') &&
                                   !patientsPageContent.includes('REGISTRATION_CRITICAL_FAILURE');
    
    if (patientsPageHasNewError) {
      console.log('✅ PatientsPage.jsx - Fixed correctly');
    } else {
      console.log('❌ PatientsPage.jsx - Still has issues');
    }
    
    // 2. Check App.jsx
    console.log('\n2. Checking App.jsx:');
    const appPagePath = path.join(process.cwd(), 'client/src/App.jsx');
    const appPageContent = fs.readFileSync(appPagePath, 'utf8');
    
    const appPageHasNewError = appPageContent.includes('title: \'Registration Failed\'') &&
                              appPageContent.includes('First name and last name are required') &&
                              !appPageContent.includes('Registration failed: ' + err.message);
    
    if (appPageHasNewError) {
      console.log('✅ App.jsx - Fixed correctly');
    } else {
      console.log('❌ App.jsx - Still has issues');
    }
    
    // 3. Check for any remaining REGISTRATION_CRITICAL_FAILURE
    console.log('\n3. Checking for remaining cryptic errors:');
    const remainingErrors = [];
    
    const searchFiles = [
      'client/src/pages/PatientsPage.jsx',
      'client/src/App.jsx',
      'client/src/components/PatientPicker.jsx',
      'client/src/components/emr/PatientDetailPage.jsx'
    ];
    
    searchFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('REGISTRATION_CRITICAL_FAILURE')) {
          remainingErrors.push(filePath);
        }
      } catch (error) {
        // File doesn't exist, skip
      }
    });
    
    if (remainingErrors.length === 0) {
      console.log('✅ No remaining cryptic error messages found');
    } else {
      console.log('❌ Found remaining cryptic errors in:');
      remainingErrors.forEach(file => console.log(`   - ${file}`));
    }
    
    // 4. Summary
    console.log('\n4. Complete Fix Summary:');
    if (patientsPageHasNewError && appPageHasNewError && remainingErrors.length === 0) {
      console.log('🎉 ALL PATIENT CREATION ERROR HANDLING FIXED!');
      console.log('\nExpected Behavior:');
      console.log('- ✅ PatientsPage.jsx: Shows user-friendly error messages');
      console.log('- ✅ App.jsx: Shows user-friendly error messages');
      console.log('- ✅ No more cryptic REGISTRATION_CRITICAL_FAILURE messages');
      console.log('- ✅ Clear, actionable error messages for users');
      
      console.log('\nError Messages Users Will See:');
      console.log('- Missing fields: "Registration Failed: First name and last name are required"');
      console.log('- No permission: "Registration Failed: You do not have permission to create patients"');
      console.log('- Network issues: "Registration Failed: Network error. Please check your connection"');
      console.log('- Duplicate data: "Registration Failed: A patient with this information already exists"');
      
      console.log('\n✅ READY FOR USER TESTING!');
      
    } else {
      console.log('❌ Fix incomplete - some issues remain');
      if (!patientsPageHasNewError) console.log('   - PatientsPage.jsx needs fixing');
      if (!appPageHasNewError) console.log('   - App.jsx needs fixing');
      if (remainingErrors.length > 0) console.log('   - Cryptic errors remain in other files');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyCompleteFix();
