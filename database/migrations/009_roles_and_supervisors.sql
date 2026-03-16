
-- Migration: 009_roles_and_supervisors.sql
-- Description: Adds Accountant and Supervisor roles, and supervisor hierarchy in employees

BEGIN;

-- 1. Update USERS table role check constraint
-- We drop any existing role check constraint and recreate it with the new roles.
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
        'Lab', 'Pharmacy', 'Insurance', 'Support Staff'
    ));

-- 2. Add supervisor_id to EMPLOYEES table
ALTER TABLE emr.employees ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES emr.employees(id) ON DELETE SET NULL;

COMMIT;
