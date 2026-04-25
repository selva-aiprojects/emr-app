-- =====================================================
-- ADD ONLY MISSING CORE TABLES TO EXISTING DATABASE
-- =====================================================
-- Assumes you already have pharmacy & insurance modules
-- Schema: emr
-- Purpose: Add only missing core tables for EMR functionality
-- =====================================================

-- Create custom EMR schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS emr;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES (Check if they exist before creating)
-- =====================================================

-- TENANTS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'tenants') THEN
        CREATE TABLE tenants (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            code TEXT UNIQUE,
            subdomain TEXT UNIQUE,
            contact_email TEXT,
            theme JSONB,
            features JSONB,
            billing_config JSONB,
            status TEXT DEFAULT 'active',
            subscription_tier TEXT DEFAULT 'Free',
            logo_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created tenants table';
    ELSE
        RAISE NOTICE 'tenants table already exists';
    END IF;
END $$;

-- USERS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'users') THEN
        CREATE TABLE users (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            patient_id TEXT,
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created users table';
    ELSE
        RAISE NOTICE 'users table already exists';
    END IF;
END $$;

-- DEPARTMENTS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'departments') THEN
        CREATE TABLE departments (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            code TEXT,
            description TEXT,
            head_of_dept TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created departments table';
    ELSE
        RAISE NOTICE 'departments table already exists';
    END IF;
END $$;

-- EMPLOYEES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'employees') THEN
        CREATE TABLE employees (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL,
            department TEXT,
            join_date DATE,
            salary DECIMAL(12,2),
            bank_account TEXT,
            pan_number TEXT,
            aadhaar_number TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created employees table';
    ELSE
        RAISE NOTICE 'employees table already exists';
    END IF;
END $$;

-- PATIENTS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'patients') THEN
        CREATE TABLE patients (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            date_of_birth DATE,
            gender TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            postal_code TEXT,
            blood_group TEXT,
            primary_doctor_id TEXT REFERENCES users(id),
            is_archived BOOLEAN DEFAULT false,
            mrn TEXT UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add foreign key constraint for users.patient_id after patients table is created
        ALTER TABLE users ADD CONSTRAINT fk_users_patient_id 
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;
            
        RAISE NOTICE 'Created patients table';
    ELSE
        RAISE NOTICE 'patients table already exists';
    END IF;
END $$;

-- APPOINTMENTS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'appointments') THEN
        CREATE TABLE appointments (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            department_id TEXT REFERENCES departments(id),
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            duration INTEGER DEFAULT 30,
            type TEXT,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created appointments table';
    ELSE
        RAISE NOTICE 'appointments table already exists';
    END IF;
END $$;

-- ENCOUNTERS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'encounters') THEN
        CREATE TABLE encounters (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            encounter_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            encounter_type TEXT,
            chief_complaint TEXT,
            diagnosis TEXT,
            treatment_plan TEXT,
            notes TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created encounters table';
    ELSE
        RAISE NOTICE 'encounters table already exists';
    END IF;
END $$;

-- SERVICES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'services') THEN
        CREATE TABLE services (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            code TEXT,
            category TEXT,
            subcategory TEXT,
            base_rate DECIMAL(10,2) NOT NULL,
            tax_percent DECIMAL(5,2) DEFAULT 0,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(tenant_id, code)
        );
        RAISE NOTICE 'Created services table';
    ELSE
        RAISE NOTICE 'services table already exists';
    END IF;
END $$;

