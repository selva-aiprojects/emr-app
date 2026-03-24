-- Migration: 011_product_gap_foundation.sql
-- Description: Foundation schema for product-gap modules
-- Scope: Communications, Notice Board, Documents, Payroll, Departments/Frontdesk,
--        Donor/Blood Bank, Internal Messaging

BEGIN;

-- =====================================================
-- DEPARTMENTS + FRONTDESK
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code varchar(32) NOT NULL,
  hod_user_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS emr.frontdesk_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE RESTRICT,
  appointment_id uuid REFERENCES emr.appointments(id) ON DELETE SET NULL,
  department_id uuid REFERENCES emr.departments(id) ON DELETE SET NULL,
  doctor_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  token_no bigint NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'checked_in'
    CHECK (status IN ('checked_in', 'in_queue', 'called', 'in_consultation', 'completed', 'cancelled')),
  triage_notes text,
  checked_in_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, token_no)
);

-- =====================================================
-- NOTICE + COMMUNICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  audience_departments jsonb NOT NULL DEFAULT '[]'::jsonb,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status varchar(16) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  priority varchar(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS emr.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  channel varchar(16) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'in_app')),
  event_key varchar(64) NOT NULL,
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, channel, event_key)
);

CREATE TABLE IF NOT EXISTS emr.notification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  channel varchar(16) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'in_app')),
  event_key varchar(64),
  recipient text NOT NULL,
  subject text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(16) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled')),
  retries int NOT NULL DEFAULT 0 CHECK (retries >= 0),
  max_retries int NOT NULL DEFAULT 3 CHECK (max_retries >= 0),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emr.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  notification_job_id uuid NOT NULL REFERENCES emr.notification_jobs(id) ON DELETE CASCADE,
  provider_name varchar(32),
  provider_message_id text,
  status varchar(16) NOT NULL CHECK (status IN ('accepted', 'delivered', 'bounced', 'rejected', 'failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  logged_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- DOCUMENT VAULT
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  category varchar(32) NOT NULL CHECK (category IN (
    'lab_report', 'prescription', 'invoice', 'consent', 'imaging', 'discharge_summary', 'admin', 'other'
  )),
  title text NOT NULL,
  file_name text NOT NULL,
  mime_type varchar(128),
  storage_key text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emr.document_access_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES emr.documents(id) ON DELETE CASCADE,
  role varchar(32) NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_download boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, role)
);

CREATE TABLE IF NOT EXISTS emr.document_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES emr.documents(id) ON DELETE CASCADE,
  action varchar(16) NOT NULL CHECK (action IN ('upload', 'view', 'download', 'delete', 'restore', 'update')),
  actor_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- PAYROLL
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES emr.employees(id) ON DELETE CASCADE,
  base_salary numeric(12,2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
  allowances jsonb NOT NULL DEFAULT '[]'::jsonb,
  deductions jsonb NOT NULL DEFAULT '[]'::jsonb,
  effective_from date NOT NULL,
  effective_to date,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE TABLE IF NOT EXISTS emr.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year int NOT NULL CHECK (period_year >= 2000),
  status varchar(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid', 'cancelled')),
  notes text,
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, period_month, period_year)
);

CREATE TABLE IF NOT EXISTS emr.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  payroll_run_id uuid NOT NULL REFERENCES emr.payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES emr.employees(id) ON DELETE RESTRICT,
  gross numeric(12,2) NOT NULL DEFAULT 0 CHECK (gross >= 0),
  deduction_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (deduction_total >= 0),
  net numeric(12,2) NOT NULL DEFAULT 0 CHECK (net >= 0),
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_run_id, employee_id)
);

CREATE TABLE IF NOT EXISTS emr.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  payroll_item_id uuid NOT NULL REFERENCES emr.payroll_items(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES emr.employees(id) ON DELETE RESTRICT,
  storage_key text,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_item_id)
);

-- =====================================================
-- DONOR + BLOOD BANK
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  code varchar(32) NOT NULL,
  name text NOT NULL,
  gender varchar(16),
  date_of_birth date,
  blood_group varchar(8) NOT NULL,
  phone varchar(32),
  email text,
  address text,
  last_donation_date date,
  eligibility_status varchar(24) NOT NULL DEFAULT 'eligible'
    CHECK (eligibility_status IN ('eligible', 'temporary_deferral', 'permanent_deferral')),
  notes text,
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS emr.blood_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES emr.donors(id) ON DELETE SET NULL,
  unit_number varchar(48) NOT NULL,
  blood_group varchar(8) NOT NULL,
  component varchar(24) NOT NULL CHECK (component IN ('whole_blood', 'rbc', 'plasma', 'platelets', 'cryoprecipitate')),
  volume_ml int CHECK (volume_ml > 0),
  collected_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'issued', 'discarded', 'expired')),
  storage_location text,
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, unit_number),
  CHECK (expires_at > collected_at)
);

