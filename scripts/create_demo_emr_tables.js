import { query } from '../server/db/connection.js';

async function createDemoEmrTables() {
  console.log('Creating tables in demo_emr schema...');
  
  try {
    // Create patients table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.patients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        mrn varchar(64) NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        date_of_birth date,
        gender varchar(16),
        phone varchar(32),
        email text,
        address text,
        blood_group varchar(8),
        emergency_contact varchar(128),
        insurance varchar(256),
        medical_history jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, mrn)
      )
    `);
    
    // Create appointments table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.appointments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        provider_id uuid,
        scheduled_start timestamptz NOT NULL,
        scheduled_end timestamptz NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'scheduled',
        reason text,
        source varchar(16) DEFAULT 'staff',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create employees table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.employees (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        code varchar(64) NOT NULL,
        name text NOT NULL,
        email text,
        phone varchar(32),
        department text,
        designation text,
        salary numeric,
        join_date date,
        shift varchar(16),
        leave_balance numeric(5,1) NOT NULL DEFAULT 12,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        bank_account text,
        UNIQUE (tenant_id, code)
      )
    `);
    
    // Create inventory_items table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.inventory_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        item_code varchar(64) NOT NULL,
        name text NOT NULL,
        category text,
        current_stock numeric(12,2) NOT NULL DEFAULT 0,
        reorder_level numeric(12,2) NOT NULL DEFAULT 0,
        unit varchar(32),
        unit_price numeric(12,2) DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, item_code)
      )
    `);
    
    // Create invoices table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        invoice_number varchar(64) NOT NULL,
        description text,
        subtotal numeric(12,2) NOT NULL DEFAULT 0,
        tax numeric(12,2) NOT NULL DEFAULT 0,
        total numeric(12,2) NOT NULL DEFAULT 0,
        paid numeric(12,2) NOT NULL DEFAULT 0,
        payment_method varchar(32),
        status varchar(20) NOT NULL DEFAULT 'draft',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, invoice_number)
      )
    `);
    
    // Create departments table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.departments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        code varchar(32) NOT NULL,
        hod_user_id uuid,
        status varchar(16) NOT NULL DEFAULT 'active',
        created_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, code)
      )
    `);
    
    // Create wards table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.wards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        name text NOT NULL,
        type varchar(32) NOT NULL,
        base_rate numeric(12,2) NOT NULL DEFAULT 0,
        status varchar(16) DEFAULT 'Active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, name)
      )
    `);
    
    // Create beds table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.beds (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        ward_id uuid,
        bed_number varchar(16) NOT NULL,
        type varchar(32) DEFAULT 'General',
        status varchar(16) DEFAULT 'Available',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create encounters table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.encounters (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        provider_id uuid,
        encounter_type varchar(32) NOT NULL,
        visit_date date NOT NULL DEFAULT CURRENT_DATE,
        chief_complaint text,
        diagnosis text,
        notes text,
        status varchar(16) NOT NULL DEFAULT 'open',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create clinical_records table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.clinical_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        encounter_id uuid,
        section varchar(32) NOT NULL,
        content jsonb NOT NULL,
        created_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create prescriptions table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.prescriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        encounter_id uuid NOT NULL,
        drug_name text NOT NULL,
        dosage text,
        frequency text,
        duration text,
        instructions text,
        status varchar(16) NOT NULL DEFAULT 'Pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create diagnostic_reports table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.diagnostic_reports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'completed',
        category text,
        conclusion jsonb,
        issued_datetime timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create drug_allergies table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.drug_allergies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        allergen text NOT NULL,
        severity varchar(16) NOT NULL DEFAULT 'mild',
        reaction text,
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create conditions table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.conditions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        code varchar(32),
        description text,
        category text,
        severity varchar(16) NOT NULL DEFAULT 'mild',
        onset_date date,
        status varchar(16) NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create ambulances table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.ambulances (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        vehicle_number varchar(32) NOT NULL,
        vehicle_type varchar(32) DEFAULT 'Basic Life Support',
        status varchar(24) NOT NULL DEFAULT 'available',
        driver_name text,
        driver_phone varchar(32),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, vehicle_number)
      )
    `);
    
    // Create blood_units table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.blood_units (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        donor_id uuid,
        unit_number varchar(48) NOT NULL,
        blood_group varchar(8) NOT NULL,
        component varchar(24) NOT NULL DEFAULT 'whole_blood',
        volume_ml int DEFAULT 450,
        collected_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL DEFAULT now() + interval '35 days',
        status varchar(24) NOT NULL DEFAULT 'available',
        storage_location text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, unit_number)
      )
    `);
    
    // Create blood_requests table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.blood_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        patient_id uuid NOT NULL,
        requested_group varchar(8) NOT NULL,
        component varchar(24) NOT NULL DEFAULT 'whole_blood',
        units_requested int NOT NULL CHECK (units_requested > 0),
        units_issued int NOT NULL DEFAULT 0,
        priority varchar(16) NOT NULL DEFAULT 'routine',
        status varchar(24) NOT NULL DEFAULT 'pending',
        indication text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create attendance table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.attendance (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        employee_id uuid NOT NULL,
        date date NOT NULL DEFAULT CURRENT_DATE,
        check_in timestamptz,
        check_out timestamptz,
        status varchar(16) DEFAULT 'Present',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tenant_id, employee_id, date)
      )
    `);
    
    // Create expenses table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.expenses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        category varchar(64) NOT NULL,
        description text NOT NULL,
        amount numeric(12,2) NOT NULL,
        date date NOT NULL DEFAULT CURRENT_DATE,
        payment_method varchar(32) DEFAULT 'Bank Transfer',
        reference text,
        recorded_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create notices table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.notices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        title text NOT NULL,
        body text NOT NULL,
        audience_roles jsonb NOT NULL DEFAULT '[]',
        starts_at timestamptz NOT NULL DEFAULT now(),
        ends_at timestamptz,
        status varchar(16) NOT NULL DEFAULT 'published',
        priority varchar(16) NOT NULL DEFAULT 'normal',
        created_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    // Create support_tickets table
    await query(`
      CREATE TABLE IF NOT EXISTS demo_emr.support_tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        ticket_number varchar(32) NOT NULL,
        title text NOT NULL,
        description text,
        category varchar(32) NOT NULL,
        priority varchar(16) NOT NULL DEFAULT 'medium',
        status varchar(16) NOT NULL DEFAULT 'open',
        created_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    
    console.log('All tables created successfully!');
    return { success: true };
    
  } catch (error) {
    console.error('Error creating tables:', error.message);
    return { success: false, error: error.message };
  }
}

createDemoEmrTables().then(result => {
  if (result.success) {
    console.log('Table creation completed successfully!');
    process.exit(0);
  } else {
    console.log('Table creation failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('Critical error:', error);
  process.exit(1);
});
