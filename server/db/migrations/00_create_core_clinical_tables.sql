-- 00. Unified Clinical Core Schema (Standardized)
-- This script established the foundation for the Unified emr schema
-- Targets: patients, encounters, appointments, invoices, doctors

-- Ensure schemas exist
CREATE SCHEMA IF NOT EXISTS emr;
CREATE SCHEMA IF NOT EXISTS nhgl;

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Hammer: Ensure clean state for core foundation to apply type changes (VARCHAR transition)
DROP TABLE IF EXISTS emr.invoice_items CASCADE;
DROP TABLE IF EXISTS emr.invoices CASCADE;
DROP TABLE IF EXISTS emr.appointments CASCADE;
DROP TABLE IF EXISTS emr.encounters CASCADE;
DROP TABLE IF EXISTS emr.patients CASCADE;

-- 1. Patients (Unified)
CREATE TABLE IF NOT EXISTS emr.patients (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    mrn VARCHAR(32) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Encounters (Clinical Journeys)
CREATE TABLE IF NOT EXISTS emr.encounters (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    provider_id VARCHAR(255), -- References users(id) in emr
    encounter_type VARCHAR(32) DEFAULT 'OPD',
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    diagnosis TEXT,
    chief_complaint TEXT,
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Appointments (Scheduling)
CREATE TABLE IF NOT EXISTS emr.appointments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    provider_id VARCHAR(255),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'scheduled',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Invoices (Billing Core)
CREATE TABLE IF NOT EXISTS emr.invoices (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    encounter_id VARCHAR(255) REFERENCES emr.encounters(id) ON DELETE SET NULL,
    invoice_number VARCHAR(64) UNIQUE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    paid DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(32) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Invoice Items (Detailed Ledger)
CREATE TABLE IF NOT EXISTS emr.invoice_items (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    invoice_id VARCHAR(255) NOT NULL REFERENCES emr.invoices(id) ON DELETE CASCADE,
    service_id VARCHAR(255),
    service_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON emr.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON emr.patients(mrn);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON emr.encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON emr.appointments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON emr.invoices(invoice_number);
