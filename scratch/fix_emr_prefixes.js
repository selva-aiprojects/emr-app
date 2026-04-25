import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Directories to scan
const targetDirs = [
    'server/routes', 
    'server/services', 
    'server/utils', 
    'server/db', 
    'server/scripts',
    'database'
];

function walkAndReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            walkAndReplace(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.sql')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            const original = content;
            
            // Replace emr.TABLE_NAME with just TABLE_NAME
            content = content.replace(/\bemr\.([a-z_]+)\b/g, '$1');
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`✅ Fixed hardcoded schema in: ${fullPath.replace(rootDir, '')}`);
            }
        }
    }
}

console.log('🚀 Scanning directories for hardcoded "emr." schema prefixes...');

for (const td of targetDirs) {
    const fullDir = path.join(rootDir, td);
    if (fs.existsSync(fullDir)) {
        walkAndReplace(fullDir);
    }
}

console.log('✅ Done! All hardcoded "emr." schema prefixes have been removed.');
