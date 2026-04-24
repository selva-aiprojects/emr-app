import { query } from './server/db/connection.js';

async function addRemainingTables() {
  console.log("🔧 Adding remaining missing tables one by one...");

  const tables = [
    {
      name: 'billing_items',
      sql: `
        CREATE TABLE IF NOT EXISTS magnum.billing_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
          visit_id uuid REFERENCES magnum.frontdesk_visits(id) ON DELETE SET NULL,
          invoice_id uuid REFERENCES magnum.billing_invoices(id) ON DELETE SET NULL,
          item_code character varying(32) NOT NULL,
          item_name text NOT NULL,
          quantity numeric(10,2) DEFAULT 1,
          unit_price numeric(12,2) NOT NULL,
          total_amount numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
          discount_amount numeric(12,2) DEFAULT 0,
          tax_amount numeric(12,2) DEFAULT 0,
          net_amount numeric(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount + tax_amount) STORED,
          status character varying(32) DEFAULT 'pending',
          billed_at timestamp with time zone,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `
    },
    {
      name: 'insurance_providers',
      sql: `
        CREATE TABLE IF NOT EXISTS magnum.insurance_providers (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          provider_name text NOT NULL,
          provider_code character varying(32) UNIQUE NOT NULL,
          contact_person character varying(128),
          phone character varying(32),
          email text,
          address text,
          is_active boolean DEFAULT true,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `
    },
    {
      name: 'insurance_pre_auth',
      sql: `
        CREATE TABLE IF NOT EXISTS magnum.insurance_pre_auth (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
          provider_id uuid REFERENCES magnum.insurance_providers(id) ON DELETE CASCADE,
          pre_auth_number character varying(64) UNIQUE NOT NULL,
          service_type character varying(64),
          estimated_amount numeric(12,2),
          approved_amount numeric(12,2),
          status character varying(32) DEFAULT 'pending',
          expiry_date date,
          notes text,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `
    },
    {
      name: 'patient_insurance',
      sql: `
        CREATE TABLE IF NOT EXISTS magnum.patient_insurance (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
          provider_id uuid REFERENCES magnum.insurance_providers(id) ON DELETE CASCADE,
          policy_number character varying(64) NOT NULL,
          group_number character varying(64),
          coverage_type character varying(32),
          coverage_percentage numeric(5,2) DEFAULT 100.00,
          deductible_amount numeric(12,2) DEFAULT 0,
          max_coverage_amount numeric(12,2),
          effective_date date,
          expiry_date date,
          is_primary boolean DEFAULT false,
          is_active boolean DEFAULT true,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `
    },
    {
      name: 'corporate_clients',
      sql: `
        CREATE TABLE IF NOT EXISTS magnum.corporate_clients (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          client_name text NOT NULL,
          client_code character varying(32) UNIQUE NOT NULL,
          contact_person character varying(128),
          phone character varying(32),
          email text,
          address text,
          billing_address text,
          credit_limit numeric(12,2),
          payment_terms character varying(64),
          is_active boolean DEFAULT true,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `
    },
    {
      name: 'corporate_bills',
      sql: `
        CREATE TABLE IF NOT EXISTS magnum.corporate_bills (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          client_id uuid REFERENCES magnum.corporate_clients(id) ON DELETE CASCADE,
          bill_number character varying(64) UNIQUE NOT NULL,
          total_amount numeric(12,2) NOT NULL,
          paid_amount numeric(12,2) DEFAULT 0,
          outstanding_amount numeric(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
          status character varying(32) DEFAULT 'unpaid',
          due_date date,
          issued_at timestamp with time zone DEFAULT now(),
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `
    },
    {
      name: 'corporate_bill_items',
      sql: `
        CREATE TABLE IF NOT EXISTS magnum.corporate_bill_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          bill_id uuid REFERENCES magnum.corporate_bills(id) ON DELETE CASCADE,
          patient_id uuid REFERENCES magnum.patients(id) ON DELETE CASCADE,
          service_description text NOT NULL,
          amount numeric(12,2) NOT NULL,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const table of tables) {
    try {
      console.log(`Creating table: ${table.name}`);
      await query(table.sql);
      console.log(`✅ ${table.name} created successfully`);
      successCount++;
    } catch (error) {
      console.log(`❌ Error creating ${table.name}:`, error.message.substring(0, 100));
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} tables created, ${errorCount} errors`);
}

addRemainingTables();