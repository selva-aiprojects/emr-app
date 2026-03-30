-- OPD Billing System for Outpatient Services
-- This table manages billing for OPD services

CREATE TABLE IF NOT EXISTS emr.opd_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    token_id UUID REFERENCES emr.opd_tokens(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES emr.appointments(id) ON DELETE SET NULL,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bill_time TIME NOT NULL DEFAULT CURRENT_TIME,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'cancelled', 'refunded')),
    
    -- Patient and visit information
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(10),
    visit_type VARCHAR(20) DEFAULT 'new' CHECK (visit_type IN ('new', 'follow_up', 'consultation', 'emergency')),
    department_id UUID REFERENCES emr.departments(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES emr.users(id) ON DELETE SET NULL,
    department_name VARCHAR(255),
    doctor_name VARCHAR(255),
    
    -- Financial details
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Payment details
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'cash', 'card', 'online', 'insurance', 'multiple')),
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Insurance details
    insurance_provider VARCHAR(255),
    policy_number VARCHAR(255),
    insurance_claim_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    insurance_approved BOOLEAN DEFAULT false,
    insurance_claim_id VARCHAR(255),
    
    -- Additional charges
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    procedure_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    lab_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    medicine_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    other_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Notes and metadata
    notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id),
    updated_by UUID REFERENCES emr.users(id)
);

-- Bill items table for detailed service breakdown
CREATE TABLE IF NOT EXISTS emr.opd_bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES emr.opd_bills(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('consultation', 'procedure', 'lab', 'medicine', 'other')),
    service_name VARCHAR(255) NOT NULL,
    service_code VARCHAR(100),
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    doctor_id UUID REFERENCES emr.users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES emr.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id)
);

-- Service packages for OPD
CREATE TABLE IF NOT EXISTS emr.opd_service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    package_type VARCHAR(50) NOT NULL CHECK (package_type IN ('consultation', 'health_checkup', 'special', 'corporate')),
    department_id UUID REFERENCES emr.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discounted_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    includes_consultation BOOLEAN DEFAULT false,
    includes_lab_tests BOOLEAN DEFAULT false,
    includes_medicines BOOLEAN DEFAULT false,
    includes_procedures BOOLEAN DEFAULT false,
    max_usage_count INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id),
    updated_by UUID REFERENCES emr.users(id)
);

-- Package items
CREATE TABLE IF NOT EXISTS emr.opd_package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES emr.opd_service_packages(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('consultation', 'procedure', 'lab', 'medicine', 'other')),
    service_name VARCHAR(255) NOT NULL,
    service_code VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bill counters for unique bill numbers
CREATE TABLE IF NOT EXISTS emr.opd_bill_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    counter_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_bill_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, counter_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_opd_bills_tenant ON emr.opd_bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opd_bills_patient ON emr.opd_bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_bills_token ON emr.opd_bills(token_id);
CREATE INDEX IF NOT EXISTS idx_opd_bills_appointment ON emr.opd_bills(appointment_id);
CREATE INDEX IF NOT EXISTS idx_opd_bills_status ON emr.opd_bills(status);
CREATE INDEX IF NOT EXISTS idx_opd_bills_date ON emr.opd_bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_opd_bills_department ON emr.opd_bills(department_id);
CREATE INDEX IF NOT EXISTS idx_opd_bills_doctor ON emr.opd_bills(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_bills_bill_number ON emr.opd_bills(bill_number);

CREATE INDEX IF NOT EXISTS idx_opd_bill_items_tenant ON emr.opd_bill_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opd_bill_items_bill ON emr.opd_bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_opd_bill_items_service_type ON emr.opd_bill_items(service_type);

CREATE INDEX IF NOT EXISTS idx_opd_service_packages_tenant ON emr.opd_service_packages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opd_service_packages_active ON emr.opd_service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_opd_service_packages_department ON emr.opd_service_packages(department_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opd_bill_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS trigger_opd_bill_updated_at
    BEFORE UPDATE ON emr.opd_bills
    FOR EACH ROW
    EXECUTE FUNCTION update_opd_bill_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_opd_service_package_updated_at
    BEFORE UPDATE ON emr.opd_service_packages
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
    -- Get or create counter for today
    INSERT INTO emr.opd_bill_counters (tenant_id, counter_date, current_bill_number)
    VALUES (p_tenant_id, CURRENT_DATE, 1)
    ON CONFLICT (tenant_id, counter_date) 
    DO UPDATE SET current_bill_number = opd_bill_counters.current_bill_number + 1
    RETURNING current_bill_number INTO next_bill_number;
    
    -- Generate bill number with prefix
    bill_prefix := 'OPD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    bill_number := bill_prefix || '-' || LPAD(next_bill_number::text, 4, '0');
    
    RETURN bill_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate bill totals
CREATE OR REPLACE FUNCTION calculate_bill_totals(p_bill_id UUID)
RETURNS VOID AS $$
DECLARE
    total_subtotal DECIMAL(10,2) := 0;
    total_tax DECIMAL(10,2) := 0;
    total_discount DECIMAL(10,2) := 0;
    total_amount DECIMAL(10,2) := 0;
BEGIN
    -- Calculate totals from bill items
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(tax_amount), 0),
        COALESCE(SUM(discount_amount), 0)
    INTO total_subtotal, total_tax, total_discount
    FROM emr.opd_bill_items 
    WHERE bill_id = p_bill_id;
    
    -- Calculate final total
    total_amount := total_subtotal + total_tax - total_discount;
    
    -- Update bill with calculated totals
    UPDATE emr.opd_bills 
    SET 
        subtotal = total_subtotal,
        tax_amount = total_tax,
        discount_amount = total_discount,
        total_amount = total_amount,
        balance_amount = total_amount - paid_amount
    WHERE id = p_bill_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE emr.opd_bills IS 'Main OPD billing table for outpatient services';
COMMENT ON TABLE emr.opd_bill_items IS 'Detailed line items for OPD bills';
COMMENT ON TABLE emr.opd_service_packages IS 'Predefined service packages for OPD billing';
COMMENT ON TABLE emr.opd_package_items IS 'Items included in service packages';
COMMENT ON TABLE emr.opd_bill_counters IS 'Counters for generating unique bill numbers';
