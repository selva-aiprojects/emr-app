import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=============================================');
console.log('🛠️  MEDFLOW SERVER RECOVERY SCRIPT');
console.log('=============================================');

try {
    console.log('\n[1/3] Removing hardcoded "emr." schema prefixes...');
    execSync(`node "${path.join(__dirname, 'fix_emr_prefixes.js')}"`, { stdio: 'inherit' });
    
    console.log('\n[2/3] Restoring early migration backups...');
    execSync(`node "${path.join(__dirname, 'restore_migrations.js')}"`, { stdio: 'inherit' });
    
    console.log('\n[3/3] Restoring NHGL clinical tables...');
    execSync(`node "${path.join(__dirname, 'restore_nhgl.js')}"`, { stdio: 'inherit' });

    console.log('\n=============================================');
    console.log('✅ RECOVERY COMPLETE!');
    console.log('=============================================');
    console.log('You can now start your server using: npm run dev');
} catch (error) {
    console.error('\n❌ An error occurred during recovery:', error.message);
}
