-- =====================================================
-- EMR Admin & Settings Tables
-- =====================================================
-- Additional tables for comprehensive admin functionality
-- =====================================================

-- =====================================================
-- ADMIN SETTINGS (Superadmin Configuration)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.admin_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT NOT NULL, -- string, number, boolean, json
    category TEXT NOT NULL, -- general, security, backup, notification, system
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TENANT SETTINGS (Tenant-Specific Configuration)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.tenant_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT NOT NULL, -- string, number, boolean, json
    category TEXT NOT NULL, -- general, branding, notification, security, billing
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, setting_key)
);

-- =====================================================
-- USER SETTINGS (User Preferences)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.user_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT NOT NULL, -- string, number, boolean, json
    category TEXT NOT NULL, -- preferences, notifications, ui, security
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setting_key)
);

-- =====================================================
-- GRAPHICS SETTINGS (Logo, Themes, Branding)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.graphics_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    setting_type TEXT NOT NULL, -- logo, favicon, theme, colors, fonts
    setting_value TEXT,
    file_url TEXT, -- For uploaded files
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, setting_type)
);

-- =====================================================
-- SYSTEM SETTINGS (Global Configuration)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.system_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT NOT NULL, -- string, number, boolean, json
    category TEXT NOT NULL, -- database, security, performance, integration
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.notification_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- email, sms, push, in_app
    event_type TEXT NOT NULL, -- appointment_reminder, billing_alert, system_alert
    is_enabled BOOLEAN DEFAULT true,
    template_content TEXT,
    settings_data JSONB, -- Additional configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, notification_type, event_type)
);

-- =====================================================
-- BACKUP SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.backup_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL, -- automatic, manual, scheduled
    frequency TEXT, -- daily, weekly, monthly
    retention_days INTEGER DEFAULT 30,
    backup_location TEXT, -- cloud, local, hybrid
    compression BOOLEAN DEFAULT true,
    encryption BOOLEAN DEFAULT true,
    settings_data JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECURITY SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.security_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT NOT NULL, -- string, number, boolean, json
    category TEXT NOT NULL, -- password, session, access, audit
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, setting_key)
);

-- =====================================================
-- THEME SETTINGS (Advanced Branding)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.theme_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    theme_name TEXT NOT NULL,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    background_color TEXT,
    text_color TEXT,
    font_family TEXT,
    font_size TEXT,
    border_radius TEXT,
    custom_css TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, theme_name)
);

-- =====================================================
-- MODULE SETTINGS (Feature Configuration)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.module_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL, -- appointments, billing, inventory, pharmacy, lab
    is_enabled BOOLEAN DEFAULT true,
    settings_data JSONB, -- Module-specific configuration
    permissions JSONB, -- Role-based permissions for module
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, module_name)
);

