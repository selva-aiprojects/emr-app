-- Exotel SMS Provider Integration
-- This table manages Exotel SMS provider configuration and workflows

CREATE TABLE IF NOT EXISTS emr.exotel_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    account_sid VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    api_token VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    webhook_url VARCHAR(500),
    delivery_report_webhook VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id),
    updated_by UUID REFERENCES emr.users(id),
    
    UNIQUE(tenant_id, account_sid)
);

CREATE TABLE IF NOT EXISTS emr.exotel_sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('appointment_reminder', 'token_call', 'billing_reminder', 'marketing', 'emergency', 'custom')),
    description TEXT,
    template_id UUID REFERENCES emr.communication_templates(id) ON DELETE SET NULL,
    target_audience VARCHAR(50) NOT NULL CHECK (target_audience IN ('all_patients', 'specific_patients', 'department', 'doctor', 'custom')),
    filters JSONB, -- JSON object with filter criteria
    schedule_type VARCHAR(50) DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    recurring_pattern JSONB, -- JSON object for recurring schedules
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id),
    updated_by UUID REFERENCES emr.users(id)
);

CREATE TABLE IF NOT EXISTS emr.exotel_sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES emr.exotel_sms_campaigns(id) ON DELETE SET NULL,
    communication_id UUID REFERENCES emr.patient_communications(id) ON DELETE SET NULL,
    message_sid VARCHAR(255), -- Exotel message SID
    account_sid VARCHAR(255), -- Exotel account SID
    from_number VARCHAR(20),
    to_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'transactional' CHECK (message_type IN ('transactional', 'promotional', 'otp')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'undelivered', 'failed', 'rejected', 'expired')),
    error_code VARCHAR(50),
    error_message TEXT,
    delivery_status VARCHAR(50),
    delivery_timestamp TIMESTAMP WITH TIME ZONE,
    sent_timestamp TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(10,4),
    currency VARCHAR(3) DEFAULT 'INR',
    external_id VARCHAR(255), -- External reference ID
    webhook_data JSONB, -- Webhook response data
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emr.exotel_number_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    pool_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    number_type VARCHAR(50) NOT NULL CHECK (number_type IN ('transactional', 'promotional', 'otp', 'voice')),
    department_id UUID REFERENCES emr.departments(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES emr.users(id) ON DELETE SET NULL,
    daily_limit INTEGER DEFAULT 1000,
    monthly_limit INTEGER DEFAULT 30000,
    current_daily_usage INTEGER DEFAULT 0,
    current_monthly_usage INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1, -- Lower number = higher priority
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES emr.users(id),
    updated_by UUID REFERENCES emr.users(id),
    
    UNIQUE(tenant_id, phone_number)
);

