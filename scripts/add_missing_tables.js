import { query } from '../server/db/connection.js';

async function addMissingTables() {
  console.log('Adding missing tables to demo_emr schema...');
  
  try {
    // Create donors table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.donors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        code varchar(32) NOT NULL,
        name text NOT NULL,
        gender varchar(16),
        date_of_birth date,
        blood_group varchar(8) NOT NULL,
        phone varchar(32),
        email text,
        last_donation_date date,
        eligibility_status varchar(32) DEFAULT 'eligible',
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, code)
      )
    `);
    
    // Create admissions table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.admissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        ward_id uuid,
        admission_date date NOT NULL DEFAULT CURRENT_DATE,
        discharge_date date,
        discharge_notes text,
        status varchar(16) NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create frontdesk_visits table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.frontdesk_visits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        token_no int NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'checked_in',
        triage_notes text,
        checked_in_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create ambulance_dispatch table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.ambulance_dispatch (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        ambulance_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        pickup_address text NOT NULL,
        destination text NOT NULL,
        dispatch_time timestamptz NOT NULL DEFAULT now(),
        arrival_time timestamptz,
        status varchar(16) NOT NULL DEFAULT 'dispatched',
        notes text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create payroll_runs table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.payroll_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        period_month int NOT NULL,
        period_year int NOT NULL,
        total_employees int NOT NULL DEFAULT 0,
        total_gross numeric(12,2) NOT NULL DEFAULT 0,
        total_deductions numeric(12,2) NOT NULL DEFAULT 0,
        total_net numeric(12,2) NOT NULL DEFAULT 0,
        status varchar(16) NOT NULL DEFAULT 'pending',
        processed_date date,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, period_month, period_year)
      )
    `);
    
    // Create pharmacy_alerts table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.pharmacy_alerts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        alert_type varchar(32) NOT NULL,
        message text NOT NULL,
        severity varchar(16) NOT NULL DEFAULT 'info',
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    console.log('Missing tables created successfully!');
    return { success: true };
    
  } catch (error) {
    console.error('Error creating missing tables:', error.message);
    return { success: false, error: error.message };
  }
}

addMissingTables().then(result => {
  if (result.success) {
    console.log('Missing tables added successfully!');
    process.exit(0);
  } else {
    console.log('Failed to add missing tables!');
    process.exit(1);
  }
}).catch(error => {
  console.error('Critical error:', error);
  process.exit(1);
});
