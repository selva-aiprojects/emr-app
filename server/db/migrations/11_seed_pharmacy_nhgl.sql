-- 11. Final Pharmacy Seeder (Safe Mode)
-- Uses Dynamic SQL and Type-Agnostic Casting

DO $$ 
DECLARE 
    v_tenant_id VARCHAR := 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
    pat_id VARCHAR;
    m_id VARCHAR;
BEGIN
    -- Ensure Enhanced Pharmacy Tables exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'nhgl' AND tablename = 'prescriptions_enhanced') THEN
        CREATE TABLE nhgl.prescriptions_enhanced (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(255) NOT NULL,
            patient_id VARCHAR(255) NOT NULL,
            prescription_number VARCHAR(64) UNIQUE,
            status VARCHAR(24) DEFAULT 'PENDING',
            prescription_date DATE DEFAULT CURRENT_DATE,
            validity_days INT DEFAULT 30
        );
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'nhgl' AND tablename = 'pharmacy_inventory_enhanced') THEN
        CREATE TABLE nhgl.pharmacy_inventory_enhanced (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(255) NOT NULL,
            drug_id VARCHAR(255) NOT NULL,
            batch_number VARCHAR(64),
            expiry_date DATE,
            current_stock NUMERIC(12,2) DEFAULT 0,
            quantity_remaining NUMERIC(12,2) DEFAULT 0,
            unit_price NUMERIC(12,2) DEFAULT 0,
            status VARCHAR(16) DEFAULT 'ACTIVE'
        );
    END IF;

    -- Clean
    EXECUTE 'DELETE FROM nhgl.pharmacy_inventory_enhanced WHERE tenant_id::text = $1' USING v_tenant_id;
    EXECUTE 'DELETE FROM nhgl.prescriptions_enhanced WHERE tenant_id::text = $1' USING v_tenant_id;

    -- Seed Inventory
    m_id := (SELECT id::text FROM nhgl.inventory_items WHERE item_code = 'MED-001' LIMIT 1);
    IF m_id IS NOT NULL THEN
        EXECUTE 'INSERT INTO nhgl.pharmacy_inventory_enhanced (tenant_id, drug_id, batch_number, expiry_date, current_stock, quantity_remaining, unit_price)
        VALUES ($1, $2, ''BAT-001'', CURRENT_DATE + INTERVAL ''90 days'', 5000, 5000, 5)' USING v_tenant_id, m_id;
    END IF;

    -- Seed Active Rx
    pat_id := (SELECT id::text FROM nhgl.patients WHERE tenant_id::text = v_tenant_id LIMIT 1);
    IF pat_id IS NOT NULL THEN
        EXECUTE 'INSERT INTO nhgl.prescriptions_enhanced (tenant_id, patient_id, prescription_number, status)
        VALUES ($1, $2, ''RX-AUTO-101'', ''PENDING''),
               ($1, $2, ''RX-AUTO-102'', ''PENDING''),
               ($1, $2, ''RX-AUTO-103'', ''PENDING'')' USING v_tenant_id, pat_id;
    END IF;

END $$;
