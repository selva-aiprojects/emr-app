-- 08. Supreme Type Neutralization (Omni-Constraint Handling)
-- This script dynamically identifies and drops ALL foreign key locks across ALL schemas

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. DYNAMICALLY DROP ALL CONSTRAINTS
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'nexus'
          AND tc.table_name IN ('patients', 'encounters', 'invoices', 'appointments', 'prescriptions_enhanced', 'prescription_items_enhanced', 'management_tenants', 'tenants', 'inventory_items', 'pharmacy_inventory_enhanced')
        
        UNION
        
        -- Outgoing references from any schema to our core tables
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = 'nexus'
          AND ccu.table_name IN ('patients', 'encounters', 'invoices', 'appointments', 'tenants', 'management_tenants', 'inventory_items', 'pharmacy_inventory_enhanced')
    ) LOOP
        BEGIN
            EXECUTE 'ALTER TABLE "' || r.table_schema || '"."' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '" CASCADE';
            RAISE NOTICE 'Dropped constraint: %.% (%)', r.table_schema, r.table_name, r.constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop constraint %.% : %', r.table_schema, r.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. NEUTRALIZE ALL CORE IDENTIFIERS (Force to VARCHAR)
ALTER TABLE patients ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE patients ALTER COLUMN tenant_id TYPE VARCHAR(255);

ALTER TABLE nexus.management_tenants ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE nexus.tenants ALTER COLUMN id TYPE VARCHAR(255);

ALTER TABLE encounters ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE encounters ALTER COLUMN tenant_id TYPE VARCHAR(255);
ALTER TABLE encounters ALTER COLUMN patient_id TYPE VARCHAR(255);
ALTER TABLE encounters ALTER COLUMN provider_id TYPE VARCHAR(255);

ALTER TABLE appointments ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE appointments ALTER COLUMN tenant_id TYPE VARCHAR(255);
ALTER TABLE appointments ALTER COLUMN patient_id TYPE VARCHAR(255);
ALTER TABLE appointments ALTER COLUMN provider_id TYPE VARCHAR(255);

ALTER TABLE invoices ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE invoices ALTER COLUMN tenant_id TYPE VARCHAR(255);
ALTER TABLE invoices ALTER COLUMN patient_id TYPE VARCHAR(255);
ALTER TABLE invoices ALTER COLUMN encounter_id TYPE VARCHAR(255);

-- 3. RE-ESTABLISH PRIMARY CONSTRAINTS (Unified Core)
-- Note: These references will resolve via search_path
ALTER TABLE patients ADD CONSTRAINT patients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES nexus.tenants(id) ON DELETE CASCADE;
ALTER TABLE encounters ADD CONSTRAINT encounters_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL;

-- 4. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA nexus TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA nexus TO PUBLIC;
