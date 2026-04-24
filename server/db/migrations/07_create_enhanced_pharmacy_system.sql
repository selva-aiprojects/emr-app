-- 07. Enhanced Clinical Pharmacy & Inventory Management System
-- This script (Phase 07) establishes the modernized multi-item pharmacy core

-- Ensure clean state for supporting tables during modernization
DROP TABLE IF EXISTS emr.drug_master CASCADE;
DROP TABLE IF EXISTS emr.pharmacy_inventory_enhanced CASCADE;
DROP TABLE IF EXISTS emr.prescriptions_enhanced CASCADE;
DROP TABLE IF EXISTS emr.prescription_items_enhanced CASCADE;
DROP TABLE IF EXISTS emr.medication_dispensing CASCADE;

-- 1. Drug Master Catalog
CREATE TABLE emr.drug_master (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id),
    name TEXT NOT NULL,
    brand_names TEXT[], 
    generic_name TEXT,
    dosage_form VARCHAR(32), 
    strength VARCHAR(32),
    category VARCHAR(32),
    reorder_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name, generic_name, dosage_form, strength)
);

-- 2. Enhanced Inventory (Batch Tracking)
CREATE TABLE emr.pharmacy_inventory_enhanced (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id),
    drug_id VARCHAR(255) NOT NULL REFERENCES emr.drug_master(id),
    batch_number VARCHAR(32) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    quantity_remaining INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    location VARCHAR(64),
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, drug_id, batch_number)
);

-- 3. Enhanced Prescriptions (Standardized Mapping)
CREATE TABLE emr.prescriptions_enhanced (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id),
    encounter_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL REFERENCES emr.patients(id),
    provider_id VARCHAR(255),
    prescription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validity_days INTEGER DEFAULT 7,
    status VARCHAR(32) DEFAULT 'PENDING',
    notes TEXT,
    ward_id VARCHAR(255),
    bed_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Prescription Items (Detailed Orders)
CREATE TABLE emr.prescription_items_enhanced (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    prescription_id VARCHAR(255) NOT NULL REFERENCES emr.prescriptions_enhanced(id),
    drug_id VARCHAR(255) NOT NULL REFERENCES emr.drug_master(id),
    drug_name TEXT,
    dosage VARCHAR(64),
    frequency VARCHAR(32),
    duration_days INTEGER NOT NULL,
    total_quantity INTEGER NOT NULL,
    quantity_dispensed INTEGER DEFAULT 0,
    instructions TEXT,
    status VARCHAR(32) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Medication Dispensing Registry
CREATE TABLE emr.medication_dispensing (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id),
    prescription_id VARCHAR(255) NOT NULL REFERENCES emr.prescriptions_enhanced(id),
    drug_id VARCHAR(255) NOT NULL REFERENCES emr.drug_master(id),
    batch_id VARCHAR(255) NOT NULL REFERENCES emr.pharmacy_inventory_enhanced(id),
    quantity_dispensed INTEGER NOT NULL,
    dispensed_by VARCHAR(255),
    dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Support Data for NHGL Tenant
INSERT INTO emr.drug_master (tenant_id, name, generic_name, brand_names, dosage_form, strength, category)
SELECT id, 'Amoxicillin', 'Amoxicillin Trihydrate', ARRAY['Amoxil'], 'tablet', '500mg', 'Antibiotic'
FROM emr.tenants WHERE code = 'NHGL'
ON CONFLICT (tenant_id, name, generic_name, dosage_form, strength) DO NOTHING;

INSERT INTO emr.pharmacy_inventory_enhanced (tenant_id, drug_id, batch_number, expiry_date, quantity_received, quantity_remaining, unit_cost, unit_price, status)
SELECT dm.tenant_id, dm.id, 'BATCH-001', '2027-12-31', 5000, 5000, 1.50, 5.00, 'ACTIVE'
FROM emr.drug_master dm 
JOIN emr.tenants t ON dm.tenant_id = t.id
WHERE t.code = 'NHGL' AND dm.name = 'Amoxicillin'
ON CONFLICT (tenant_id, drug_id, batch_number) DO NOTHING;