-- =====================================================
-- AUDIT LOGS (Security & Compliance)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES emr.users(id),
    action TEXT NOT NULL, -- create, update, delete, login, logout
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FILE UPLOADS (Documents, Images, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.file_uploads (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL REFERENCES emr.users(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    mime_type TEXT,
    category TEXT, -- logo, document, image, report, export
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Admin settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_admin_settings_category ON emr.admin_settings(category);
CREATE INDEX IF NOT EXISTS idx_emr_admin_settings_active ON emr.admin_settings(is_active);

-- Tenant settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_tenant_settings_tenant_id ON emr.tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_tenant_settings_category ON emr.tenant_settings(category);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_user_settings_user_id ON emr.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_emr_user_settings_category ON emr.user_settings(category);

-- Graphics settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_graphics_settings_tenant_id ON emr.graphics_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_graphics_settings_type ON emr.graphics_settings(setting_type);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_system_settings_category ON emr.system_settings(category);

-- Notification settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_notification_settings_tenant_id ON emr.notification_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_notification_settings_type ON emr.notification_settings(notification_type);

-- Backup settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_backup_settings_tenant_id ON emr.backup_settings(tenant_id);

-- Security settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_security_settings_tenant_id ON emr.security_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_security_settings_category ON emr.security_settings(category);

-- Theme settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_theme_settings_tenant_id ON emr.theme_settings(tenant_id);

-- Module settings indexes
CREATE INDEX IF NOT EXISTS idx_emr_module_settings_tenant_id ON emr.module_settings(tenant_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_emr_audit_logs_tenant_id ON emr.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_audit_logs_user_id ON emr.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emr_audit_logs_action ON emr.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_emr_audit_logs_created_at ON emr.audit_logs(created_at);

-- File uploads indexes
CREATE INDEX IF NOT EXISTS idx_emr_file_uploads_tenant_id ON emr.file_uploads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emr_file_uploads_uploaded_by ON emr.file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_emr_file_uploads_category ON emr.file_uploads(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE emr.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.graphics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.file_uploads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Admin settings policy (superadmin only)
CREATE POLICY "Superadmins can manage admin settings" ON emr.admin_settings
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'superadmin'
    );

-- Tenant settings policy
CREATE POLICY "Users can view tenant settings" ON emr.tenant_settings
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- User settings policy
CREATE POLICY "Users can manage own settings" ON emr.user_settings
    FOR ALL USING (
        user_id = auth.jwt() ->> 'user_id'
    );

-- Graphics settings policy
CREATE POLICY "Users can view tenant graphics" ON emr.graphics_settings
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- System settings policy (superadmin only)
CREATE POLICY "Superadmins can manage system settings" ON emr.system_settings
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'superadmin'
    );

-- Notification settings policy
CREATE POLICY "Users can view tenant notifications" ON emr.notification_settings
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- Backup settings policy
CREATE POLICY "Admins can manage backup settings" ON emr.backup_settings
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id' AND 
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- Security settings policy
CREATE POLICY "Admins can manage security settings" ON emr.security_settings
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id' AND 
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- Theme settings policy
CREATE POLICY "Users can view tenant themes" ON emr.theme_settings
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id'
    );

-- Module settings policy
CREATE POLICY "Admins can manage module settings" ON emr.module_settings
    FOR ALL USING (
        tenant_id = auth.jwt() ->> 'tenant_id' AND 
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- Audit logs policy
CREATE POLICY "Users can view own audit logs" ON emr.audit_logs
    FOR SELECT USING (
        user_id = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "Admins can view tenant audit logs" ON emr.audit_logs
    FOR SELECT USING (
        tenant_id = auth.jwt() ->> 'tenant_id' AND 
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- File uploads policy
CREATE POLICY "Users can manage own files" ON emr.file_uploads
    FOR ALL USING (
        uploaded_by = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "Users can view public files" ON emr.file_uploads
    FOR SELECT USING (
        is_public = true
    );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create triggers for all new tables with updated_at
CREATE TRIGGER update_emr_admin_settings_updated_at BEFORE UPDATE ON emr.admin_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_tenant_settings_updated_at BEFORE UPDATE ON emr.tenant_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_user_settings_updated_at BEFORE UPDATE ON emr.user_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_graphics_settings_updated_at BEFORE UPDATE ON emr.graphics_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_system_settings_updated_at BEFORE UPDATE ON emr.system_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_notification_settings_updated_at BEFORE UPDATE ON emr.notification_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_backup_settings_updated_at BEFORE UPDATE ON emr.backup_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_security_settings_updated_at BEFORE UPDATE ON emr.security_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_theme_settings_updated_at BEFORE UPDATE ON emr.theme_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_module_settings_updated_at BEFORE UPDATE ON emr.module_settings
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

CREATE TRIGGER update_emr_file_uploads_updated_at BEFORE UPDATE ON emr.file_uploads
    FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Admin & Settings Tables Added Successfully!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'New tables created: 12';
    RAISE NOTICE 'Admin settings: 1 (superadmin configuration)';
    RAISE NOTICE 'Tenant settings: 1 (tenant-specific config)';
    RAISE NOTICE 'User settings: 1 (user preferences)';
    RAISE NOTICE 'Graphics settings: 1 (logo, themes, branding)';
    RAISE NOTICE 'System settings: 1 (global configuration)';
    RAISE NOTICE 'Notification settings: 1 (email/SMS config)';
    RAISE NOTICE 'Backup settings: 1 (backup configuration)';
    RAISE NOTICE 'Security settings: 1 (security policies)';
    RAISE NOTICE 'Theme settings: 1 (advanced branding)';
    RAISE NOTICE 'Module settings: 1 (feature configuration)';
    RAISE NOTICE 'Audit logs: 1 (security & compliance)';
    RAISE NOTICE 'File uploads: 1 (document management)';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Total EMR tables now: 32';
    RAISE NOTICE 'Complete admin system ready!';
    RAISE NOTICE '====================================================';
END $$;
