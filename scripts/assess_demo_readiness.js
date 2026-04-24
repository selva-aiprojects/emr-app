import { query } from '../server/db/connection.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function assessDemoReadiness() {
  console.log(' Assessing Demo Readiness - Application Feature Analysis...\n');

  try {
    // Get tenant ID
    const tenantResult = await query(
      'SELECT id FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (tenantResult.rows.length === 0) {
      console.log(' DEMO tenant not found!');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log(` Found DEMO tenant with ID: ${tenantId}\n`);

    // 1. Data Assessment
    console.log(' 1. DATA ASSESSMENT');
    console.log(' =================');
    
    // Get counts with error handling for missing tables
    const patientCount = await query('SELECT COUNT(*) as count FROM patients WHERE tenant_id = $1', [tenantId]);
    
    let encounterCount = { rows: [{ count: 0 }] };
    try {
      encounterCount = await query('SELECT COUNT(*) as count FROM encounters WHERE tenant_id = $1', [tenantId]);
    } catch (e) {
      console.log(' Encounters table not found, using 0');
    }
    
    let appointmentCount = { rows: [{ count: 0 }] };
    try {
      appointmentCount = await query('SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1', [tenantId]);
    } catch (e) {
      console.log(' Appointments table not found, using 0');
    }
    
    const invoiceCount = await query('SELECT COUNT(*) as count FROM invoices WHERE tenant_id = $1', [tenantId]);
    const departmentCount = await query('SELECT COUNT(*) as count FROM departments WHERE tenant_id = $1', [tenantId]);
    const bedCount = await query('SELECT COUNT(*) as count FROM beds WHERE tenant_id = $1', [tenantId]);
    const userCount = await query('SELECT COUNT(*) as count FROM users WHERE tenant_id = $1', [tenantId]);

    console.log(` Patients: ${patientCount.rows[0].count}`);
    console.log(` Encounters: ${encounterCount.rows[0].count}`);
    console.log(` Appointments: ${appointmentCount.rows[0].count}`);
    console.log(` Invoices: ${invoiceCount.rows[0].count}`);
    console.log(` Departments: ${departmentCount.rows[0].count}`);
    console.log(` Beds: ${bedCount.rows[0].count}`);
    console.log(` Users: ${userCount.rows[0].count}`);

    const dataScore = Math.min(100, (patientCount.rows[0].count / 50) * 20 + 
                                   (encounterCount.rows[0].count / 100) * 20 + 
                                   (appointmentCount.rows[0].count / 20) * 20 + 
                                   (invoiceCount.rows[0].count / 50) * 20 + 
                                   (departmentCount.rows[0].count / 5) * 10 + 
                                   (userCount.rows[0].count / 5) * 10);
    
    console.log(` Data Score: ${dataScore.toFixed(1)}%\n`);

    // 2. Feature Assessment - Check available tables
    console.log(' 2. FEATURE ASSESSMENT');
    console.log(' ====================');
    
    const featureTables = [
      { name: 'Patient Management', table: 'patients', required: true },
      { name: 'Clinical EMR', table: 'encounters', required: true },
      { name: 'Appointments', table: 'appointments', required: true },
      { name: 'Billing System', table: 'invoices', required: true },
      { name: 'Pharmacy', table: 'prescriptions', required: false },
      { name: 'Laboratory', table: 'diagnostic_reports', required: false },
      { name: 'Inpatient Management', table: 'beds', required: false },
      { name: 'Blood Bank', table: 'blood_units', required: false },
      { name: 'Inventory', table: 'inventory_items', required: false },
      { name: 'Ambulance', table: 'ambulances', required: false },
      { name: 'Staff Management', table: 'users', required: false },
      { name: 'Service Requests', table: 'service_requests', required: false }
    ];

    let availableFeatures = [];
    let requiredFeatures = [];
    
    for (const feature of featureTables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${feature.table} WHERE tenant_id = $1`, [tenantId]);
        const count = result.rows[0].count;
        
        if (count > 0) {
          availableFeatures.push(feature.name);
          if (feature.required) requiredFeatures.push(feature.name);
          console.log(` ${feature.name}: Available (${count} records)`);
        } else {
          console.log(` ${feature.name}: Not Available (0 records)`);
        }
      } catch (error) {
        console.log(` ${feature.name}: Table not accessible`);
      }
    }

    const featureScore = (availableFeatures.length / featureTables.length) * 100;
    const requiredScore = requiredFeatures.length >= 4 ? 100 : (requiredFeatures.length / 4) * 100;
    
    console.log(` Feature Score: ${featureScore.toFixed(1)}%`);
    console.log(` Required Features Score: ${requiredScore.toFixed(1)}%\n`);

    // 3. Frontend Component Assessment
    console.log(' 3. FRONTEND COMPONENT ASSESSMENT');
    console.log(' ================================');
    
    const clientDir = join(process.cwd(), 'client', 'src');
    const componentChecks = [
      { name: 'Dashboard', path: 'pages/DashboardPage.jsx', required: true },
      { name: 'Patient Management', path: 'pages/PatientsPage.jsx', required: true },
      { name: 'EMR/Clinical', path: 'pages/EmrPage.jsx', required: true },
      { name: 'Appointments', path: 'pages/AppointmentsPage.jsx', required: false },
      { name: 'Billing', path: 'pages/BillingPage.jsx', required: false },
      { name: 'Inpatient', path: 'pages/InpatientPage.jsx', required: false },
      { name: 'Pharmacy', path: 'pages/EnhancedPharmacyPage.jsx', required: false },
      { name: 'Laboratory', path: 'pages/LabPage.jsx', required: false },
      { name: 'Login System', path: 'pages/UnifiedLoginPage.jsx', required: true }
    ];

    let availableComponents = [];
    let requiredComponents = [];
    
    for (const component of componentChecks) {
      const componentPath = join(clientDir, component.path);
      if (existsSync(componentPath)) {
        availableComponents.push(component.name);
        if (component.required) requiredComponents.push(component.name);
        console.log(` ${component.name}: Component exists`);
      } else {
        console.log(` ${component.name}: Component not found`);
      }
    }

    const componentScore = (availableComponents.length / componentChecks.length) * 100;
    const requiredComponentScore = requiredComponents.length >= 4 ? 100 : (requiredComponents.length / 4) * 100;
    
    console.log(` Component Score: ${componentScore.toFixed(1)}%`);
    console.log(` Required Components Score: ${requiredComponentScore.toFixed(1)}%\n`);

    // 4. Clinical Workflow Assessment
    console.log(' 4. CLINICAL WORKFLOW ASSESSMENT');
    console.log(' =============================');
    
    const workflowChecks = [
      { 
        name: 'Patient Registration', 
        check: async () => {
          const result = await query('SELECT COUNT(*) as count FROM patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId]);
          return result.rows[0].count > 0;
        }
      },
      { 
        name: 'Clinical Encounters', 
        check: async () => {
          const result = await query('SELECT COUNT(*) as count FROM encounters WHERE tenant_id = $1 AND DATE(visit_date) = CURRENT_DATE', [tenantId]);
          return result.rows[0].count > 0;
        }
      },
      { 
        name: 'Diagnostic Services', 
        check: async () => {
          const result = await query('SELECT COUNT(*) as count FROM diagnostic_reports WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId]);
          return result.rows[0].count > 0;
        }
      },
      { 
        name: 'Prescription Management', 
        check: async () => {
          try {
            const result = await query('SELECT COUNT(*) as count FROM prescription_items WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId]);
            return result.rows[0].count > 0;
          } catch (e) {
            return false;
          }
        }
      },
      { 
        name: 'Billing Process', 
        check: async () => {
          const result = await query('SELECT COUNT(*) as count FROM invoices WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId]);
          return result.rows[0].count > 0;
        }
      }
    ];

    let workflowResults = [];
    for (const workflow of workflowChecks) {
      try {
        const isWorking = await workflow.check();
        workflowResults.push({ name: workflow.name, working: isWorking });
        console.log(` ${workflow.name}: ${isWorking ? 'Working' : 'Not Active'}`);
      } catch (error) {
        workflowResults.push({ name: workflow.name, working: false });
        console.log(` ${workflow.name}: Error checking`);
      }
    }

    const workflowScore = (workflowResults.filter(w => w.working).length / workflowResults.length) * 100;
    console.log(` Workflow Score: ${workflowScore.toFixed(1)}%\n`);

    // 5. User Role Assessment
    console.log(' 5. USER ROLE ASSESSMENT');
    console.log(' =======================');
    
    const roleCheck = await query('SELECT role, COUNT(*) as count FROM users WHERE tenant_id = $1 GROUP BY role', [tenantId]);
    
    let totalRoles = 0;
    for (const role of roleCheck.rows) {
      console.log(` ${role.role}: ${role.count} users`);
      totalRoles++;
    }
    
    const roleScore = Math.min(100, (totalRoles / 5) * 100);
    console.log(` Role Diversity Score: ${roleScore.toFixed(1)}%\n`);

    // 6. Overall Assessment
    console.log(' 6. OVERALL DEMO READINESS ASSESSMENT');
    console.log(' ====================================');
    
    const overallScore = (dataScore * 0.25 + featureScore * 0.25 + componentScore * 0.2 + workflowScore * 0.2 + roleScore * 0.1);
    
    console.log(` Data Readiness: ${dataScore.toFixed(1)}%`);
    console.log(` Feature Readiness: ${featureScore.toFixed(1)}%`);
    console.log(` Component Readiness: ${componentScore.toFixed(1)}%`);
    console.log(` Workflow Readiness: ${workflowScore.toFixed(1)}%`);
    console.log(` Role Readiness: ${roleScore.toFixed(1)}%`);
    console.log(' ');
    console.log(` OVERALL DEMO READINESS: ${overallScore.toFixed(1)}%`);
    
    // 7. Recommendations
    console.log('\n 7. RECOMMENDATIONS');
    console.log(' =================');
    
    if (overallScore >= 85) {
      console.log(' Status: EXCELLENT - Ready for comprehensive customer demo');
      console.log(' Strengths: All major features available with good data volume');
      console.log(' Demo Focus: Showcase complete hospital management system');
    } else if (overallScore >= 70) {
      console.log(' Status: GOOD - Ready for focused customer demo');
      console.log(' Strengths: Core features functional with adequate data');
      console.log(' Demo Focus: Highlight key EMR and patient management features');
    } else if (overallScore >= 50) {
      console.log(' Status: ACCEPTABLE - Suitable for limited demo');
      console.log(' Strengths: Basic features available');
      console.log(' Demo Focus: Demonstrate core patient registration and EMR');
    } else {
      console.log(' Status: NEEDS IMPROVEMENT - Not ready for customer demo');
      console.log(' Issues: Critical features missing or insufficient data');
      console.log(' Action Required: Complete data population and feature implementation');
    }
    
    // 8. Demo Script Recommendations
    console.log('\n 8. DEMO SCRIPT RECOMMENDATIONS');
    console.log(' ==============================');
    
    console.log(' Recommended Demo Flow:');
    console.log(' 1. Login to DEMO tenant');
    console.log(' 2. Dashboard Overview - Show hospital statistics');
    console.log(' 3. Patient Registration - Add new patient');
    console.log(' 4. EMR Consultation - Create clinical encounter');
    console.log(' 5. Diagnostic Services - Order and view lab results');
    console.log(' 6. Billing - Generate invoice');
    console.log(' 7. Reports - Show hospital analytics');
    
    if (availableFeatures.includes('Inpatient')) {
      console.log(' 8. Inpatient Management - Show bed allocation');
    }
    
    if (availableFeatures.includes('Pharmacy')) {
      console.log(' 9. Pharmacy - Show prescription dispensing');
    }
    
    console.log('\n Key Demo Points:');
    console.log(` - Patient Database: ${patientCount.rows[0].count} records`);
    console.log(` - Clinical Encounters: ${encounterCount.rows[0].count} encounters`);
    console.log(` - Department Coverage: ${departmentCount.rows[0].count} departments`);
    console.log(` - User Roles: ${totalRoles} different roles`);
    console.log(` - Bed Capacity: ${bedCount.rows[0].count} beds`);
    
    return {
      success: true,
      overallScore: overallScore,
      dataScore: dataScore,
      featureScore: featureScore,
      componentScore: componentScore,
      workflowScore: workflowScore,
      roleScore: roleScore,
      availableFeatures: availableFeatures,
      workflowResults: workflowResults
    };
    
  } catch (error) {
    console.error(' Demo readiness assessment failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the assessment
assessDemoReadiness().then(result => {
  if (result.success) {
    console.log('\n Demo readiness assessment completed successfully!');
    console.log(` Overall readiness score: ${result.overallScore.toFixed(1)}%`);
    process.exit(0);
  } else {
    console.log('\n Demo readiness assessment failed!');
    console.log(` Error: ${result.error}`);
    process.exit(1);
  }
}).catch(error => {
  console.error(' Assessment execution failed:', error);
  process.exit(1);
});
