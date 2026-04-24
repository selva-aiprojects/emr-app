const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Fixing EMR Visibility ===');
    
    // Find EMR menu item
    const emrItem = await query(`
      SELECT id, name, code, is_active, is_visible
      FROM emr.menu_item 
      WHERE code = 'emr'
      LIMIT 1
    `);
    
    if (emrItem.rows.length === 0) {
      console.log('❌ EMR menu item not found');
      process.exit(1);
    }
    
    const emr = emrItem.rows[0];
    console.log(`Found EMR: ${emr.name} (ID: ${emr.id})`);
    console.log(`Current is_active: ${emr.is_active}`);
    console.log(`Current is_visible: ${emr.is_visible}`);
    
    // Update EMR to be active and visible
    await query(`
      UPDATE emr.menu_item 
      SET is_active = true, is_visible = true, updated_at = NOW()
      WHERE id = $1
    `, [emr.id]);
    
    console.log('✅ Updated EMR to be active and visible');
    
    // Also update the parent group
    const parentGroup = await query(`
      SELECT id, name, code, is_active, is_visible
      FROM emr.menu_item 
      WHERE code = 'patient_care'
      LIMIT 1
    `);
    
    if (parentGroup.rows.length > 0) {
      const parent = parentGroup.rows[0];
      console.log(`Found parent: ${parent.name} (ID: ${parent.id})`);
      
      await query(`
        UPDATE emr.menu_item 
        SET is_active = true, is_visible = true, updated_at = NOW()
        WHERE id = $1
      `, [parent.id]);
      
      console.log('✅ Updated parent group to be active and visible');
    }
    
    // Verify the updates
    console.log('\n=== Verification ===');
    
    const updatedEMR = await query(`
      SELECT id, name, code, is_active, is_visible
      FROM emr.menu_item 
      WHERE code = 'emr'
      LIMIT 1
    `);
    
    const updatedParent = await query(`
      SELECT id, name, code, is_active, is_visible
      FROM emr.menu_item 
      WHERE code = 'patient_care'
      LIMIT 1
    `);
    
    console.log('Updated EMR:', updatedEMR.rows[0]);
    if (updatedParent.rows.length > 0) {
      console.log('Updated Parent:', updatedParent.rows[0]);
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Clear browser cache (Ctrl+F5)');
    console.log('2. Restart the development server');
    console.log('3. Login as doctor@nhgl.com');
    console.log('4. Check if "Bed & Patient Care" group appears');
    console.log('5. Check if EMR appears under the group');
    
    console.log('\n=== EXPECTED RESULT ===');
    console.log('✅ "Bed & Patient Care" group should be visible');
    console.log('✅ "EMR" should be visible under the group');
    console.log('✅ Clicking EMR should navigate to /emr');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
