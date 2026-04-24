-- 14. Complete Institutional Masters
-- Targets: Wards, Beds, Departments, Documents, Ambulances, Blood Bank

CREATE SCHEMA IF NOT EXISTS emr;

-- 0. Clean state for institutional masters
DROP TABLE IF EXISTS emr.documents CASCADE;
DROP TABLE IF EXISTS emr.document_audit_logs CASCADE;
DROP TABLE IF EXISTS emr.blood_requests CASCADE;
DROP TABLE IF EXISTS emr.blood_units CASCADE;
DROP TABLE IF EXISTS emr.ambulance_trips CASCADE;
DROP TABLE IF EXISTS emr.ambulances CASCADE;
DROP TABLE IF EXISTS emr.beds CASCADE;
DROP TABLE IF EXISTS emr.wards CASCADE;
DROP TABLE IF EXISTS emr.departments CASCADE;
DROP TABLE IF EXISTS emr.services CASCADE;

-- 0.1 Seed Administrator Identity (Consistent with Clinical Bypass)
-- This ensures the NHGL admin user exists in the sharded identity pool
INSERT INTO emr.users (id, tenant_id, name, email, role, is_active)
VALUES ('44000000-0000-0000-0000-000000000001', 'b01f0cdc-4e8b-4db5-ba71-e657a414695e', 'NHGL Administrator', 'admin@nhgl.com', 'Admin', true)
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- 1. Departments Master (Organizational Shard)
CREATE TABLE emr.departments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64),
    description TEXT,
    head_of_dept VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- 2. Services Catalog (Price List)
CREATE TABLE emr.services (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL,
    category VARCHAR(64) DEFAULT 'Clinical',
    base_rate DECIMAL(12,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- 3. Facility Masters: Wards
CREATE TABLE emr.wards (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) DEFAULT 'General',
    base_rate DECIMAL(12,2) DEFAULT 0,
    total_beds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- 4. Facility Masters: Beds
CREATE TABLE emr.beds (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    ward_id VARCHAR(255) NOT NULL,
    bed_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, ward_id, bed_number)
);

-- 5. Digital File Room: Documents
CREATE TABLE emr.documents (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255),
    encounter_id VARCHAR(255),
    category VARCHAR(64) DEFAULT 'other',
    title VARCHAR(255) NOT NULL,
    file_name TEXT NOT NULL,
    mime_type VARCHAR(128),
    storage_key TEXT,
    size_bytes BIGINT DEFAULT 0,
    tags JSONB DEFAULT '[]',
    uploaded_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE emr.document_audit_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    document_id VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL, -- upload, download, delete, restore
    actor_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Ambulance Fleet
CREATE TABLE emr.ambulances (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(64) NOT NULL,
    model VARCHAR(255),
    current_driver VARCHAR(255),
    contact_number VARCHAR(32),
    status VARCHAR(32) DEFAULT 'Available',
    last_location_lat DECIMAL(10,8),
    last_location_lng DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, vehicle_number)
);

-- 7. Ambulance Missions (Trips)
CREATE TABLE emr.ambulance_trips (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    ambulance_id VARCHAR(255),
    patient_name VARCHAR(255),
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    priority VARCHAR(16) DEFAULT 'normal',
    status VARCHAR(32) DEFAULT 'En Route',
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Blood Bank: Inventory
CREATE TABLE emr.blood_units (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    volume_ml DECIMAL(10,2) NOT NULL,
    donor_name VARCHAR(255),
    donor_contact VARCHAR(32),
    expiry_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'Available',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Blood Bank: Requests
CREATE TABLE emr.blood_requests (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255),
    requested_group VARCHAR(10) NOT NULL,
    volume_ml DECIMAL(10,2) NOT NULL,
    priority VARCHAR(16) DEFAULT 'normal',
    urgency_notes TEXT,
    status VARCHAR(32) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Add Foreign Key Constraints
ALTER TABLE emr.departments ADD CONSTRAINT departments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.services ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.wards ADD CONSTRAINT wards_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.beds ADD CONSTRAINT beds_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.beds ADD CONSTRAINT beds_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES emr.wards(id) ON DELETE CASCADE;
ALTER TABLE emr.documents ADD CONSTRAINT documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.documents ADD CONSTRAINT documents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE SET NULL;
ALTER TABLE emr.ambulances ADD CONSTRAINT ambulances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.ambulance_trips ADD CONSTRAINT ambulance_trips_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.ambulance_trips ADD CONSTRAINT ambulance_trips_ambulance_id_fkey FOREIGN KEY (ambulance_id) REFERENCES emr.ambulances(id) ON DELETE SET NULL;
ALTER TABLE emr.blood_units ADD CONSTRAINT blood_units_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.blood_requests ADD CONSTRAINT blood_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.blood_requests ADD CONSTRAINT blood_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE SET NULL;

-- 11. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_tenant_14 ON emr.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wards_tenant_14 ON emr.wards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beds_ward_14 ON emr.beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_14 ON emr.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient_14 ON emr.documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_tenant_14 ON emr.ambulances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blood_units_group_14 ON emr.blood_units(blood_group);

-- SEED DATA FOR NHGL TENANT
INSERT INTO emr.departments (tenant_id, name, code, is_active)
VALUES ('b01f0cdc-4e8b-4db5-ba71-e657a414695e', 'Emergency & Trauma', 'EME-01', true),
       ('b01f0cdc-4e8b-4db5-ba71-e657a414695e', 'Cardiology', 'CARD-01', true),
       ('b01f0cdc-4e8b-4db5-ba71-e657a414695e', 'Outpatient Department', 'OPD-01', true)
ON CONFLICT DO NOTHING;

INSERT INTO emr.wards (tenant_id, name, type, base_rate, total_beds)
VALUES ('b01f0cdc-4e8b-4db5-ba71-e657a414695e', 'General Ward A', 'General', 1500, 10),
       ('b01f0cdc-4e8b-4db5-ba71-e657a414695e', 'ICU Shard 01', 'ICU', 8500, 5)
ON CONFLICT DO NOTHING;

INSERT INTO emr.ambulances (tenant_id, vehicle_number, model, status)
VALUES ('b01f0cdc-4e8b-4db5-ba71-e657a414695e', 'AMB-001', 'Force Traveller (ICU)', 'Available')
ON CONFLICT DO NOTHING;

INSERT INTO emr.services (tenant_id, name, code, category, base_rate)
VALUES ('b01f0cdc-4e8b-4db5-ba71-e657a414695e', 'Consultation - General', 'CON-001', 'Clinical', 500)
ON CONFLICT DO NOTHING;
