import { query } from '../server/db/connection.js';

async function verifyDemoData() {
  try {
    const [patients, employees, appointments, invoices, clinicalRecords, diagnosticReports] = await Promise.all([
      query('SELECT COUNT(*) as count FROM demo_emr.patients'),
      query('SELECT COUNT(*) as count FROM demo_emr.employees'),
      query('SELECT COUNT(*) as count FROM demo_emr.appointments'),
      query('SELECT COUNT(*) as count FROM demo_emr.invoices'),
      query('SELECT COUNT(*) as count FROM demo_emr.clinical_records'),
      query('SELECT COUNT(*) as count FROM demo_emr.diagnostic_reports')
    ]);

    console.log('=== DEMO TENANT DATA VERIFICATION ===');
    console.log('Patients:', patients.rows[0].count);
    console.log('Employees:', employees.rows[0].count);
    console.log('Appointments:', appointments.rows[0].count);
    console.log('Invoices:', invoices.rows[0].count);
    console.log('Clinical Records:', clinicalRecords.rows[0].count);
    console.log('Diagnostic Reports:', diagnosticReports.rows[0].count);
    
    // Sample patient data
    const samplePatients = await query('SELECT first_name, last_name, mrn, created_at FROM demo_emr.patients LIMIT 5');
    console.log('\n=== SAMPLE PATIENTS ===');
    samplePatients.rows.forEach(p => {
      console.log(`${p.first_name} ${p.last_name} - MRN: ${p.mrn} - Created: ${p.created_at.toISOString().split('T')[0]}`);
    });
    
    // Sample employee data
    const sampleEmployees = await query('SELECT name, designation, department, salary FROM demo_emr.employees LIMIT 5');
    console.log('\n=== SAMPLE EMPLOYEES ===');
    sampleEmployees.rows.forEach(e => {
      console.log(`${e.name} - ${e.designation} (${e.department}) - Salary: ${e.salary}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyDemoData();
