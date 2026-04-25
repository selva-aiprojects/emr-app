-- 15. Create Service Requests Table
-- Standard foundation for Laboratory and other service orders

CREATE TABLE IF NOT EXISTS service_requests (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL REFERENCES nexus.tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(255) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id VARCHAR(255) REFERENCES encounters(id) ON DELETE SET NULL,
    requester_id VARCHAR(255),
    category VARCHAR(64) DEFAULT 'lab',
    code VARCHAR(64),
    display VARCHAR(255),
    status VARCHAR(32) DEFAULT 'pending',
    priority VARCHAR(32) DEFAULT 'routine',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_tenant ON service_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_patient ON service_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON service_requests(category);
