// Fix for patient creation error handling
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'client/src/pages/PatientsPage.jsx');

let content = fs.readFileSync(filePath, 'utf8');

// Replace the error handling section
const oldErrorHandling = `  } catch (err) {
      console.error('Registration failed:', err);
      showToast({ message: \`REGISTRATION_CRITICAL_FAILURE: \${err.message}\`, type: 'error' });
    }`;

const newErrorHandling = `  } catch (err) {
      console.error('Registration failed:', err);
      
      // Handle specific error types
      let errorMessage = 'Patient registration failed';
      
      if (err.message.includes('firstName and lastName are required')) {
        errorMessage = 'First name and last name are required';
      } else if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        errorMessage = 'You do not have permission to create patients';
      } else if (err.message.includes('Forbidden') || err.message.includes('403')) {
        errorMessage = 'Access denied. Please contact your administrator';
      } else if (err.message.includes('tenant') || err.message.includes('tenantId')) {
        errorMessage = 'Session expired. Please log in again';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (err.message.includes('duplicate') || err.message.includes('unique')) {
        errorMessage = 'A patient with this information already exists';
      } else if (err.message.includes('validation') || err.message.includes('invalid')) {
        errorMessage = 'Please check all required fields and try again';
      } else if (err.message) {
        errorMessage = \`Registration failed: \${err.message}\`;
      }
      
      showToast({ 
        title: 'Registration Failed',
        message: errorMessage, 
        type: 'error',
        duration: 5000
      });
    }`;

// Replace the old error handling with the new one
content = content.replace(oldErrorHandling, newErrorHandling);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed patient creation error handling in PatientsPage.jsx');
