const fs = require('fs');
const path = require('path');

const repoPath = path.join(__dirname, '../server/db/repository.js');
const content = fs.readFileSync(repoPath, 'utf8');

const regex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)/g;
const matches = [];
let match;

while ((match = regex.exec(content)) !== null) {
    matches.push({ name: match[1], index: match.index });
}

const counts = {};
matches.forEach(m => {
    counts[m.name] = (counts[m.name] || 0) + 1;
});

console.log('--- Duplicate Check Report ---');
let hasDuplicates = false;
for (const [name, count] of Object.entries(counts)) {
    if (count > 1) {
        console.log(`Duplicate found: ${name} (${count} times)`);
        hasDuplicates = true;
    }
}

if (!hasDuplicates) {
    console.log('No duplicates found.');
}
