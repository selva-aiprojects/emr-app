const fs = require('fs');
const path = require('path');

const repoPath = path.join(__dirname, '../server/db/repository.js');
const content = fs.readFileSync(repoPath, 'utf8');

// Extract export default block
// Regex to capture content between export default { and };
// Note: This relies on simple formatting.
const exportMatch = content.match(/export default \{([\s\S]*?)\};/);
if (!exportMatch) {
    console.log('No export default block found!');
    process.exit(1);
}

const exportBlock = exportMatch[1];
// Extract exported names
const exportedNames = exportBlock.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(line => line.replace(',', ''));

// Extract defined function/variable names
const definedRegex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)/g;
const definitions = new Set();
let match;
while ((match = definedRegex.exec(content)) !== null) {
    definitions.add(match[1]);
}

// Add imported names if any (e.g. query)
// But repository usually exports its own functions.

console.log('--- Export Check Report ---');
let hasErrors = false;
for (const name of exportedNames) {
    if (name && !definitions.has(name)) {
        console.log(`Missing definition for export: ${name}`);
        hasErrors = true;
    }
}

if (!hasErrors) {
    console.log('All exports are defined.');
}
