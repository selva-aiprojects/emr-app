-- Migration: Billing Infrastructure Fix (V2)
-- Description: Creates nexus.invoices and nexus.invoice_items, and enhances nexus.expenses 
-- with UUID tenant_id but without explicit FK to tenants table to match existing clinical architecture.

BEGIN;

-- 1. Create Invoices Table
CREATE TABLE IF NOT EXISTS nexus.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL, -- UUID to match patients/users pattern
  patient_id uuid NOT NULL REFERENCES nexus.patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES nexus.encounters(id) ON DELETE SET NULL,
  invoice_number varchar(64) NOT NULL,
  description text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  paid numeric(12,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'void')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

-- 2. Create Invoice Items Table
CREATE TABLE IF NOT EXISTS nexus.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL REFERENCES nexus.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  code text,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enhance Expenses Table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'nexus') THEN
        ALTER TABLE nexus.expenses 
        ADD COLUMN IF NOT EXISTS payment_method varchar(64),
        ADD COLUMN IF NOT EXISTS reference text,
        ADD COLUMN IF NOT EXISTS recorded_by uuid REFERENCES nexus.users(id);
    END IF;
END $$;

COMMIT;
