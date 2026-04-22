-- Migration: Inventory Table Fix
-- Description: Creates emr.inventory_transactions table for NAH seeding compatibility.

BEGIN;

-- 1. Create inventory_transactions table
CREATE TABLE IF NOT EXISTS emr.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES emr.inventory_items(id) ON DELETE CASCADE,
  transaction_type varchar(20) NOT NULL CHECK (transaction_type IN ('receipt', 'issue', 'adjustment', 'transfer')),
  quantity numeric(10,2) NOT NULL,
  reference text,
  created_by uuid REFERENCES emr.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
