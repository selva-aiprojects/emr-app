-- Migration: Inventory Table Fix
-- Description: Creates nexus.inventory_transactions table for NAH seeding compatibility.

BEGIN;

-- 1. Create inventory_transactions table (only if inventory_items exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items' AND table_schema = 'nexus') THEN
        CREATE TABLE IF NOT EXISTS nexus.inventory_transactions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          item_id uuid NOT NULL REFERENCES nexus.inventory_items(id) ON DELETE CASCADE,
          transaction_type varchar(20) NOT NULL CHECK (transaction_type IN ('receipt', 'issue', 'adjustment', 'transfer')),
          quantity numeric(10,2) NOT NULL,
          reference text,
          created_by uuid REFERENCES nexus.users(id),
          created_at timestamptz NOT NULL DEFAULT now()
        );
    END IF;
END $$;

COMMIT;
