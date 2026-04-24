-- 03. OPD Billing System for Outpatient Services
-- This script (Phase 03) establishes the core billing ledger for clinic visits

-- Ensure clean state for supporting tables during modernization
DROP TABLE IF EXISTS emr.opd_bills CASCADE;
DROP TABLE IF EXISTS emr.opd_bill_counters CASCADE;
DROP TABLE IF EXISTS emr.opd_bill_items CASCADE;
DROP TABLE IF EXISTS emr.opd_service_packages CASCADE;
DROP TABLE IF EXISTS emr.opd_package_items CASCADE;

CREATE TABLE emr.opd_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    token_id UUID REFERENCES emr.opd_tokens(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES emr.appointments(id) ON DELETE SET NULL,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bill_time TIME NOT NULL DEFAULT CURRENT_TIME,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'cancelled', 'refunded')),
    
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(10),
    visit_type VARCHAR(20) DEFAULT 'new' CHECK (visit_type IN ('new', 'follow_up', 'consultation', 'emergency')),
    department_id UUID,
    doctor_id UUID,
    
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bill counters for daily billing sequence reset
CREATE TABLE emr.opd_bill_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    counter_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_bill_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, counter_date)
);

-- Trigger logic (Corrected Syntax and Drop)
CREATE OR REPLACE FUNCTION update_opd_bill_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_opd_bill_updated_at ON emr.opd_bills;
CREATE TRIGGER trigger_opd_bill_updated_at
    BEFORE UPDATE ON emr.opd_bills
    FOR EACH ROW
    EXECUTE FUNCTION update_opd_bill_updated_at();

-- Function to generate next bill number
CREATE OR REPLACE FUNCTION get_next_bill_number(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    next_bill_number INTEGER;
    bill_prefix VARCHAR(20);
    bill_number VARCHAR(50);
BEGIN
    INSERT INTO emr.opd_bill_counters (tenant_id, counter_date, current_bill_number)
    VALUES (p_tenant_id, CURRENT_DATE, 1)
    ON CONFLICT (tenant_id, counter_date) 
    DO UPDATE SET current_bill_number = opd_bill_counters.current_bill_number + 1
    RETURNING current_bill_number INTO next_bill_number;
    
    bill_prefix := 'OPD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    bill_number := bill_prefix || '-' || LPAD(next_bill_number::text, 4, '0');
    
    RETURN bill_number;
END;
$$ LANGUAGE plpgsql;
