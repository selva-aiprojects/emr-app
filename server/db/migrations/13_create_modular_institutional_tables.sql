-- 13. Institutional & Modular Expansion
-- Targets: ambulances, bloodbank, service_catalog, facility_masters (wards/beds)

-- 0. Clean state for modular activation (New tables)
DROP TABLE IF EXISTS blood_requests CASCADE;
DROP TABLE IF EXISTS blood_units CASCADE;
DROP TABLE IF EXISTS ambulance_trips CASCADE;
DROP TABLE IF EXISTS ambulances CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- 1. Services Catalog (Price List)
CREATE TABLE services (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE wards (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) DEFAULT 'General',
    base_rate DECIMAL(12,2) DEFAULT 0,
    total_beds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- 1.2 Facility Masters: Beds
CREATE TABLE beds (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    ward_id VARCHAR(255) NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'available', -- available, occupied, maintenance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, ward_id, bed_number)
);

-- 2. Ambulance Fleet
CREATE TABLE ambulances (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE ambulance_trips (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    ambulance_id VARCHAR(255) REFERENCES ambulances(id) ON DELETE SET NULL,
    patient_name VARCHAR(255),
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    priority VARCHAR(16) DEFAULT 'normal',
    status VARCHAR(32) DEFAULT 'En Route',
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Blood Units (Inventory)
CREATE TABLE blood_units (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
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
CREATE TABLE blood_requests (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) REFERENCES patients(id) ON DELETE SET NULL,
    requested_group VARCHAR(10) NOT NULL,
    volume_ml DECIMAL(10,2) NOT NULL,
    priority VARCHAR(16) DEFAULT 'normal',
    urgency_notes TEXT,
    status VARCHAR(32) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wards_tenant ON wards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beds_ward ON beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_tenant ON ambulances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blood_units_group ON blood_units(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);

-- SEED DATA FOR NHGL TENANT (Demo Readiness)
INSERT INTO wards (tenant_id, name, type, base_rate, total_beds)
SELECT id, 'General Ward A', 'General', 1500, 10 FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'ICU Shard 01', 'ICU', 8500, 5 FROM nexus.tenants WHERE code = 'NHGL'
ON CONFLICT DO NOTHING;

INSERT INTO ambulances (tenant_id, vehicle_number, model, status)
SELECT id, 'AMB-001', 'Force Traveller (ICU)', 'Available' FROM nexus.tenants WHERE code = 'NHGL'
ON CONFLICT DO NOTHING;

INSERT INTO services (tenant_id, name, code, category, base_rate)
SELECT id, 'Consultation - General', 'CON-001', 'Clinical', 500 FROM nexus.tenants WHERE code = 'NHGL'
ON CONFLICT DO NOTHING;