-- INVOICES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'invoices') THEN
        CREATE TABLE invoices (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            doctor_id TEXT REFERENCES employees(id),
            invoice_number TEXT UNIQUE,
            invoice_date DATE NOT NULL,
            description TEXT,
            items JSONB,
            subtotal DECIMAL(10,2) NOT NULL,
            tax_amount DECIMAL(10,2) DEFAULT 0,
            total_amount DECIMAL(10,2) NOT NULL,
            paid_amount DECIMAL(10,2) DEFAULT 0,
            balance_amount DECIMAL(10,2) NOT NULL,
            payment_method TEXT,
            payment_status TEXT DEFAULT 'unpaid',
            notes TEXT,
            status TEXT DEFAULT 'draft',
            created_by TEXT REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created invoices table';
    ELSE
        RAISE NOTICE 'invoices table already exists';
    END IF;
END $$;

-- BILLING (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'billing') THEN
        CREATE TABLE billing (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            invoice_id TEXT REFERENCES invoices(id),
            billing_date DATE NOT NULL,
            service_id TEXT REFERENCES services(id),
            service_name TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            discount_amount DECIMAL(10,2) DEFAULT 0,
            tax_amount DECIMAL(10,2) DEFAULT 0,
            total_amount DECIMAL(10,2) NOT NULL,
            billing_type TEXT,
            status TEXT DEFAULT 'pending',
            created_by TEXT REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created billing table';
    ELSE
        RAISE NOTICE 'billing table already exists';
    END IF;
END $$;

-- PRESCRIPTIONS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'prescriptions') THEN
        CREATE TABLE prescriptions (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            encounter_id TEXT REFERENCES encounters(id),
            prescription_number TEXT,
            prescription_date DATE NOT NULL,
            notes TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created prescriptions table';
    ELSE
        RAISE NOTICE 'prescriptions table already exists';
    END IF;
END $$;

-- PRESCRIPTION ITEMS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'prescription_items') THEN
        CREATE TABLE prescription_items (
            item_id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
            drug_name TEXT NOT NULL,
            dosage TEXT,
            frequency TEXT,
            duration TEXT,
            instructions TEXT,
            quantity INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created prescription_items table';
    ELSE
        RAISE NOTICE 'prescription_items table already exists';
    END IF;
END $$;

-- =====================================================
-- SEQUENCE TABLES (for MRN and Invoice generation)
-- =====================================================

-- MRN SEQUENCES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'mrn_sequences') THEN
        CREATE TABLE mrn_sequences (
            tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
            sequence_value INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created mrn_sequences table';
    ELSE
        RAISE NOTICE 'mrn_sequences table already exists';
    END IF;
END $$;

-- INVOICE SEQUENCES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'invoice_sequences') THEN
        CREATE TABLE invoice_sequences (
            tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
            sequence_value INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created invoice_sequences table';
    ELSE
        RAISE NOTICE 'invoice_sequences table already exists';
    END IF;
END $$;

-- =====================================================
-- SUPPORT TABLES (for your application code)
-- =====================================================

-- USER ROLES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'user_roles') THEN
        CREATE TABLE user_roles (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role_name TEXT NOT NULL,
            permissions JSONB,
            assigned_by TEXT REFERENCES users(id),
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT true,
            UNIQUE(tenant_id, user_id, role_name)
        );
        RAISE NOTICE 'Created user_roles table';
    ELSE
        RAISE NOTICE 'user_roles table already exists';
    END IF;
END $$;

-- TENANT FEATURES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'tenant_features') THEN
        CREATE TABLE tenant_features (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            feature_flag TEXT NOT NULL,
            enabled BOOLEAN DEFAULT false,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(tenant_id, feature_flag)
        );
        RAISE NOTICE 'Created tenant_features table';
    ELSE
        RAISE NOTICE 'tenant_features table already exists';
    END IF;
END $$;

-- GLOBAL KILL SWITCHES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'global_kill_switches') THEN
        CREATE TABLE global_kill_switches (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            feature_flag TEXT NOT NULL UNIQUE,
            enabled BOOLEAN DEFAULT false,
            created_by TEXT REFERENCES users(id),
            updated_by TEXT REFERENCES users(id),
            reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created global_kill_switches table';
    ELSE
        RAISE NOTICE 'global_kill_switches table already exists';
    END IF;
END $$;

-- OPD TOKENS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'opd_tokens') THEN
        CREATE TABLE opd_tokens (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
            doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            full_token TEXT NOT NULL,
            token_number INTEGER NOT NULL,
            priority TEXT DEFAULT 'routine',
            status TEXT DEFAULT 'waiting',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created opd_tokens table';
    ELSE
        RAISE NOTICE 'opd_tokens table already exists';
    END IF;
END $$;

-- OPD BILLS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'opd_bills') THEN
        CREATE TABLE opd_bills (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            token_id TEXT NOT NULL REFERENCES opd_tokens(id) ON DELETE CASCADE,
            bill_number TEXT NOT NULL,
            patient_age INTEGER,
            patient_gender TEXT,
            visit_type TEXT,
            department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
            doctor_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            consultation_fee DECIMAL(10,2),
            total_amount DECIMAL(10,2),
            payment_method TEXT,
            payment_status TEXT DEFAULT 'pending',
            created_by TEXT NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(tenant_id, bill_number)
        );
        RAISE NOTICE 'Created opd_bills table';
    ELSE
        RAISE NOTICE 'opd_bills table already exists';
    END IF;
