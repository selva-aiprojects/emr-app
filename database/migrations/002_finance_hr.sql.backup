
-- Migration: 002_finance_hr.sql
-- Description: Adds tables for Attendance and Expenses (Petty Cash / Accounts)

BEGIN;

-- =====================================================
-- ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in timestamptz,
  check_out timestamptz,
  status varchar(16) DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Half-Day', 'Leave')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, employee_id, date)
);

-- =====================================================
-- EXPENSES TABLE (Accounts Payable / Outflow)
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  category varchar(64) NOT NULL CHECK (category IN ('Salary', 'Purchase', 'Maintenance', 'Utilities', 'Certifications', 'Govt Fees', 'Subscriptions', 'Equipment', 'Other')),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method varchar(32) DEFAULT 'Bank Transfer',
  reference text, -- Check number, Transaction ID
  recorded_by VARCHAR(255) REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON emr.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON emr.attendance(date);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON emr.expenses(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON emr.expenses(category);

-- Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_attendance_updated_at') THEN
        CREATE TRIGGER trg_attendance_updated_at BEFORE UPDATE ON emr.attendance 
        FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_expenses_updated_at') THEN
        CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON emr.expenses 
        FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();
    END IF;
END $$;

COMMIT;
