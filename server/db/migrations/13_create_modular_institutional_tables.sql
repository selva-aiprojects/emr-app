-- 13. Institutional & Modular Expansion
-- Targets: ambulances, bloodbank, service_catalog, facility_masters (wards/beds)

CREATE SCHEMA IF NOT EXISTS emr;

-- 0. Clean state for modular activation (New tables)
DROP TABLE IF EXISTS emr.blood_requests CASCADE;
DROP TABLE IF EXISTS emr.blood_units CASCADE;
DROP TABLE IF EXISTS emr.ambulance_trips CASCADE;
DROP TABLE IF EXISTS emr.ambulances CASCADE;
DROP TABLE IF EXISTS emr.beds CASCADE;
DROP TABLE IF EXISTS emr.wards CASCADE;
DROP TABLE IF EXISTS emr.services CASCADE;

-- 1. Services Catalog (Price List)
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

-- 1.1 Facility Masters: Wards
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

-- 1.2 Facility Masters: Beds
CREATE TABLE emr.beds (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    ward_id VARCHAR(255) NOT NULL,
    bed_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'available', -- available, occupied, maintenance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, ward_id, bed_number)
);

-- 2. Ambulance Fleet
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

-- 3. Ambulance Missions (Trips)
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

-- 4. Blood Units (Inventory)
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

-- 5. Blood Requests (Clinical Demand)
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

-- 6. Add Foreign Key Constraints (Decoupled Implementation)
ALTER TABLE emr.services ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.wards ADD CONSTRAINT wards_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.beds ADD CONSTRAINT beds_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.beds ADD CONSTRAINT beds_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES emr.wards(id) ON DELETE CASCADE;
ALTER TABLE emr.ambulances ADD CONSTRAINT ambulances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.ambulance_trips ADD CONSTRAINT ambulance_trips_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.ambulance_trips ADD CONSTRAINT ambulance_trips_ambulance_id_fkey FOREIGN KEY (ambulance_id) REFERENCES emr.ambulances(id) ON DELETE SET NULL;
ALTER TABLE emr.blood_units ADD CONSTRAINT blood_units_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.blood_requests ADD CONSTRAINT blood_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
ALTER TABLE emr.blood_requests ADD CONSTRAINT blood_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE SET NULL;

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_tenant ON emr.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wards_tenant ON emr.wards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beds_ward ON emr.beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_tenant ON emr.ambulances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blood_units_group ON emr.blood_units(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON emr.blood_requests(status);

-- SEED DATA FOR NHGL TENANT (Demo Readiness)
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
