-- SMS/Email Communication System for OPD
-- This table manages all communications sent to patients

CREATE TABLE IF NOT EXISTS emr.communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('sms', 'email', 'whatsapp')),
    purpose VARCHAR(100) NOT NULL CHECK (purpose IN ('appointment_reminder', 'token_call', 'billing_reminder', 'follow_up', 'welcome', 'test_results', 'payment_confirmation')),
    subject VARCHAR(255), -- For email templates
    message_content TEXT NOT NULL,
    variables TEXT, -- JSON array of available variables
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id),
    updated_by UUID REFERENCES emr.users(id)
);

CREATE TABLE IF NOT EXISTS emr.patient_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES emr.appointments(id) ON DELETE SET NULL,
    token_id UUID REFERENCES emr.opd_tokens(id) ON DELETE SET NULL,
    bill_id UUID REFERENCES emr.opd_bills(id) ON DELETE SET NULL,
    
    -- Communication details
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('sms', 'email', 'whatsapp')),
    purpose VARCHAR(100) NOT NULL CHECK (purpose IN ('appointment_reminder', 'token_call', 'billing_reminder', 'follow_up', 'welcome', 'test_results', 'payment_confirmation', 'custom')),
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    subject VARCHAR(255), -- For email communications
    message_content TEXT NOT NULL,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'read')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    
    -- External service tracking
    external_id VARCHAR(255), -- SMS gateway ID, email message ID, etc.
    provider VARCHAR(100), -- SMS provider, email service, etc.
    delivery_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    template_id UUID REFERENCES emr.communication_templates(id) ON DELETE SET NULL,
    variables_used TEXT, -- JSON object with actual values used
    scheduled_for TIMESTAMP WITH TIME ZONE,
    is_automated BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1, -- 1=normal, 2=high, 3=urgent
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id)
);

CREATE TABLE IF NOT EXISTS emr.communication_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN ('string', 'boolean', 'integer', 'json')),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES emr.users(id),
    
    UNIQUE(tenant_id, setting_key)
);

