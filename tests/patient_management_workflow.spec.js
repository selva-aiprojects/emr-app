import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';
const TENANT_NAME = 'City General Hospital';

const SUPPORT_STAFF = { email: 'jessica.taylor@citygen.local', password: 'Test@123', name: 'Staff Jessica Taylor' };
const NURSE = { email: 'sarah.jones@citygen.local', password: 'Test@123', name: 'Nurse Sarah Jones' };
const DOCTOR = { email: 'emily.chen@citygen.local', password: 'Test@123', name: 'Dr. Emily Chen' };

const PATIENTS = [
    {
        firstName: `John_${Date.now()}`,
        lastName: 'Smith',
        dob: '1985-03-15',
        phone: '555-0101',
        gender: 'Male',
        address: '123 Oak Street, Springfield',
        insurance: 'HealthPlus Insurance',
        emergencyContact: 'Jane Smith (Wife) - 555-0102',
        bloodType: 'O+',
        allergies: 'Penicillin',
        type: 'OP' // Outpatient
    },
    {
        firstName: `Mary_${Date.now()}`,
        lastName: 'Johnson',
        dob: '1990-07-22',
        phone: '555-0103',
        gender: 'Female',
        address: '456 Elm Avenue, Shelbyville',
        insurance: 'MediCare Plus',
        emergencyContact: 'Robert Johnson (Husband) - 555-0104',
        bloodType: 'A+',
        allergies: 'None',
        type: 'IP' // Inpatient
    },
    {
        firstName: `James_${Date.now()}`,
        lastName: 'Wilson',
        dob: '1978-11-08',
        phone: '555-0105',
        gender: 'Male',
        address: '789 Pine Road, Capital City',
        insurance: 'BlueCross BlueShield',
        emergencyContact: 'Susan Wilson (Sister) - 555-0106',
        bloodType: 'B+',
        allergies: 'Latex, Peanuts',
        type: 'OP' // Outpatient
    }
];

const ADMISSION_DETAILS = {
    room: 'Room 201',
    bed: 'Bed A',
    admissionType: 'Emergency',
    referringDoctor: 'Dr. Robert Brown',
    admissionReason: 'Acute abdominal pain',
    insuranceAuthorization: 'AUTH-2024-001'
};