CREATE TABLE IF NOT EXISTS emr.blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  requested_group varchar(8) NOT NULL,
  component varchar(24) NOT NULL CHECK (component IN ('whole_blood', 'rbc', 'plasma', 'platelets', 'cryoprecipitate')),
  units_requested int NOT NULL CHECK (units_requested > 0),
  units_issued int NOT NULL DEFAULT 0 CHECK (units_issued >= 0),
  priority varchar(16) NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'partially_issued', 'issued', 'rejected', 'cancelled')),
  indication text,
  requested_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- INTERNAL MESSAGING
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  context_type varchar(24) NOT NULL CHECK (context_type IN ('patient', 'encounter', 'department', 'general')),
  context_id uuid,
  title text,
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emr.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES emr.chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
  is_muted boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS emr.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES emr.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_departments_tenant_status ON emr.departments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_frontdesk_visits_tenant_status ON emr.frontdesk_visits(tenant_id, status, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_frontdesk_visits_doctor ON emr.frontdesk_visits(doctor_id, status);

CREATE INDEX IF NOT EXISTS idx_notices_tenant_status_window ON emr.notices(tenant_id, status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_tenant_status ON emr.notification_jobs(tenant_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_job ON emr.notification_logs(notification_job_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_patient ON emr.documents(tenant_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_category ON emr.documents(tenant_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_audit_document ON emr.document_audit_logs(document_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salary_structures_employee_dates ON emr.salary_structures(employee_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON emr.payroll_runs(tenant_id, period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_items_run ON emr.payroll_items(payroll_run_id, status);

CREATE INDEX IF NOT EXISTS idx_donors_tenant_group ON emr.donors(tenant_id, blood_group, eligibility_status);
CREATE INDEX IF NOT EXISTS idx_blood_units_tenant_status_expiry ON emr.blood_units(tenant_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_blood_requests_tenant_status ON emr.blood_requests(tenant_id, status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant_context ON emr.chat_threads(tenant_id, context_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON emr.chat_messages(thread_id, created_at DESC);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trg_departments_updated_at ON emr.departments;
CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON emr.departments
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_frontdesk_visits_updated_at ON emr.frontdesk_visits;
CREATE TRIGGER trg_frontdesk_visits_updated_at
  BEFORE UPDATE ON emr.frontdesk_visits
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_notices_updated_at ON emr.notices;
CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON emr.notices
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_notification_templates_updated_at ON emr.notification_templates;
CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON emr.notification_templates
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_notification_jobs_updated_at ON emr.notification_jobs;
CREATE TRIGGER trg_notification_jobs_updated_at
  BEFORE UPDATE ON emr.notification_jobs
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON emr.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON emr.documents
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_salary_structures_updated_at ON emr.salary_structures;
CREATE TRIGGER trg_salary_structures_updated_at
  BEFORE UPDATE ON emr.salary_structures
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_payroll_runs_updated_at ON emr.payroll_runs;
CREATE TRIGGER trg_payroll_runs_updated_at
  BEFORE UPDATE ON emr.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_payroll_items_updated_at ON emr.payroll_items;
CREATE TRIGGER trg_payroll_items_updated_at
  BEFORE UPDATE ON emr.payroll_items
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_donors_updated_at ON emr.donors;
CREATE TRIGGER trg_donors_updated_at
  BEFORE UPDATE ON emr.donors
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_blood_units_updated_at ON emr.blood_units;
CREATE TRIGGER trg_blood_units_updated_at
  BEFORE UPDATE ON emr.blood_units
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_blood_requests_updated_at ON emr.blood_requests;
CREATE TRIGGER trg_blood_requests_updated_at
  BEFORE UPDATE ON emr.blood_requests
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

DROP TRIGGER IF EXISTS trg_chat_threads_updated_at ON emr.chat_threads;
CREATE TRIGGER trg_chat_threads_updated_at
  BEFORE UPDATE ON emr.chat_threads
  FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

COMMIT;