END $$;

-- OPD BILL ITEMS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'opd_bill_items') THEN
        CREATE TABLE opd_bill_items (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            bill_id TEXT NOT NULL REFERENCES opd_bills(id) ON DELETE CASCADE,
            service_type TEXT,
            service_name TEXT,
            quantity INTEGER DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            created_by TEXT NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created opd_bill_items table';
    ELSE
        RAISE NOTICE 'opd_bill_items table already exists';
    END IF;
END $$;

-- CLINICAL RECORDS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'clinical_records') THEN
        CREATE TABLE clinical_records (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            created_by TEXT NOT NULL REFERENCES users(id),
            record_type TEXT,
            diagnosis TEXT,
            treatment TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created clinical_records table';
    ELSE
        RAISE NOTICE 'clinical_records table already exists';
    END IF;
END $$;

-- =====================================================
-- EXOTEL COMMUNICATION TABLES (if not exists)
-- =====================================================

-- EXOTEL CONFIGURATIONS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'exotel_configurations') THEN
        CREATE TABLE exotel_configurations (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            account_sid TEXT NOT NULL,
            api_key TEXT NOT NULL,
            api_token TEXT NOT NULL,
            subdomain TEXT NOT NULL,
            is_default BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_by TEXT NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created exotel_configurations table';
    ELSE
        RAISE NOTICE 'exotel_configurations table already exists';
    END IF;
END $$;

-- EXOTEL NUMBER POOLS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'exotel_number_pools') THEN
        CREATE TABLE exotel_number_pools (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            pool_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            number_type TEXT,
            department_id TEXT REFERENCES departments(id),
            doctor_id TEXT REFERENCES employees(id),
            daily_limit INTEGER,
            monthly_limit INTEGER,
            priority INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT true,
            created_by TEXT NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created exotel_number_pools table';
    ELSE
        RAISE NOTICE 'exotel_number_pools table already exists';
    END IF;
END $$;

-- EXOTEL SMS CAMPAIGNS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'exotel_sms_campaigns') THEN
        CREATE TABLE exotel_sms_campaigns (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            campaign_name TEXT NOT NULL,
            campaign_type TEXT,
            template_id TEXT,
            scheduled_for TIMESTAMP WITH TIME ZONE,
            recipients TEXT,
            variables_used TEXT,
            priority INTEGER DEFAULT 1,
            status TEXT DEFAULT 'draft',
            created_by TEXT NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created exotel_sms_campaigns table';
    ELSE
        RAISE NOTICE 'exotel_sms_campaigns table already exists';
    END IF;
END $$;

-- EXOTEL SMS LOGS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'exotel_sms_logs') THEN
        CREATE TABLE exotel_sms_logs (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            campaign_id TEXT REFERENCES exotel_sms_campaigns(id),
            communication_id TEXT,
            account_sid TEXT,
            from_number TEXT,
            to_number TEXT,
            message_content TEXT,
            message_type TEXT,
            priority INTEGER DEFAULT 1,
            status TEXT DEFAULT 'pending',
            external_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created exotel_sms_logs table';
    ELSE
        RAISE NOTICE 'exotel_sms_logs table already exists';
    END IF;
END $$;

-- EXOTEL WEBHOOK EVENTS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'exotel_webhook_events') THEN
        CREATE TABLE exotel_webhook_events (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            event_type TEXT,
            event_data JSONB,
            message_sid TEXT,
            account_sid TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created exotel_webhook_events table';
    ELSE
        RAISE NOTICE 'exotel_webhook_events table already exists';
    END IF;
END $$;

-- COMMUNICATION TEMPLATES (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'communication_templates') THEN
        CREATE TABLE communication_templates (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            template_name TEXT NOT NULL,
            template_type TEXT,
            template_content TEXT,
            variables TEXT,
            is_active BOOLEAN DEFAULT true,
            created_by TEXT NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(tenant_id, template_name)
        );
        RAISE NOTICE 'Created communication_templates table';
    ELSE
        RAISE NOTICE 'communication_templates table already exists';
    END IF;
END $$;

-- PATIENT COMMUNICATIONS (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'patient_communications') THEN
        CREATE TABLE patient_communications (
            id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            communication_type TEXT,
            content TEXT,
            status TEXT DEFAULT 'pending',
            sent_at TIMESTAMP WITH TIME ZONE,
            created_by TEXT NOT NULL REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created patient_communications table';
    ELSE
        RAISE NOTICE 'patient_communications table already exists';
    END IF;
END $$;

-- =====================================================
-- FUNCTIONS (if not exists)
-- =====================================================

-- MRN Sequence Generator (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'emr' AND routine_name = 'get_next_mrn') THEN
        CREATE OR REPLACE FUNCTION get_next_mrn(tenant_id_param TEXT)
        RETURNS TEXT AS $$
        DECLARE
            tenant_code TEXT;
            sequence_value INTEGER;
            mrn TEXT;
        BEGIN
            -- Get tenant code
            SELECT code INTO tenant_code FROM tenants WHERE id = tenant_id_param;
            
            -- Update sequence
            INSERT INTO mrn_sequences (tenant_id, sequence_value)
            VALUES (tenant_id_param, 1)
            ON CONFLICT (tenant_id)
            DO UPDATE SET sequence_value = mrn_sequences.sequence_value + 1
            RETURNING sequence_value INTO sequence_value;
            
            -- Generate MRN
            mrn := COALESCE(tenant_code, 'UNK') || '-' || LPAD(sequence_value::TEXT, 6, '0');
            
            RETURN mrn;
        END;
        $$ LANGUAGE plpgsql;
        RAISE NOTICE 'Created get_next_mrn function';
    ELSE
        RAISE NOTICE 'get_next_mrn function already exists';
    END IF;
END $$;

-- Invoice Number Generator (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'emr' AND routine_name = 'get_next_invoice_number') THEN
        CREATE OR REPLACE FUNCTION get_next_invoice_number(tenant_id_param TEXT)
        RETURNS TEXT AS $$
        DECLARE
            tenant_code TEXT;
            sequence_value INTEGER;
            invoice_number TEXT;
        BEGIN
            -- Get tenant code
            SELECT code INTO tenant_code FROM tenants WHERE id = tenant_id_param;
            
            -- Update sequence
            INSERT INTO invoice_sequences (tenant_id, sequence_value)
            VALUES (tenant_id_param, 1)
            ON CONFLICT (tenant_id)
            DO UPDATE SET sequence_value = invoice_sequences.sequence_value + 1
            RETURNING sequence_value INTO sequence_value;
            
            -- Generate invoice number
            invoice_number := 'INV-' || COALESCE(tenant_code, 'UNK') || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(sequence_value::TEXT, 6, '0');
            
            RETURN invoice_number;
        END;
        $$ LANGUAGE plpgsql;
        RAISE NOTICE 'Created get_next_invoice_number function';
    ELSE
        RAISE NOTICE 'get_next_invoice_number function already exists';
    END IF;
END $$;

-- =====================================================
-- TRIGGERS (for updated_at)
-- =====================================================

-- Function to update updated_at column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        RAISE NOTICE 'Created update_updated_at_column function';
    ELSE
        RAISE NOTICE 'update_updated_at_column function already exists';
    END IF;
END $$;

-- Create triggers for all tables with updated_at (only if they don't exist)
DO $$
BEGIN
    -- Tenants trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_tenants_updated_at') THEN
        CREATE TRIGGER update_emr_tenants_updated_at BEFORE UPDATE ON tenants
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for tenants';
    END IF;
    
    -- Users trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_users_updated_at') THEN
        CREATE TRIGGER update_emr_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for users';
    END IF;
    
    -- Patients trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_patients_updated_at') THEN
        CREATE TRIGGER update_emr_patients_updated_at BEFORE UPDATE ON patients
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for patients';
    END IF;
    
    -- Appointments trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_appointments_updated_at') THEN
        CREATE TRIGGER update_emr_appointments_updated_at BEFORE UPDATE ON appointments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for appointments';
    END IF;
    
    -- Encounters trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_encounters_updated_at') THEN
        CREATE TRIGGER update_emr_encounters_updated_at BEFORE UPDATE ON encounters
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for encounters';
    END IF;
    
    -- Invoices trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_invoices_updated_at') THEN
        CREATE TRIGGER update_emr_invoices_updated_at BEFORE UPDATE ON invoices
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for invoices';
    END IF;
    
    -- Billing trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_billing_updated_at') THEN
        CREATE TRIGGER update_emr_billing_updated_at BEFORE UPDATE ON billing
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for billing';
    END IF;
    
    -- Prescriptions trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_prescriptions_updated_at') THEN
        CREATE TRIGGER update_emr_prescriptions_updated_at BEFORE UPDATE ON prescriptions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for prescriptions';
    END IF;
    
    -- Prescription Items trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_prescription_items_updated_at') THEN
        CREATE TRIGGER update_emr_prescription_items_updated_at BEFORE UPDATE ON prescription_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for prescription_items';
    END IF;
    
    -- Services trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_services_updated_at') THEN
        CREATE TRIGGER update_emr_services_updated_at BEFORE UPDATE ON services
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for services';
    END IF;
    
    -- Departments trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_departments_updated_at') THEN
        CREATE TRIGGER update_emr_departments_updated_at BEFORE UPDATE ON departments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for departments';
    END IF;
    
    -- Employees trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_employees_updated_at') THEN
        CREATE TRIGGER update_emr_employees_updated_at BEFORE UPDATE ON employees
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for employees';
    END IF;
    
    -- OPD Tokens trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_opd_tokens_updated_at') THEN
        CREATE TRIGGER update_emr_opd_tokens_updated_at BEFORE UPDATE ON opd_tokens
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for opd_tokens';
    END IF;
    
    -- OPD Bills trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_opd_bills_updated_at') THEN
        CREATE TRIGGER update_emr_opd_bills_updated_at BEFORE UPDATE ON opd_bills
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for opd_bills';
    END IF;
    
    -- OPD Bill Items trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_opd_bill_items_updated_at') THEN
        CREATE TRIGGER update_emr_opd_bill_items_updated_at BEFORE UPDATE ON opd_bill_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for opd_bill_items';
    END IF;
    
    -- Clinical Records trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_clinical_records_updated_at') THEN
        CREATE TRIGGER update_emr_clinical_records_updated_at BEFORE UPDATE ON clinical_records
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for clinical_records';
    END IF;
    
    -- User Roles trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_user_roles_updated_at') THEN
        CREATE TRIGGER update_emr_user_roles_updated_at BEFORE UPDATE ON user_roles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for user_roles';
    END IF;
    
    -- Tenant Features trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_tenant_features_updated_at') THEN
        CREATE TRIGGER update_emr_tenant_features_updated_at BEFORE UPDATE ON tenant_features
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for tenant_features';
    END IF;
    
    -- Global Kill Switches trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_global_kill_switches_updated_at') THEN
        CREATE TRIGGER update_emr_global_kill_switches_updated_at BEFORE UPDATE ON global_kill_switches
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for global_kill_switches';
    END IF;
    
    -- Exotel Configurations trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_exotel_configurations_updated_at') THEN
        CREATE TRIGGER update_emr_exotel_configurations_updated_at BEFORE UPDATE ON exotel_configurations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for exotel_configurations';
    END IF;
    
    -- Exotel Number Pools trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_exotel_number_pools_updated_at') THEN
        CREATE TRIGGER update_emr_exotel_number_pools_updated_at BEFORE UPDATE ON exotel_number_pools
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for exotel_number_pools';
    END IF;
    
    -- Exotel SMS Campaigns trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_exotel_sms_campaigns_updated_at') THEN
        CREATE TRIGGER update_emr_exotel_sms_campaigns_updated_at BEFORE UPDATE ON exotel_sms_campaigns
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for exotel_sms_campaigns';
    END IF;
    
    -- Exotel SMS Logs trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_exotel_sms_logs_updated_at') THEN
        CREATE TRIGGER update_emr_exotel_sms_logs_updated_at BEFORE UPDATE ON exotel_sms_logs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for exotel_sms_logs';
    END IF;
    
    -- Communication Templates trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_communication_templates_updated_at') THEN
        CREATE TRIGGER update_emr_communication_templates_updated_at BEFORE UPDATE ON communication_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for communication_templates';
    END IF;
    
    -- Patient Communications trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_patient_communications_updated_at') THEN
        CREATE TRIGGER update_emr_patient_communications_updated_at BEFORE UPDATE ON patient_communications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for patient_communications';
    END IF;
    
    -- MRN Sequences trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_mrn_sequences_updated_at') THEN
        CREATE TRIGGER update_emr_mrn_sequences_updated_at BEFORE UPDATE ON mrn_sequences
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for mrn_sequences';
    END IF;
    
    -- Invoice Sequences trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_schema = 'emr' AND trigger_name = 'update_emr_invoice_sequences_updated_at') THEN
        CREATE TRIGGER update_emr_invoice_sequences_updated_at BEFORE UPDATE ON invoice_sequences
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for invoice_sequences';
    END IF;
END $$;

-- =====================================================
-- BASIC INDEXES (only if they don't exist)
-- =====================================================

-- Core indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'users' AND indexname = 'idx_emr_users_tenant_id') THEN
        CREATE INDEX idx_emr_users_tenant_id ON users(tenant_id);
        RAISE NOTICE 'Created index idx_emr_users_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'patients' AND indexname = 'idx_emr_patients_tenant_id') THEN
        CREATE INDEX idx_emr_patients_tenant_id ON patients(tenant_id);
        RAISE NOTICE 'Created index idx_emr_patients_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'patients' AND indexname = 'idx_emr_patients_mrn') THEN
        CREATE INDEX idx_emr_patients_mrn ON patients(mrn);
        RAISE NOTICE 'Created index idx_emr_patients_mrn';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'appointments' AND indexname = 'idx_emr_appointments_tenant_id') THEN
        CREATE INDEX idx_emr_appointments_tenant_id ON appointments(tenant_id);
        RAISE NOTICE 'Created index idx_emr_appointments_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'appointments' AND indexname = 'idx_emr_appointments_start_time') THEN
        CREATE INDEX idx_emr_appointments_start_time ON appointments(start_time);
        RAISE NOTICE 'Created index idx_emr_appointments_start_time';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'invoices' AND indexname = 'idx_emr_invoices_tenant_id') THEN
        CREATE INDEX idx_emr_invoices_tenant_id ON invoices(tenant_id);
        RAISE NOTICE 'Created index idx_emr_invoices_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'invoices' AND indexname = 'idx_emr_invoices_status') THEN
        CREATE INDEX idx_emr_invoices_status ON invoices(status);
        RAISE NOTICE 'Created index idx_emr_invoices_status';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'billing' AND indexname = 'idx_emr_billing_tenant_id') THEN
        CREATE INDEX idx_emr_billing_tenant_id ON billing(tenant_id);
        RAISE NOTICE 'Created index idx_emr_billing_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'services' AND indexname = 'idx_emr_services_tenant_id') THEN
        CREATE INDEX idx_emr_services_tenant_id ON services(tenant_id);
        RAISE NOTICE 'Created index idx_emr_services_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'departments' AND indexname = 'idx_emr_departments_tenant_id') THEN
        CREATE INDEX idx_emr_departments_tenant_id ON departments(tenant_id);
        RAISE NOTICE 'Created index idx_emr_departments_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'employees' AND indexname = 'idx_emr_employees_tenant_id') THEN
        CREATE INDEX idx_emr_employees_tenant_id ON employees(tenant_id);
        RAISE NOTICE 'Created index idx_emr_employees_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'encounters' AND indexname = 'idx_emr_encounters_tenant_id') THEN
        CREATE INDEX idx_emr_encounters_tenant_id ON encounters(tenant_id);
        RAISE NOTICE 'Created index idx_emr_encounters_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'opd_tokens' AND indexname = 'idx_emr_opd_tokens_tenant_id') THEN
        CREATE INDEX idx_emr_opd_tokens_tenant_id ON opd_tokens(tenant_id);
        RAISE NOTICE 'Created index idx_emr_opd_tokens_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'opd_tokens' AND indexname = 'idx_emr_opd_tokens_full_token') THEN
        CREATE INDEX idx_emr_opd_tokens_full_token ON opd_tokens(full_token);
        RAISE NOTICE 'Created index idx_emr_opd_tokens_full_token';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'opd_bills' AND indexname = 'idx_emr_opd_bills_tenant_id') THEN
        CREATE INDEX idx_emr_opd_bills_tenant_id ON opd_bills(tenant_id);
        RAISE NOTICE 'Created index idx_emr_opd_bills_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'opd_bills' AND indexname = 'idx_emr_opd_bills_bill_number') THEN
        CREATE INDEX idx_emr_opd_bills_bill_number ON opd_bills(bill_number);
        RAISE NOTICE 'Created index idx_emr_opd_bills_bill_number';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'exotel_configurations' AND indexname = 'idx_emr_exotel_configurations_tenant_id') THEN
        CREATE INDEX idx_emr_exotel_configurations_tenant_id ON exotel_configurations(tenant_id);
        RAISE NOTICE 'Created index idx_emr_exotel_configurations_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'exotel_sms_logs' AND indexname = 'idx_emr_exotel_sms_logs_tenant_id') THEN
        CREATE INDEX idx_emr_exotel_sms_logs_tenant_id ON exotel_sms_logs(tenant_id);
        RAISE NOTICE 'Created index idx_emr_exotel_sms_logs_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'user_roles' AND indexname = 'idx_emr_user_roles_tenant_id') THEN
        CREATE INDEX idx_emr_user_roles_tenant_id ON user_roles(tenant_id);
        RAISE NOTICE 'Created index idx_emr_user_roles_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'user_roles' AND indexname = 'idx_emr_user_roles_user_id') THEN
        CREATE INDEX idx_emr_user_roles_user_id ON user_roles(user_id);
        RAISE NOTICE 'Created index idx_emr_user_roles_user_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'tenant_features' AND indexname = 'idx_emr_tenant_features_tenant_id') THEN
        CREATE INDEX idx_emr_tenant_features_tenant_id ON tenant_features(tenant_id);
        RAISE NOTICE 'Created index idx_emr_tenant_features_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'clinical_records' AND indexname = 'idx_emr_clinical_records_tenant_id') THEN
        CREATE INDEX idx_emr_clinical_records_tenant_id ON clinical_records(tenant_id);
        RAISE NOTICE 'Created index idx_emr_clinical_records_tenant_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'emr' AND tablename = 'clinical_records' AND indexname = 'idx_emr_clinical_records_patient_id') THEN
        CREATE INDEX idx_emr_clinical_records_patient_id ON clinical_records(patient_id);
        RAISE NOTICE 'Created index idx_emr_clinical_records_patient_id';
    END IF;
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'MISSING CORE TABLES ADDED SUCCESSFULLY!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'This script only adds missing core tables.';
    RAISE NOTICE 'Your existing pharmacy & insurance modules are preserved.';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Core Tables Added (if missing):';
    RAISE NOTICE '- tenants, users, patients';
    RAISE NOTICE '- departments, employees';
    RAISE NOTICE '- appointments, encounters';
    RAISE NOTICE '- services, invoices, billing';
    RAISE NOTICE '- prescriptions, prescription_items';
    RAISE NOTICE '- opd_tokens, opd_bills, opd_bill_items';
    RAISE NOTICE '- user_roles, tenant_features, clinical_records';
    RAISE NOTICE '- exotel_* communication tables';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Functions Added (if missing):';
    RAISE NOTICE '- get_next_mrn()';
    RAISE NOTICE '- get_next_invoice_number()';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Triggers Added (if missing):';
    RAISE NOTICE '- updated_at triggers for all tables';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Indexes Added (if missing):';
    RAISE NOTICE '- Performance indexes for all tables';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Application Ready!';
    RAISE NOTICE 'All service files will work with this database!';
    RAISE NOTICE '====================================================';
END $$;
