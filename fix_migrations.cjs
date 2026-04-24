const fs = require('fs');
const path = require('path');

async function fixMigrations() {
  try {
    console.log('Fixing migration files...');
    
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix the function name from set_updated_at() to update_updated_at_column()
      const originalContent = content;
      content = content.replace(/emr\.set_updated_at\(\)/g, 'emr.update_updated_at_column()');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed function name in: ${file}`);
      }
    }
    
    console.log('Migration fixes completed!');
    
  } catch (error) {
    console.error('Error fixing migrations:', error);
  }
}

fixMigrations();
