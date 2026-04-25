-- 14. Complete Institutional Masters
-- Targets: Wards, Beds, Departments, Documents, Ambulances, Blood Bank

-- 0. Clean state for institutional masters
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_audit_logs CASCADE;
DROP TABLE IF EXISTS blood_requests CASCADE;
DROP TABLE IF EXISTS blood_units CASCADE;
DROP TABLE IF EXISTS ambulance_trips CASCADE;
DROP TABLE IF EXISTS ambulances CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- 1. Departments are now managed in migration 00


-- 2. Services Catalog (Price List)
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

-- 3. Facility Masters: Wards
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

-- 4. Facility Masters: Beds
CREATE TABLE beds (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    ward_id VARCHAR(255) NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, ward_id, bed_number)
);

-- 5. Digital File Room: Documents
CREATE TABLE documents (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) REFERENCES patients(id) ON DELETE SET NULL,
    encounter_id VARCHAR(255) REFERENCES encounters(id) ON DELETE SET NULL,
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

CREATE TABLE document_audit_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL, -- upload, download, delete, restore
    actor_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Ambulance Fleet
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

-- 7. Ambulance Missions (Trips)
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

-- 8. Blood Bank: Inventory
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

-- 9. Blood Bank: Requests
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

-- 11. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_tenant_14 ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wards_tenant_14 ON wards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beds_ward_14 ON beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_14 ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient_14 ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_tenant_14 ON ambulances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blood_units_group_14 ON blood_units(blood_group);

-- SEED DATA FOR NHGL TENANT
INSERT INTO departments (tenant_id, name, code, is_active)
SELECT id, 'Emergency & Trauma', 'EME-01', true FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'Cardiology', 'CARD-01', true FROM nexus.tenants WHERE code = 'NHGL'
UNION ALL
SELECT id, 'Outpatient Department', 'OPD-01', true FROM nexus.tenants WHERE code = 'NHGL'
ON CONFLICT DO NOTHING;

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
