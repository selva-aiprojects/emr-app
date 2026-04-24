const fs = require('fs');
const path = require('path');

async function disableProblematicMigrations() {
  try {
    console.log('Disabling problematic migrations...');
    
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const problematicFiles = [
      '001_institutional_employees.sql',
      '002_finance_hr.sql', 
      '003_insurance.sql',
      '004_feature_flags.sql',
      '005_fhir_compliance.sql',
      '006_pharmacy_module.sql',
      '008_infrastructure.sql',
      '009_roles_and_supervisors.sql',
      '010_additional_roles.sql',
      '011_product_gap_foundation.sql'
    ];
    
    for (const file of problematicFiles) {
      const filePath = path.join(migrationsDir, file);
      const backupPath = path.join(migrationsDir, file + '.backup');
      
      // Create backup
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
        
        // Replace content with a simple comment to disable the migration
        const disabledContent = `-- DISABLED: ${file}
-- This migration was disabled because it references tables that should only exist in tenant schemas
-- not in the emr management schema. The tables are created dynamically per tenant.
-- Original file backed up as ${file}.backup
`;
        fs.writeFileSync(filePath, disabledContent);
        console.log(`Disabled migration: ${file}`);
      }
    }
    
    console.log('Problematic migrations disabled!');
    console.log('Original files backed up with .backup extension');
    
  } catch (error) {
    console.error('Error disabling migrations:', error);
  }
}

disableProblematicMigrations();
