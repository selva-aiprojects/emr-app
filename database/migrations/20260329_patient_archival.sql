-- Migration: Add Archival Support to Patients
BEGIN;

ALTER TABLE nexus.patients 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid;

CREATE INDEX IF NOT EXISTS idx_patients_archived ON nexus.patients(tenant_id, is_archived);

-- Also add approval columns for sensitive CRUD as per Healthezee.md Section 4.5
ALTER TABLE nexus.patients
ADD COLUMN IF NOT EXISTS approval_status varchar(16) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS last_modified_by uuid;

COMMIT;
