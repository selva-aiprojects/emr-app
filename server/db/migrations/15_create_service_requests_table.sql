-- 15. Create Service Requests Table
-- Standard foundation for Laboratory and other service orders

CREATE TABLE IF NOT EXISTS emr.service_requests (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) NOT NULL,
    patient_id VARCHAR(255) NOT NULL,
    encounter_id VARCHAR(255),
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
CREATE INDEX IF NOT EXISTS idx_service_requests_tenant ON emr.service_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_patient ON emr.service_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON emr.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON emr.service_requests(category);

-- Foreign Key Constraints (References established tables)
-- Neutralized to support architectural isolation (Master Plane Cleanup)
ALTER TABLE emr.service_requests ADD CONSTRAINT sr_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES emr.tenants(id) ON DELETE CASCADE;
-- ALTER TABLE emr.service_requests ADD CONSTRAINT sr_patient_fkey FOREIGN KEY (patient_id) REFERENCES emr.patients(id) ON DELETE CASCADE;
