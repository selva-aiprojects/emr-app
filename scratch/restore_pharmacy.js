import { query } from '../server/db/connection.js';

async function restorePharmacyStock() {
    try {
        const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'; // NHGL
        
        console.log('🚀 Restoring clinical stock for NHGL...');

        // 1. Ensure Paracetamol exists
        const drugId = 'd1111111-1111-1111-1111-111111111111';
        await query(`
            INSERT INTO emr.inventory_items (id, tenant_id, name, type, batch_number, stock_quantity, status)
            VALUES ($1, $2, 'Paracetamol 500mg', 'Medicine', 'B-101', 500, 'Available')
            ON CONFLICT (id) DO UPDATE SET stock_quantity = 500
        `, [drugId, tenantId]);

        // 2. Map to Enhanced Inventory View/Table
        await query(`
            INSERT INTO emr.pharmacy_inventory_enhanced (id, tenant_id, name, batch_number, quantity, status)
            VALUES ($1, $2, 'Paracetamol 500mg', 'B-101', 500, 'instock')
            ON CONFLICT (id) DO UPDATE SET quantity = 500
        `, [drugId, tenantId]);

        console.log('✅ Clinical stock restored.');
    } catch (err) {
        console.error('❌ Restore failed:', err.message);
    } finally {
        process.exit();
    }
}

restorePharmacyStock();
