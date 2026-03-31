const fs = require('fs');
const path = require('path');

// Function to recursively find a file
function findFile(startDir, fileName) {
  const files = fs.readdirSync(startDir);
  
  for (const file of files) {
    const filePath = path.join(startDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        const result = findFile(filePath, fileName);
        if (result) return result;
      }
    } else if (file === fileName) {
      return filePath;
    }
  }
  return null;
}

// 1. Find the file
console.log("Searching for HospitalSettingsPage.jsx...");
const targetFileName = "HospitalSettingsPage.jsx";
const foundPath = findFile(__dirname, targetFileName);

if (!foundPath) {
  console.error(`❌ Could not find ${targetFileName} in the project.`);
  process.exit(1);
}

console.log(`✅ Found file at: ${foundPath}`);

// 2. Fix the file
try {
  let content = fs.readFileSync(foundPath, 'utf8');
  const originalContent = content;
  let fixApplied = false;

  // Fix 1: Remove dangling "Menu" (with various whitespace)
  if (!fixApplied) {
    const newContent = content.replace(/[\s\n]*Menu[\s\n]*$/, '');
    if (newContent !== content) {
      console.log('✅ Applied Fix 1: Removed dangling "Menu".');
      content = newContent;
      fixApplied = true;
    }
  }

  // Fix 2: Remove dangling "Menu" after a closing brace
  if (!fixApplied) {
    const newContent = content.replace(/}[\s\n]*Menu[\s\n]*$/, '}');
    if (newContent !== content) {
      console.log('✅ Applied Fix 2: Removed dangling "Menu" after closing brace.');
      content = newContent;
      fixApplied = true;
    }
  }

  // Fix 3: Add missing closing brace if the file ends abruptly
  if (!fixApplied) {
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      console.log(`✅ Applied Fix 3: Added ${missing} missing closing brace(s).`);
      content += '}'.repeat(missing);
      fixApplied = true;
    }
  }

  // Fix 4: Add missing closing parenthesis if file ends abruptly
  if (!fixApplied) {
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    
    if (openParens > closeParens) {
      const missing = openParens - closeParens;
      console.log(`✅ Applied Fix 4: Added ${missing} missing closing parenthesis.`);
      content += ')'.repeat(missing);
      fixApplied = true;
    }
  }

  // Write back if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(foundPath, content, 'utf8');
    console.log(`✅ File saved successfully.`);
  } else {
    console.log('⚠️ No automatic fixes could be applied.');
    console.log('------------------------------------------------');
    console.log('DIAGNOSTIC INFO: The last 10 lines of the file are:');
    console.log('------------------------------------------------');
    const lines = content.split('\n');
    // Print last 10 lines with line numbers
    const startLine = Math.max(0, lines.length - 10);
    for (let i = startLine; i < lines.length; i++) {
        console.log(`${i + 1}: ${lines[i]}`);
    }
    console.log('------------------------------------------------');
    console.log('Please copy these lines and paste them here for further help.');
  }

} catch (err) {
  console.error('An error occurred:', err.message);
  console.error(err.stack);
}
