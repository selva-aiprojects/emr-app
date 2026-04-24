import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';
const TENANT_NAME = 'City General Hospital';

const LAB_TECH = { email: 'michael.brown@citygen.local', password: 'Test@123', name: 'Lab Tech Michael Brown' };
const PHARMACIST = { email: 'pharmacy@ehs.local', password: 'Test@123', name: 'Pharmacist John' };
const DOCTOR = { email: 'emily.chen@citygen.local', password: 'Test@123', name: 'Dr. Emily Chen' };

const LAB_TESTS = [
    {
        name: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        sampleType: 'Blood',
        instructions: 'Fasting required for 8 hours',
        normalRange: 'RBC: 4.5-5.5 M/µL, WBC: 4,000-11,000/µL',
        price: 45.00
    },
    {
        name: 'Comprehensive Metabolic Panel',
        category: 'Chemistry',
        sampleType: 'Blood',
        instructions: 'Fasting required for 12 hours',
        normalRange: 'Glucose: 70-100 mg/dL, Creatinine: 0.6-1.3 mg/dL',
        price: 85.00
    },
    {
        name: 'Lipid Panel',
        category: 'Chemistry',
        sampleType: 'Blood',
        instructions: 'Fasting required for 12 hours',
        normalRange: 'Total Cholesterol: <200 mg/dL, HDL: >40 mg/dL',
        price: 65.00
    },
    {
        name: 'Urinalysis',
        category: 'Urinalysis',
        sampleType: 'Urine',
        instructions: 'Clean catch midstream sample',
        normalRange: 'Color: Pale yellow, pH: 4.5-8.0',
        price: 25.00
    },
    {
        name: 'Chest X-Ray',
        category: 'Radiology',
        sampleType: 'Imaging',
        instructions: 'Remove jewelry and metal objects',
        normalRange: 'Normal chest architecture',
        price: 150.00
    }
];

const MEDICATIONS = [
    {
        name: 'Amoxicillin 500mg',
        category: 'Antibiotics',
        dosage: '500mg',
        frequency: 'Three times daily',
        duration: '7 days',
        instructions: 'Take with food',
        sideEffects: 'Nausea, diarrhea, allergic reactions',
        contraindications: 'Penicillin allergy',
        stockQuantity: 1000,
        price: 15.50
    },
    {
        name: 'Lisinopril 10mg',
        category: 'Antihypertensive',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take at same time each day',
        sideEffects: 'Dry cough, dizziness, headache',
        contraindications: 'Pregnancy, renal artery stenosis',
        stockQuantity: 500,
        price: 22.75
    },
    {
        name: 'Metformin 500mg',
        category: 'Antidiabetic',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'Take with meals',
        sideEffects: 'GI upset, metallic taste',
        contraindications: 'Renal impairment, metabolic acidosis',
        stockQuantity: 750,
        price: 18.25
    },
    {
        name: 'Ibuprofen 400mg',
        category: 'Analgesic',
        dosage: '400mg',
        frequency: 'Every 6-8 hours as needed',
        duration: 'As needed',
        instructions: 'Take with food or milk',
        sideEffects: 'Stomach upset, ulcer risk',
        contraindications: 'Active ulcer, aspirin allergy',
        stockQuantity: 2000,
        price: 8.50
    }
];

const TEST_RESULTS = {
    'Complete Blood Count (CBC)': {
        results: 'RBC: 4.8 M/µL, WBC: 7,500/µL, Hemoglobin: 14.5 g/dL, Hematocrit: 43%, Platelets: 250,000/µL',
        interpretation: 'Within normal limits',
        status: 'Completed'
    },
    'Comprehensive Metabolic Panel': {
        results: 'Glucose: 92 mg/dL, BUN: 15 mg/dL, Creatinine: 0.9 mg/dL, Sodium: 140 mEq/L, Potassium: 4.2 mEq/L',
        interpretation: 'Within normal limits',
        status: 'Completed'
    },
    'Lipid Panel': {
        results: 'Total Cholesterol: 185 mg/dL, HDL: 55 mg/dL, LDL: 110 mg/dL, Triglycerides: 120 mg/dL',
        interpretation: 'Borderline high LDL, otherwise normal',
        status: 'Completed'
    }
};