CREATE TABLE IF NOT EXISTS emr.communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    communication_id UUID REFERENCES emr.patient_communications(id) ON DELETE CASCADE,
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('info', 'warning', 'error', 'debug')),
    message TEXT NOT NULL,
    details TEXT, -- JSON object with additional details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_templates_tenant ON emr.communication_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON emr.communication_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_communication_templates_purpose ON emr.communication_templates(purpose);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON emr.communication_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_patient_communications_tenant ON emr.patient_communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_patient ON emr.patient_communications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_appointment ON emr.patient_communications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_token ON emr.patient_communications(token_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_bill ON emr.patient_communications(bill_id);
CREATE INDEX IF NOT EXISTS idx_patient_communications_type ON emr.patient_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_patient_communications_purpose ON emr.patient_communications(purpose);
CREATE INDEX IF NOT EXISTS idx_patient_communications_status ON emr.patient_communications(status);
CREATE INDEX IF NOT EXISTS idx_patient_communications_scheduled ON emr.patient_communications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_patient_communications_created ON emr.patient_communications(created_at);

CREATE INDEX IF NOT EXISTS idx_communication_settings_tenant ON emr.communication_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communication_settings_key ON emr.communication_settings(setting_key);

CREATE INDEX IF NOT EXISTS idx_communication_logs_tenant ON emr.communication_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_communication ON emr.communication_logs(communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_level ON emr.communication_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created ON emr.communication_logs(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_communication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS trigger_communication_template_updated_at
    BEFORE UPDATE ON emr.communication_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_communication_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_patient_communication_updated_at
    BEFORE UPDATE ON emr.patient_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_communication_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_communication_setting_updated_at
    BEFORE UPDATE ON emr.communication_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_communication_updated_at();

-- Function to replace template variables
CREATE OR REPLACE FUNCTION replace_template_variables(p_template TEXT, p_variables JSONB)
RETURNS TEXT AS $$
DECLARE
    result TEXT := p_template;
    variable_record JSONB;
    variable_key TEXT;
    variable_value TEXT;
BEGIN
    -- Iterate through all variables in the JSON object
    FOR variable_record IN SELECT * FROM jsonb_each_text(p_variables) LOOP
        variable_key := variable_record.key;
        variable_value := COALESCE(variable_record.value, '');
        
        -- Replace {{variable}} with actual value
        result := REPLACE(result, '{{' || variable_key || '}}', variable_value);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to send communication (creates record and returns ID)
CREATE OR REPLACE FUNCTION create_communication(
    p_tenant_id UUID,
    p_patient_id UUID,
    p_communication_type VARCHAR(50),
    p_purpose VARCHAR(100),
    p_message_content TEXT,
    p_recipient_phone VARCHAR(20) DEFAULT NULL,
    p_recipient_email VARCHAR(255) DEFAULT NULL,
    p_subject VARCHAR(255) DEFAULT NULL,
    p_appointment_id UUID DEFAULT NULL,
    p_token_id UUID DEFAULT NULL,
    p_bill_id UUID DEFAULT NULL,
    p_template_id UUID DEFAULT NULL,
    p_variables_used JSONB DEFAULT NULL,
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_is_automated BOOLEAN DEFAULT false,
    p_priority INTEGER DEFAULT 1,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    communication_id UUID;
BEGIN
    -- Create communication record
    INSERT INTO emr.patient_communications (
        tenant_id, patient_id, communication_type, purpose, message_content,
        recipient_phone, recipient_email, subject, appointment_id, token_id, bill_id,
        template_id, variables_used, scheduled_for, is_automated, priority, created_by
    )
    VALUES (
        p_tenant_id, p_patient_id, p_communication_type, p_purpose, p_message_content,
        p_recipient_phone, p_recipient_email, p_subject, p_appointment_id, p_token_id, p_bill_id,
        p_template_id, p_variables_used, p_scheduled_for, p_is_automated, p_priority, p_created_by
    )
    RETURNING id INTO communication_id;
    
    RETURN communication_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get communication setting
CREATE OR REPLACE FUNCTION get_communication_setting(p_tenant_id UUID, p_setting_key VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT setting_value INTO setting_value
    FROM emr.communication_settings
    WHERE tenant_id = p_tenant_id AND setting_key = p_setting_key;
    
    RETURN COALESCE(setting_value, '');
END;
$$ LANGUAGE plpgsql;

-- Insert default communication settings
INSERT INTO emr.communication_settings (tenant_id, setting_key, setting_value, setting_type, description)
SELECT 
    t.id,
    'sms_enabled',
    'false',
    'boolean',
    'Enable SMS communications'
FROM emr.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM emr.communication_settings cs 
    WHERE cs.tenant_id = t.id AND cs.setting_key = 'sms_enabled'
);

INSERT INTO emr.communication_settings (tenant_id, setting_key, setting_value, setting_type, description)
SELECT 
    t.id,
    'email_enabled',
    'true',
    'boolean',
    'Enable email communications'
FROM emr.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM emr.communication_settings cs 
    WHERE cs.tenant_id = t.id AND cs.setting_key = 'email_enabled'
);

INSERT INTO emr.communication_settings (tenant_id, setting_key, setting_value, setting_type, description)
SELECT 
    t.id,
    'appointment_reminder_hours',
    '24',
    'integer',
    'Hours before appointment to send reminder'
FROM emr.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM emr.communication_settings cs 
    WHERE cs.tenant_id = t.id AND cs.setting_key = 'appointment_reminder_hours'
);

-- Comments
COMMENT ON TABLE emr.communication_templates IS 'Templates for SMS, email, and WhatsApp communications';
COMMENT ON TABLE emr.patient_communications IS 'Log of all communications sent to patients';
COMMENT ON TABLE emr.communication_settings IS 'System settings for communication features';
COMMENT ON TABLE emr.communication_logs IS 'Detailed logs for communication system';
