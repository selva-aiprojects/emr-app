-- 01. Institutional Employees & Workforce Shard
-- Foundation for Finance, HR, and Clinical Attendance

-- Ensure the emr schema exists
CREATE SCHEMA IF NOT EXISTS emr;

-- Ensure the employees table exists for HR/Finance modules
CREATE TABLE IF NOT EXISTS emr.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    designation VARCHAR(100) NOT NULL DEFAULT 'Staff',
    role VARCHAR(64) NOT NULL DEFAULT 'Support Staff',
    department_id uuid, -- Optional link to departments if created later
    join_date DATE DEFAULT CURRENT_DATE,
    salary_basis DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON emr.employees;
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON emr.employees 
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON emr.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON emr.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_designation ON emr.employees(designation);
