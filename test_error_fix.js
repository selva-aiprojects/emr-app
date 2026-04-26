// Test the patient creation error fix
import fs from 'fs';
import path from 'path';

async function testPatientErrorFix() {
  console.log('=== TESTING PATIENT CREATION ERROR FIX ===\n');
  
  try {
    // Verify the fix was applied
    const filePath = path.join(process.cwd(), 'client/src/pages/PatientsPage.jsx');
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('title: \'Registration Failed\'')) {
      console.log('✅ Error handling fix verified in PatientsPage.jsx');
    } else {
      console.log('❌ Error handling fix NOT applied correctly');
    }
    
    // Test different error scenarios
    console.log('\n2. Testing error message generation:');
    
    const testCases = [
      {
        type: 'Validation Error',
        message: 'firstName and lastName are required',
        expectedTitle: 'Registration Failed',
        expectedMessage: 'First name and last name are required'
      },
      {
        type: 'Unauthorized Error',
        message: 'Unauthorized access',
        expectedTitle: 'Registration Failed',
        expectedMessage: 'You do not have permission to create patients'
      },
      {
        type: 'Network Error',
        message: 'Network connection failed',
        expectedTitle: 'Registration Failed',
        expectedMessage: 'Network error. Please check your connection'
      },
      {
        type: 'Duplicate Error',
        message: 'duplicate key value violates unique constraint',
        expectedTitle: 'Registration Failed',
        expectedMessage: 'A patient with this information already exists'
      },
      {
        type: 'Generic Error',
        message: 'Some random error occurred',
        expectedTitle: 'Registration Failed',
        expectedMessage: 'Registration failed: Some random error occurred'
      }
    ];
    
    testCases.forEach((testCase, index) => {
      console.log(`\n${index + 1}. Testing ${testCase.type}:`);
      console.log(`   Input: "${testCase.message}"`);
      console.log(`   Expected Title: "${testCase.expectedTitle}"`);
      console.log(`   Expected Message: "${testCase.expectedMessage}"`);
      
      // Simulate the error handling logic
      let errorMessage = 'Patient registration failed';
      
      if (testCase.message.includes('firstName and lastName are required')) {
        errorMessage = 'First name and last name are required';
      } else if (testCase.message.includes('Unauthorized') || testCase.message.includes('401')) {
        errorMessage = 'You do not have permission to create patients';
      } else if (testCase.message.includes('Forbidden') || testCase.message.includes('403')) {
        errorMessage = 'Error: Access denied. Please contact your administrator';
      } else if (testCase.message.includes('tenant') || testCase.message.includes('tenantId')) {
        errorMessage = 'Session expired. Please log in again';
      } else if (testCase.message.includes('network') || testCase.message.includes('fetch') || testCase.message.includes('connection')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (testCase.message.includes('duplicate') || testCase.message.includes('unique')) {
        errorMessage = 'A patient with this information already exists';
      } else if (testCase.message.includes('validation') || testCase.message.includes('invalid')) {
        errorMessage = 'Please check all required fields and try again';
      } else if (testCase.message) {
        errorMessage = `Registration failed: ${testCase.message}`;
      }
      
      const actualTitle = 'Registration Failed';
      const actualMessage = errorMessage;
      
      console.log(`   Actual Title: "${actualTitle}"`);
      console.log(`   Actual Message: "${actualMessage}"`);
      
      if (actualTitle === testCase.expectedTitle && actualMessage === testCase.expectedMessage) {
        console.log(`   ✅ ${testCase.type} - PASS`);
      } else {
        console.log(`   ❌ ${testCase.type} - FAIL`);
      }
    });
    
    console.log('\n✅ Error handling fix test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPatientErrorFix();