test.describe('Laboratory and Pharmacy Workflow', () => {

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

    test('Complete Laboratory Workflow', async ({ page }) => {
        console.log('Starting laboratory workflow...');

        // Step 1: Setup Lab Test Catalog
        await test.step('Setup Lab Test Catalog', async () => {
            await login(page, TENANT_NAME, LAB_TECH);
            await page.getByRole('link', { name: 'Lab Management' }).click();
            await page.getByRole('link', { name: 'Test Catalog' }).click();

            for (const test of LAB_TESTS) {
                await page.getByRole('button', { name: 'Add Test' }).click();
                
                const form = page.locator('form.test-catalog-form');
                await form.locator('input[name="testName"]').fill(test.name);
                await form.locator('select[name="category"]').selectOption(test.category);
                await form.locator('select[name="sampleType"]').selectOption(test.sampleType);
                await form.locator('textarea[name="instructions"]').fill(test.instructions);
                await form.locator('textarea[name="normalRange"]').fill(test.normalRange);
                await form.locator('input[name="price"]').fill(test.price.toString());
                
                await page.getByRole('button', { name: 'Add Test to Catalog' }).click();
                
                // Verify test addition
                await expect(page.getByText('Test added to catalog successfully')).toBeVisible();
            }

            await page.getByRole('button', { name: 'Logout' }).click();
        });

        // Step 2: Process Lab Orders
        await test.step('Process Lab Orders', async () => {
            await login(page, TENANT_NAME, LAB_TECH);
            await page.getByRole('link', { name: 'Lab Orders' }).click();
            
            // Check for pending orders
            const pendingOrders = page.locator('.order-status').filter({ hasText: 'Pending' });
            const orderCount = await pendingOrders.count();
            
            if (orderCount > 0) {
                for (let i = 0; i < Math.min(orderCount, 3); i++) {
                    const order = pendingOrders.nth(i);
                    await order.getByRole('button', { name: 'Process Order' }).click();
                    
                    // Sample collection
                    await page.getByRole('button', { name: 'Mark Sample Collected' }).click();
                    await page.locator('input[name="collectedBy"]').fill(LAB_TECH.name);
                    await page.locator('input[name="collectionTime"]').fill(new Date().toLocaleTimeString());
                    await page.getByRole('button', { name: 'Confirm Collection' }).click();
                    
                    // Start analysis
                    await page.getByRole('button', { name: 'Start Analysis' }).click();
                    await page.locator('textarea[name="analysisNotes"]').fill('Sample received in good condition');
                    await page.getByRole('button', { name: 'Begin Testing' }).click();
                }
            }
        });

        // Step 3: Record Test Results
        await test.step('Record Test Results', async () => {
            await page.getByRole('link', { name: 'Lab Orders' }).click();
            
            // Find orders in progress
            const inProgressOrders = page.locator('.order-status').filter({ hasText: 'In Progress' });
            const orderCount = await inProgressOrders.count();
            
            if (orderCount > 0) {
                for (let i = 0; i < Math.min(orderCount, 3); i++) {
                    const order = inProgressOrders.nth(i);
                    await order.getByRole('button', { name: 'Enter Results' }).click();
                    
                    const testName = await page.locator('.test-name').textContent();
                    const expectedResult = TEST_RESULTS[testName];
                    
                    if (expectedResult) {
                        const form = page.locator('form.results-form');
                        await form.locator('textarea[name="results"]').fill(expectedResult.results);
                        await form.locator('textarea[name="interpretation"]').fill(expectedResult.interpretation);
                        await form.locator('select[name="status"]').selectOption(expectedResult.status);
                        await form.locator('input[name="technician"]').fill(LAB_TECH.name);
                        
                        await page.getByRole('button', { name: 'Submit Results' }).click();
                        
                        // Verify result submission
                        await expect(page.getByText('Results submitted successfully')).toBeVisible();
                    }
                }
            }
        });

        // Step 4: Quality Control
        await test.step('Perform Quality Control', async () => {
            await page.getByRole('link', { name: 'Quality Control' }).click();
            
            // Add QC sample
            await page.getByRole('button', { name: 'Add QC Sample' }).click();
            
            const form = page.locator('form.qc-form');
            await form.locator('select[name="testName"]').selectOption('Complete Blood Count (CBC)');
            await form.locator('select[name="qcLevel"]').selectOption('Level 1');
            await form.locator('input[name="expectedValue"]').fill('4.8');
            await form.locator('input[name="measuredValue"]').fill('4.75');
            await form.locator('select[name="status"]').selectOption('Pass');
            
            await page.getByRole('button', { name: 'Record QC Result' }).click();
            
            // Verify QC recording
            await expect(page.getByText('QC result recorded successfully')).toBeVisible();
            
            await page.getByRole('button', { name: 'Logout' }).click();
        });
    });

    test('Complete Pharmacy Workflow', async ({ page }) => {
        console.log('Starting pharmacy workflow...');

        // Step 1: Setup Pharmacy Inventory
        await test.step('Setup Pharmacy Inventory', async () => {
            await login(page, TENANT_NAME, PHARMACIST);
            await page.getByRole('link', { name: 'Pharmacy' }).click();
            await page.getByRole('link', { name: 'Inventory Management' }).click();

            for (const medication of MEDICATIONS) {
                await page.getByRole('button', { name: 'Add Medication' }).click();
                
                const form = page.locator('form.medication-form');
                await form.locator('input[name="name"]').fill(medication.name);
                await form.locator('select[name="category"]').selectOption(medication.category);
                await form.locator('input[name="dosage"]').fill(medication.dosage);
                await form.locator('input[name="stockQuantity"]').fill(medication.stockQuantity.toString());
                await form.locator('input[name="price"]').fill(medication.price.toString());
                await form.locator('textarea[name="instructions"]').fill(medication.instructions);
                await form.locator('textarea[name="sideEffects"]').fill(medication.sideEffects);
                await form.locator('textarea[name="contraindications"]').fill(medication.contraindications);
                
                await page.getByRole('button', { name: 'Add Medication' }).click();
                
                // Verify medication addition
                await expect(page.getByText('Medication added successfully')).toBeVisible();
            }
        });

        // Step 2: Process Prescriptions
        await test.step('Process Prescriptions', async () => {
            await page.getByRole('link', { name: 'Prescriptions' }).click();
            
            // Check for new prescriptions
            const newPrescriptions = page.locator('.prescription-status').filter({ hasText: 'New' });
            const prescriptionCount = await newPrescriptions.count();
            
            if (prescriptionCount > 0) {
                for (let i = 0; i < Math.min(prescriptionCount, 3); i++) {
                    const prescription = newPrescriptions.nth(i);
                    await prescription.getByRole('button', { name: 'Process Prescription' }).click();
                    
                    // Review prescription details
                    await expect(page.getByText('Prescription Details')).toBeVisible();
                    await expect(page.getByText('Patient Information')).toBeVisible();
                    await expect(page.getByText('Medication Details')).toBeVisible();
                    
                    // Verify medication availability
                    const medicationCheck = page.locator('.medication-availability');
                    if (await medicationCheck.isVisible()) {
                        await expect(medicationCheck.getByText('In Stock')).toBeVisible();
                    }
                    
                    // Dispense medication
                    await page.getByRole('button', { name: 'Dispense Medication' }).click();
                    await page.locator('input[name="dispensedBy"]').fill(PHARMACIST.name);
                    await page.locator('textarea[name="counsellingNotes"]').fill('Take as prescribed, complete full course');
                    
                    await page.getByRole('button', { name: 'Complete Dispensing' }).click();
                    
                    // Verify dispensing
                    await expect(page.getByText('Prescription dispensed successfully')).toBeVisible();
                }
            }
        });

        // Step 3: Medication Inventory Management
        await test.step('Manage Medication Inventory', async () => {
            await page.getByRole('link', { name: 'Inventory Management' }).click();
            
            // Check stock levels
            const lowStockItems = page.locator('.stock-status').filter({ hasText: 'Low Stock' });
            
            if (await lowStockItems.count() > 0) {
                // Reorder low stock items
                await page.getByRole('button', { name: 'Reorder Low Stock Items' }).click();
                
                const form = page.locator('form.reorder-form');
                await form.locator('input[name="supplier"]').fill('MediSupply Corp');
                await form.locator('input[name="orderDate"]').fill(new Date().toISOString().split('T')[0]);
                await form.locator('input[name="expectedDelivery"]').fill('2024-06-25');
                
                await page.getByRole('button', { name: 'Submit Reorder' }).click();
                
                await expect(page.getByText('Reorder submitted successfully')).toBeVisible();
            }
            
            // Update stock counts
            const medicationRows = page.locator('.medication-row');
            const rowCount = await medicationRows.count();
            
            for (let i = 0; i < Math.min(rowCount, 2); i++) {
                const row = medicationRows.nth(i);
                await row.getByRole('button', { name: 'Update Stock' }).click();
                
                const form = page.locator('form.stock-update-form');
                await form.locator('input[name="newQuantity"]').fill('500');
                await form.locator('select[name="adjustmentType"]').selectOption('Stock Addition');
                await form.locator('textarea[name="reason"]').fill('Regular inventory update');
                
                await page.getByRole('button', { name: 'Update Stock' }).click();
                
                await expect(page.getByText('Stock updated successfully')).toBeVisible();
            }
        });

        // Step 4: Drug Interaction Checking
        await test.step('Check Drug Interactions', async () => {
            await page.getByRole('link', { name: 'Drug Interactions' }).click();
            
            // Test interaction checking
            await page.getByRole('button', { name: 'Check Interactions' }).click();
            
            const form = page.locator('form.interaction-form');
            await form.locator('select[name="medication1"]').selectOption('Amoxicillin 500mg');
            await form.locator('select[name="medication2"]').selectOption('Lisinopril 10mg');
            
            await page.getByRole('button', { name: 'Check Interaction' }).click();
            
            // Verify interaction check results
            await expect(page.getByText('Interaction Check Results')).toBeVisible();
            await expect(page.getByText('No significant interactions found')).toBeVisible();
            
            await page.getByRole('button', { name: 'Logout' }).click();
        });
    });

    test('Lab-Pharmacy Integration', async ({ page }) => {
        console.log('Testing lab-pharmacy integration...');

        await test.step('Test Integrated Workflow', async () => {
            await login(page, TENANT_NAME, DOCTOR);
            await page.getByRole('link', { name: 'EMR' }).click();
            await page.getByRole('button', { name: 'New Consultation' }).click();
            
            // Search for a patient
            await page.locator('aside').getByPlaceholder(/Search Name, MRN/).fill('Test');
            await page.locator('aside').getByText(/Test/).first().click();
            
            const form = page.locator('form.consultation-form');
            
            // Order lab tests
            await page.getByRole('button', { name: '+ Add Lab Test' }).click();
            const testRow = form.locator('.test-row').first();
            await testRow.getByPlaceholder('Test Name').fill('Complete Blood Count (CBC)');
            await testRow.getByPlaceholder('Instructions').fill('Routine check');
            
            // Add prescription
            await page.getByRole('button', { name: '+ Add Medicine' }).click();
            const medRow = form.locator('.med-row').first();
            await medRow.getByPlaceholder('Drug Name').fill('Amoxicillin 500mg');
            await medRow.getByPlaceholder('Dosage').fill('500mg');
            await medRow.getByPlaceholder('Frequency').fill('Three times daily');
            await medRow.getByPlaceholder('Duration').fill('7 days');
            
            // Check for drug-lab interactions
            await page.getByRole('button', { name: 'Check Interactions' }).click();
            await expect(page.getByText('Interaction Check Complete')).toBeVisible();
            
            await page.getByRole('button', { name: 'Complete Consultation & Finalize Rx' }).click();
            await expect(page.getByText('Consultation Saved Successfully')).toBeVisible();
            
            await page.getByRole('button', { name: 'Logout' }).click();
        });
    });
});
