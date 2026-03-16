
-- Migration: 010_additional_roles.sql
-- Description: Adds Lab Assistant, Pharmacist, Insurance Clerk, and Auditor roles

BEGIN;

-- Update USERS table role check constraint
DO $$
DECLARE
    const_record RECORD;
BEGIN
    FOR const_record IN 
        SELECT conname 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'emr' 
          AND t.relname = 'users' 
          AND c.contype = 'c' 
          AND pg_get_constraintdef(c.oid) ILIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE emr.users DROP CONSTRAINT ' || quote_ident(const_record.conname);
    END LOOP;
END $$;

ALTER TABLE emr.users ADD CONSTRAINT users_role_check 
    CHECK (role IN (
        'Superadmin', 'Admin', 'Doctor', 'Nurse', 'Front Office', 
        'Billing', 'Inventory', 'Patient', 'Accountant', 'Supervisor', 
        'Lab', 'Pharmacy', 'Insurance', 'Support Staff',
        'Lab Assistant', 'Pharmacist', 'Insurance Clerk', 'Auditor'
    ));

COMMIT;
