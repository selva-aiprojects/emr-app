-- Migration 23: Restore missing columns on nexus.users
-- Design Decision: patient_id is INTENTIONALLY EXCLUDED from users table.
-- User (auth entity) <-> Patient (clinical entity) separation is enforced.
-- Doctor-patient relationships are managed via appointments and encounters tables.

-- 1. Add role text column if missing (auth middleware queries u.role directly)
ALTER TABLE nexus.users ADD COLUMN IF NOT EXISTS role VARCHAR(100);

-- 2. Backfill role from role_id if role column is null and role_id is set
UPDATE nexus.users
SET role = role_id
WHERE role IS NULL AND role_id IS NOT NULL;

-- 3. Add last_login column if missing (user.service.js tracks last session)
ALTER TABLE nexus.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 4. Drop patient_id from users if it exists (bad design — belongs in mapping tables)
ALTER TABLE nexus.users DROP COLUMN IF EXISTS patient_id;

-- 5. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON nexus.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON nexus.users(tenant_id);