test.describe('Patient Management Workflow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(CLIENT_URL);
    });

    async function login(page, tenantName, user) {
        await page.selectOption('select[name="tenantId"]', { label: tenantName });
        await page.fill('input[type="email"]', user.email);
        await page.fill('input[type="password"]', user.password);
        await page.click('button[type="submit"]');
        await expect(page.getByText(user.name)).toBeVisible();
    }

    test('Complete Patient Registration and Management Workflow', async ({ page }) => {
        console.log('Starting patient management workflow...');

        // Step 1: Register Multiple Patients
        for (const patient of PATIENTS) {
            await test.step(`Register ${patient.type} Patient: ${patient.firstName} ${patient.lastName}`, async () => {
                await login(page, TENANT_NAME, SUPPORT_STAFF);
                await page.getByRole('link', { name: 'Patients', exact: true }).click();
                await page.getByRole('button', { name: 'Register New Patient' }).click();

                const form = page.locator('form.structured-form');
                
                // Personal Information
                await form.locator('input[name="firstName"]').fill(patient.firstName);
                await form.locator('input[name="lastName"]').fill(patient.lastName);
                await form.locator('input[name="dob"]').fill(patient.dob);
                await form.locator('input[name="phone"]').fill(patient.phone);
                await form.locator('select[name="gender"]').selectOption(patient.gender);
                await form.locator('input[name="address"]').fill(patient.address);
                
                // Medical Information
                await form.locator('input[name="insurance"]').fill(patient.insurance);
                await form.locator('input[name="emergencyContact"]').fill(patient.emergencyContact);
                await form.locator('select[name="bloodType"]').selectOption(patient.bloodType);
                await form.locator('textarea[name="allergies"]').fill(patient.allergies);
                
                // Patient Type
                await form.locator('select[name="patientType"]').selectOption(patient.type);

                await page.getByRole('button', { name: 'Finalize & Open Record' }).click();

                // Verify patient registration
                await expect(page.locator('.record-header')).toContainText(`${patient.firstName} ${patient.lastName}`);
                await expect(page.getByText('MRN:')).toBeVisible();
                
                // If IP patient, complete admission process
                if (patient.type === 'IP') {
                    await page.getByRole('button', { name: 'Complete Admission' }).click();
                    
                    const admissionForm = page.locator('form.admission-form');
                    await admissionForm.locator('input[name="room"]').fill(ADMISSION_DETAILS.room);
                    await admissionForm.locator('input[name="bed"]').fill(ADMISSION_DETAILS.bed);
                    await admissionForm.locator('select[name="admissionType"]').selectOption(ADMISSION_DETAILS.admissionType);
                    await admissionForm.locator('input[name="referringDoctor"]').fill(ADMISSION_DETAILS.referringDoctor);
                    await admissionForm.locator('textarea[name="admissionReason"]').fill(ADMISSION_DETAILS.admissionReason);
                    await admissionForm.locator('input[name="insuranceAuthorization"]').fill(ADMISSION_DETAILS.insuranceAuthorization);
                    
                    await page.getByRole('button', { name: 'Complete Admission' }).click();
                    
                    // Verify admission
                    await expect(page.getByText('Admission completed successfully')).toBeVisible();
                    await expect(page.getByText(ADMISSION_DETAILS.room)).toBeVisible();
                }

                await page.getByRole('button', { name: 'Logout' }).click();
            });
        }

        // Step 2: Nurse Triage and Vital Signs
        await test.step('Nurse Triage Process', async () => {
            await login(page, TENANT_NAME, NURSE);
            await page.getByRole('link', { name: 'Patients', exact: true }).click();

            for (const patient of PATIENTS) {
                // Search and access patient
                await page.getByPlaceholder(/Search Name, MRN/).fill(patient.firstName);
                await page.getByText(`${patient.firstName} ${patient.lastName}`).first().click();
                
                // Add vital signs
                await page.getByRole('button', { name: 'Add Vital Signs' }).click();
                
                const vitalsForm = page.locator('form.vitals-form');
                await vitalsForm.locator('input[name="bloodPressure"]').fill('120/80');
                await vitalsForm.locator('input[name="heartRate"]').fill('72');
                await vitalsForm.locator('input[name="temperature"]').fill('98.6');
                await vitalsForm.locator('input[name="respiratoryRate"]').fill('16');
                await vitalsForm.locator('input[name="oxygenSaturation"]').fill('98');
                await vitalsForm.locator('input[name="height"]').fill('5.10');
                await vitalsForm.locator('input[name="weight"]').fill('175');
                
                await page.getByRole('button', { name: 'Save Vital Signs' }).click();
                
                // Verify vital signs recorded
                await expect(page.getByText('Vital signs recorded successfully')).toBeVisible();
                await expect(page.getByText('BP: 120/80')).toBeVisible();
                
                // Add triage notes
                await page.getByRole('button', { name: 'Add Triage Notes' }).click();
                await page.locator('textarea[name="notes"]').fill('Patient appears stable, no acute distress');
                await page.getByRole('button', { name: 'Save Triage Notes' }).click();
                
                await page.getByRole('link', { name: 'Patients', exact: true }).click();
            }

            await page.getByRole('button', { name: 'Logout' }).click();
        });

        // Step 3: Doctor Consultation and Treatment
        await test.step('Doctor Consultation Process', async () => {
            await login(page, TENANT_NAME, DOCTOR);
            await page.getByRole('link', { name: 'EMR' }).click();

            for (const patient of PATIENTS) {
                await page.getByRole('button', { name: 'New Consultation' }).click();
                
                // Search patient in EMR
                await page.locator('aside').getByPlaceholder(/Search Name, MRN/).fill(patient.firstName);
                await page.locator('aside').getByText(`${patient.firstName} ${patient.lastName}`).first().click();
                
                const consultationForm = page.locator('form.consultation-form');
                
                // Consultation details
                await consultationForm.locator('select[name="providerId"]').selectOption({ label: DOCTOR.name });
                await consultationForm.locator('select[name="type"]').selectOption(patient.type === 'IP' ? 'In-patient' : 'Out-patient');
                await consultationForm.locator('input[name="complaint"]').fill('Routine checkup and preventive care');
                await consultationForm.locator('textarea[name="history"]').fill('Patient has been managing chronic condition well');
                await consultationForm.locator('input[name="diagnosis"]').fill('Hypertension - well controlled');
                await consultationForm.locator('textarea[name="treatment"]').fill('Continue current medication regimen');
                await consultationForm.locator('textarea[name="plan"]').fill('Follow up in 3 months');
                
                // Add prescription
                await page.getByRole('button', { name: '+ Add Medicine' }).click();
                const medRow = consultationForm.locator('.med-row').first();
                await medRow.getByPlaceholder('Drug Name').fill('Lisinopril');
                await medRow.getByPlaceholder('Dosage').fill('10mg');
                await medRow.getByPlaceholder('Frequency').fill('Once daily');
                await medRow.getByPlaceholder('Duration').fill('30 days');
                
                // Add lab tests
                await page.getByRole('button', { name: '+ Add Lab Test' }).click();
                const testRow = consultationForm.locator('.test-row').first();
                await testRow.getByPlaceholder('Test Name').fill('Complete Blood Count');
                await testRow.getByPlaceholder('Instructions').fill('Fasting required');
                
                await page.getByRole('button', { name: 'Complete Consultation & Finalize Rx' }).click();
                
                // Verify consultation completion
                await expect(page.getByText('Consultation Saved Successfully')).toBeVisible();
                
                await page.getByRole('link', { name: 'EMR' }).click();
            }

            await page.getByRole('button', { name: 'Logout' }).click();
        });

        // Step 4: Patient Discharge Process (for IP patients)
        await test.step('Patient Discharge Process', async () => {
            await login(page, TENANT_NAME, DOCTOR);
            await page.getByRole('link', { name: 'Patients', exact: true }).click();

            // Find and discharge IP patients
            const ipPatients = PATIENTS.filter(p => p.type === 'IP');
            
            for (const patient of ipPatients) {
                await page.getByPlaceholder(/Search Name, MRN/).fill(patient.firstName);
                await page.getByText(`${patient.firstName} ${patient.lastName}`).first().click();
                
                // Check if discharge is available
                const dischargeBtn = page.getByRole('button', { name: 'Initiate Discharge' });
                if (await dischargeBtn.isVisible()) {
                    await dischargeBtn.click();
                    
                    const dischargeForm = page.locator('form.discharge-form');
                    await dischargeForm.locator('select[name="dischargeType"]').selectOption('Routine');
                    await dischargeForm.locator('textarea[name="summary"]').fill('Patient improved significantly, ready for discharge');
                    await dischargeForm.locator('textarea[name="instructions"]').fill('Continue medications at home, follow up in 1 week');
                    await dischargeForm.locator('input[name="followUpDate"]').fill('2024-06-15');
                    
                    await page.getByRole('button', { name: 'Complete Discharge' }).click();
                    
                    // Verify discharge
                    await expect(page.getByText('Discharge completed successfully')).toBeVisible();
                }
            }

            await page.getByRole('button', { name: 'Logout' }).click();
        });
    });

    test('Patient Search and Records Management', async ({ page }) => {
        console.log('Testing patient search and records...');

        await test.step('Test Patient Search Functionality', async () => {
            await login(page, TENANT_NAME, SUPPORT_STAFF);
            await page.getByRole('link', { name: 'Patients', exact: true }).click();
            
            // Test search by name
            await page.getByPlaceholder(/Search Name, MRN/).fill(PATIENTS[0].firstName);
            await page.waitForTimeout(1000); // Wait for search debounce
            await expect(page.getByText(`${PATIENTS[0].firstName} ${PATIENTS[0].lastName}`)).toBeVisible();
            
            // Test search by MRN (if available)
            await page.getByPlaceholder(/Search Name, MRN/).fill('');
            const firstPatient = page.getByText(`${PATIENTS[0].firstName} ${PATIENTS[0].lastName}`).first();
            await firstPatient.click();
            
            // Check patient record structure
            await expect(page.locator('.record-header')).toBeVisible();
            await expect(page.getByText('Personal Information')).toBeVisible();
            await expect(page.getByText('Medical History')).toBeVisible();
            await expect(page.getByText('Insurance Information')).toBeVisible();
            
            // Test timeline/history
            await expect(page.locator('.timeline-section')).toBeVisible();
            
            await page.getByRole('button', { name: 'Logout' }).click();
        });
    });

    test('Patient Appointment Scheduling', async ({ page }) => {
        console.log('Testing appointment scheduling...');

        await test.step('Schedule Patient Appointments', async () => {
            await login(page, TENANT_NAME, SUPPORT_STAFF);
            await page.getByRole('link', { name: 'Appointments' }).click();
            
            // Schedule appointment for OP patient
            await page.getByRole('button', { name: 'New Appointment' }).click();
            
            const form = page.locator('form.appointment-form');
            await form.locator('input[name="patientSearch"]').fill(PATIENTS[0].firstName);
            await page.getByText(`${PATIENTS[0].firstName} ${PATIENTS[0].lastName}`).first().click();
            await form.locator('select[name="doctor"]').selectOption({ label: DOCTOR.name });
            await form.locator('input[name="date"]').fill('2024-06-20');
            await form.locator('select[name="time"]').selectOption('10:00 AM');
            await form.locator('select[name="appointmentType"]').selectOption('Follow-up');
            await form.locator('textarea[name="notes"]').fill('Routine follow-up visit');
            
            await page.getByRole('button', { name: 'Schedule Appointment' }).click();
            
            // Verify appointment scheduling
            await expect(page.getByText('Appointment scheduled successfully')).toBeVisible();
            await expect(page.getByText(PATIENTS[0].firstName)).toBeVisible();
            
            await page.getByRole('button', { name: 'Logout' }).click();
        });
    });
});
