-- 08. Supreme Type Neutralization (Omni-Constraint Handling)
-- This script dynamically identifies and drops ALL foreign key locks across ALL schemas
-- that either REFERENCE OR ARE IN our core clinical tables.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. DYNAMICALLY DROP ALL CONSTRAINTS (Incoming and Outgoing)
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'emr'
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
          AND ccu.table_schema = 'emr'
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
ALTER TABLE emr.patients ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE emr.patients ALTER COLUMN tenant_id TYPE VARCHAR(255);

ALTER TABLE emr.management_tenants ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE emr.tenants ALTER COLUMN id TYPE VARCHAR(255);

ALTER TABLE emr.encounters ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE emr.encounters ALTER COLUMN tenant_id TYPE VARCHAR(255);
ALTER TABLE emr.encounters ALTER COLUMN patient_id TYPE VARCHAR(255);
ALTER TABLE emr.encounters ALTER COLUMN provider_id TYPE VARCHAR(255);

ALTER TABLE emr.appointments ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE emr.appointments ALTER COLUMN tenant_id TYPE VARCHAR(255);
ALTER TABLE emr.appointments ALTER COLUMN patient_id TYPE VARCHAR(255);
ALTER TABLE emr.appointments ALTER COLUMN provider_id TYPE VARCHAR(255);

ALTER TABLE emr.invoices ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE emr.invoices ALTER COLUMN tenant_id TYPE VARCHAR(255);
ALTER TABLE emr.invoices ALTER COLUMN patient_id TYPE VARCHAR(255);
ALTER TABLE emr.invoices ALTER COLUMN encounter_id TYPE VARCHAR(255);

ALTER TABLE emr.prescriptions_enhanced ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE emr.prescriptions_enhanced ALTER COLUMN tenant_id TYPE VARCHAR(255);
ALTER TABLE emr.prescriptions_enhanced ALTER COLUMN patient_id TYPE VARCHAR(255);
ALTER TABLE emr.prescriptions_enhanced ALTER COLUMN provider_id TYPE VARCHAR(255);

ALTER TABLE emr.inventory_items ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE emr.inventory_items ALTER COLUMN tenant_id TYPE VARCHAR(255);

ALTER TABLE emr.pharmacy_inventory_enhanced ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE emr.pharmacy_inventory_enhanced ALTER COLUMN tenant_id TYPE VARCHAR(255);
ALTER TABLE emr.pharmacy_inventory_enhanced ALTER COLUMN drug_id TYPE VARCHAR(255);

-- 3. RE-ESTABLISH PRIMARY CONSTRAINTS (Unified Core)
ALTER TABLE emr.patients ADD CONSTRAINT patients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.encounters ADD CONSTRAINT encounters_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE CASCADE;
ALTER TABLE emr.appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE CASCADE;
ALTER TABLE emr.invoices ADD CONSTRAINT invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE CASCADE;
ALTER TABLE emr.invoices ADD CONSTRAINT invoices_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES emr.encounters(id) ON DELETE SET NULL;
ALTER TABLE emr.prescriptions_enhanced ADD CONSTRAINT prescriptions_enhanced_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE CASCADE;

-- 4. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA emr TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA emr TO PUBLIC;
