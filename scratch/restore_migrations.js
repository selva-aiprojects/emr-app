import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../database/migrations');

function restoreMigrations() {
    console.log('🚀 Restoring disabled migrations...');
    const files = fs.readdirSync(migrationsDir);
    
    for (const file of files) {
        if (file.endsWith('.sql.backup')) {
            const oldPath = path.join(migrationsDir, file);
            const newPath = path.join(migrationsDir, file.replace('.sql.backup', '.sql'));
            
            // Overwrite the stub .sql file if it exists
            fs.copyFileSync(oldPath, newPath);
            console.log(`✅ Restored: ${file.replace('.sql.backup', '.sql')}`);
        }
    }
    console.log('✅ All early migrations restored. They will recreate the missing tables in the nexus schema upon next boot.');
}

restoreMigrations();
