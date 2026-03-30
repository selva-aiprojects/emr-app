const fs = require('fs');

// Read the repository file
const content = fs.readFileSync('server/db/repository.js', 'utf8');

// Find all createAuditLog calls and add userName parameter
const lines = content.split('\n');
let modifiedLines = [];
let inCreateAuditLog = false;
let braceCount = 0;
let hasUserName = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this line starts a createAuditLog call
  if (line.includes('await createAuditLog({')) {
    inCreateAuditLog = true;
    braceCount = 0;
    hasUserName = false;
    
    // Count opening braces in this line
    braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    
    // Check if userName is already present
    if (line.includes('userName')) {
      hasUserName = true;
    }
    
    modifiedLines.push(line);
  } 
  else if (inCreateAuditLog) {
    // Count braces to track when the object ends
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    braceCount += openBraces - closeBraces;
    
    // Check if userName is present in this line
    if (line.includes('userName')) {
      hasUserName = true;
    }
    
    // If we're at the closing brace and userName is missing, add it
    if (braceCount <= 0 && !hasUserName) {
      // Find the last line before closing that has userId
      let insertIndex = modifiedLines.length - 1;
      while (insertIndex >= 0 && !modifiedLines[insertIndex].includes('userId')) {
        insertIndex--;
      }
      
      if (insertIndex >= 0) {
        // Insert userName after userId
        const indent = modifiedLines[insertIndex].match(/^(\s*)/)[1];
        modifiedLines.splice(insertIndex + 1, 0, `${indent}userName: null, // Add missing userName parameter`);
      }
      
      hasUserName = true; // Mark as fixed
    }
    
    modifiedLines.push(line);
    
    // Reset when we've closed the object
    if (braceCount <= 0) {
      inCreateAuditLog = false;
    }
  } 
  else {
    modifiedLines.push(line);
  }
}

// Write the modified content back
fs.writeFileSync('server/db/repository.js', modifiedLines.join('\n'), 'utf8');
console.log('Fixed all createAuditLog calls to include userName parameter');