CREATE TABLE IF NOT EXISTS emr.exotel_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    message_sid VARCHAR(255),
    account_sid VARCHAR(255),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_exotel_webhook_events_tenant (tenant_id),
    INDEX idx_exotel_webhook_events_processed (processed),
    INDEX idx_exotel_webhook_events_created (created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exotel_configurations_tenant ON emr.exotel_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exotel_configurations_active ON emr.exotel_configurations(is_active);

CREATE INDEX IF NOT EXISTS idx_exotel_sms_campaigns_tenant ON emr.exotel_sms_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_campaigns_status ON emr.exotel_sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_campaigns_scheduled ON emr.exotel_sms_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_campaigns_type ON emr.exotel_sms_campaigns(campaign_type);

CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_tenant ON emr.exotel_sms_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_campaign ON emr.exotel_sms_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_communication ON emr.exotel_sms_logs(communication_id);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_status ON emr.exotel_sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_message_sid ON emr.exotel_sms_logs(message_sid);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_to_number ON emr.exotel_sms_logs(to_number);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_created ON emr.exotel_sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_exotel_sms_logs_next_retry ON emr.exotel_sms_logs(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_exotel_number_pools_tenant ON emr.exotel_number_pools(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exotel_number_pools_active ON emr.exotel_number_pools(is_active);
CREATE INDEX IF NOT EXISTS idx_exotel_number_pools_type ON emr.exotel_number_pools(number_type);
CREATE INDEX IF NOT EXISTS idx_exotel_number_pools_department ON emr.exotel_number_pools(department_id);
CREATE INDEX IF NOT EXISTS idx_exotel_number_pools_doctor ON emr.exotel_number_pools(doctor_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exotel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS trigger_exotel_configuration_updated_at
    BEFORE UPDATE ON emr.exotel_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_exotel_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_exotel_sms_campaign_updated_at
    BEFORE UPDATE ON emr.exotel_sms_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_exotel_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_exotel_number_pool_updated_at
    BEFORE UPDATE ON emr.exotel_number_pools
    FOR EACH ROW
    EXECUTE FUNCTION update_exotel_updated_at();

-- Function to get available number from pool
CREATE OR REPLACE FUNCTION get_available_exotel_number(p_tenant_id UUID, p_message_type VARCHAR(50), p_department_id UUID DEFAULT NULL, p_doctor_id UUID DEFAULT NULL)
RETURNS VARCHAR(20) AS $$
DECLARE
    selected_number VARCHAR(20);
BEGIN
    -- Get the highest priority available number from the pool
    SELECT phone_number INTO selected_number
    FROM emr.exotel_number_pools
    WHERE tenant_id = p_tenant_id 
      AND is_active = true 
      AND number_type = p_message_type
      AND (p_department_id IS NULL OR department_id = p_department_id)
      AND (p_doctor_id IS NULL OR doctor_id = p_doctor_id)
      AND (
        (daily_limit > current_daily_usage OR daily_limit IS NULL) AND
        (monthly_limit > current_monthly_usage OR monthly_limit IS NULL)
      )
    ORDER BY priority ASC, last_reset_date ASC
    LIMIT 1;
    
    RETURN COALESCE(selected_number, '');
END;
$$ LANGUAGE plpgsql;

-- Function to update number pool usage
CREATE OR REPLACE FUNCTION update_exotel_number_usage(p_tenant_id UUID, p_phone_number VARCHAR(20), p_message_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    -- Update daily usage
    UPDATE emr.exotel_number_pools 
    SET current_daily_usage = current_daily_usage + p_message_count,
        current_monthly_usage = current_monthly_usage + p_message_count
    WHERE tenant_id = p_tenant_id AND phone_number = p_phone_number;
    
    -- Reset daily usage if it's a new day
    UPDATE emr.exotel_number_pools 
    SET current_daily_usage = 0,
        last_reset_date = CURRENT_DATE
    WHERE tenant_id = p_tenant_id 
      AND phone_number = p_phone_number 
      AND last_reset_date < CURRENT_DATE;
    
    -- Reset monthly usage if it's a new month
    UPDATE emr.exotel_number_pools 
    SET current_monthly_usage = 0
    WHERE tenant_id = p_tenant_id 
      AND phone_number = p_phone_number 
      AND EXTRACT(MONTH FROM last_reset_date) != EXTRACT(MONTH FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to schedule SMS retry
CREATE OR REPLACE FUNCTION schedule_sms_retry(p_log_id UUID)
RETURNS VOID AS $$
DECLARE
    current_retry_count INTEGER;
    max_retries INTEGER;
    next_retry_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current retry count and max retries
    SELECT retry_count, max_retries INTO current_retry_count, max_retries
    FROM emr.exotel_sms_logs
    WHERE id = p_log_id;
    
    -- Calculate next retry time (exponential backoff: 2^retry_count * 60 seconds)
    IF current_retry_count < max_retries THEN
        next_retry_time := NOW() + (POWER(2, current_retry_count) * INTERVAL '1 minute');
        
        UPDATE emr.exotel_sms_logs
        SET retry_count = retry_count + 1,
            next_retry_at = next_retry_time,
            status = 'queued'
        WHERE id = p_log_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get SMS statistics
CREATE OR REPLACE FUNCTION get_exotel_sms_stats(p_tenant_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
    total_sent BIGINT,
    total_delivered BIGINT,
    total_failed BIGINT,
    delivery_rate DECIMAL(5,2),
    total_cost DECIMAL(10,4),
    avg_cost_per_sms DECIMAL(10,4),
    most_active_number VARCHAR(20),
    peak_hour INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as total_delivered,
        COUNT(CASE WHEN status IN ('failed', 'undelivered', 'rejected') THEN 1 END) as total_failed,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN status = 'delivered' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0 
        END as delivery_rate,
        COALESCE(SUM(cost), 0) as total_cost,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(COALESCE(SUM(cost), 0) / COUNT(*), 4)
            ELSE 0 
        END as avg_cost_per_sms,
        (SELECT phone_number FROM emr.exotel_sms_logs l2 
         WHERE l2.tenant_id = p_tenant_id 
           AND (p_start_date IS NULL OR DATE(l2.created_at) >= p_start_date)
           AND (p_end_date IS NULL OR DATE(l2.created_at) <= p_end_date)
         GROUP BY phone_number 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as most_active_number,
        EXTRACT(HOUR FROM created_at) as peak_hour
    FROM emr.exotel_sms_logs
    WHERE tenant_id = p_tenant_id 
      AND (p_start_date IS NULL OR DATE(created_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(created_at) <= p_end_date)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE emr.exotel_configurations IS 'Exotel SMS provider configuration settings';
COMMENT ON TABLE emr.exotel_sms_campaigns IS 'SMS campaign management for bulk messaging';
COMMENT ON TABLE emr.exotel_sms_logs IS 'Detailed log of all SMS sent via Exotel';
COMMENT ON TABLE emr.exotel_number_pools IS 'Pool of Exotel numbers with usage tracking';
COMMENT ON TABLE emr.exotel_webhook_events IS 'Webhook events from Exotel for delivery reports';

-- Insert default communication templates for Exotel
INSERT INTO emr.communication_templates (tenant_id, template_name, template_type, purpose, subject, message_content, variables, is_active, is_default, created_by)
SELECT 
    t.id,
    'Appointment Reminder - Exotel',
    'sms',
    'appointment_reminder',
    'Appointment Reminder',
    'Dear {{patient_name}}, this is a reminder for your appointment tomorrow at {{appointment_time}} with Dr. {{doctor_name}} in {{department_name}}. Please arrive 15 minutes early. Reply STOP to unsubscribe.',
    '["patient_name", "appointment_time", "doctor_name", "department_name", "hospital_name"]',
    true,
    true,
    NULL
FROM emr.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM emr.communication_templates ct 
    WHERE ct.tenant_id = t.id AND ct.purpose = 'appointment_reminder' AND ct.template_type = 'sms'
);

INSERT INTO emr.communication_templates (tenant_id, template_name, template_type, purpose, subject, message_content, variables, is_active, is_default, created_by)
SELECT 
    t.id,
    'Token Call - Exotel',
    'sms',
    'token_call',
    'Token Call Notification',
    'Your token {{token_number}} has been called. Please proceed to {{department_name}} immediately. Dr. {{doctor_name}} is ready to see you. Estimated wait time: {{wait_time}} minutes.',
    '["token_number", "department_name", "doctor_name", "wait_time", "hospital_name"]',
    true,
    true,
    NULL
FROM emr.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM emr.communication_templates ct 
    WHERE ct.tenant_id = t.id AND ct.purpose = 'token_call' AND ct.template_type = 'sms'
);

INSERT INTO emr.communication_templates (tenant_id, template_name, template_type, purpose, subject, message_content, variables, is_active, is_default, created_by)
SELECT 
    t.id,
    'Billing Reminder - Exotel',
    'sms',
    'billing_reminder',
    'Payment Reminder',
    'Dear {{patient_name}}, your bill {{bill_number}} of amount {{total_amount}} is due on {{due_date}}. Please complete payment to avoid service interruption. For queries: {{hospital_phone}}.',
    '["patient_name", "bill_number", "total_amount", "due_date", "hospital_phone", "hospital_name"]',
    true,
    true,
    NULL
FROM emr.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM emr.communication_templates ct 
    WHERE ct.tenant_id = t.id AND ct.purpose = 'billing_reminder' AND ct.template_type = 'sms'
);
