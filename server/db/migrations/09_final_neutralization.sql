-- 09_final_neutralization.sql
-- Aggressive neutralization of types in NHGL shard

DO $$ 
BEGIN
    -- Force ID column in inventory_items to VARCHAR
    EXECUTE 'ALTER TABLE nhgl.inventory_items ALTER COLUMN id TYPE VARCHAR(255) USING id::text';
    EXECUTE 'ALTER TABLE nhgl.inventory_items ALTER COLUMN tenant_id TYPE VARCHAR(255) USING tenant_id::text';
    
    -- Force ID column in patients to VARCHAR
    EXECUTE 'ALTER TABLE nhgl.patients ALTER COLUMN id TYPE VARCHAR(255) USING id::text';
    EXECUTE 'ALTER TABLE nhgl.patients ALTER COLUMN tenant_id TYPE VARCHAR(255) USING tenant_id::text';

EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Neutralization failed: %', SQLERRM;
END $$;
