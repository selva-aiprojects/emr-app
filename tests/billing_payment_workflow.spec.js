import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://127.0.0.1:5175';
const TENANT_NAME = 'City General Hospital';

const BILLING_OFFICER = { email: 'robert.billing@citygen.local', password: 'Test@123', name: 'Billing Officer Robert' };
const ACCOUNTS_MANAGER = { email: 'accounts@ehs.local', password: 'Test@123', name: 'Accounts Manager' };
const INSURANCE_COORDINATOR = { email: 'insurance@ehs.local', password: 'Test@123', name: 'Insurance Coordinator' };

const SERVICES = [
    {
        name: 'General Consultation',
        category: 'Professional Services',
        code: 'CPT-99213',
        price: 120.00,
        description: 'Office outpatient visit'
    },
    {
        name: 'Complete Blood Count',
        category: 'Laboratory Services',
        code: 'CPT-85025',
        price: 45.00,
        description: 'CBC with differential'
    },
    {
        name: 'Chest X-Ray',
        category: 'Radiology Services',
        code: 'CPT-71045',
        price: 150.00,
        description: 'Radiological examination'
    },
    {
        name: 'Emergency Room Visit',
        category: 'Professional Services',
        code: 'CPT-99284',
        price: 350.00,
        description: 'Emergency department visit'
    },
    {
        name: 'Inpatient Room - Private',
        category: 'Room & Board',
        code: 'REV-0210',
        price: 500.00,
        description: 'Private room per day'
    },
    {
        name: 'IV Therapy',
        category: 'Procedures',
        code: 'CPT-96365',
        price: 85.00,
        description: 'Intravenous therapy'
    }
];

const INSURANCE_PLANS = [
    {
        name: 'HealthPlus Insurance',
        type: 'PPO',
        copay: 20.00,
        coverage: 80,
        deductible: 1000.00,
        authorizationRequired: false
    },
    {
        name: 'MediCare Plus',
        type: 'HMO',
        copay: 15.00,
        coverage: 90,
        deductible: 500.00,
        authorizationRequired: true
    },
    {
        name: 'BlueCross BlueShield',
        type: 'PPO',
        copay: 25.00,
        coverage: 85,
        deductible: 1500.00,
        authorizationRequired: false
    }
];

const PAYMENT_METHODS = [
    {
        type: 'Cash',
        description: 'Direct cash payment'
    },
    {
        type: 'Credit Card',
        description: 'Visa/Mastercard/American Express'
    },
    {
        type: 'Debit Card',
        description: 'Bank debit card'
    },
    {
        type: 'Bank Transfer',
        description: 'Electronic fund transfer'
    },
    {
        type: 'Insurance Claim',
        description: 'Direct insurance billing'
    }
];

test.describe('Billing and Payment Workflow', () => {

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

    test('Complete Billing Workflow', async ({ page }) => {
        console.log('Starting billing workflow...');

        // Step 1: Setup Service Catalog
        await test.step('Setup Service Catalog', async () => {
            await login(page, TENANT_NAME, BILLING_OFFICER);
            await page.getByRole('link', { name: 'Billing' }).click();
            await page.getByRole('link', { name: 'Service Catalog' }).click();

            for (const service of SERVICES) {
                await page.getByRole('button', { name: 'Add Service' }).click();
                
                const form = page.locator('form.service-form');
                await form.locator('input[name="serviceName"]').fill(service.name);
                await form.locator('select[name="category"]').selectOption(service.category);
                await form.locator('input[name="code"]').fill(service.code);
                await form.locator('input[name="price"]').fill(service.price.toString());
                await form.locator('textarea[name="description"]').fill(service.description);
                
                await page.getByRole('button', { name: 'Add Service' }).click();
                
                // Verify service addition
                await expect(page.getByText('Service added successfully')).toBeVisible();
            }
        });

        // Step 2: Setup Insurance Plans
        await test.step('Setup Insurance Plans', async () => {
            await page.getByRole('link', { name: 'Insurance Plans' }).click();

            for (const plan of INSURANCE_PLANS) {
                await page.getByRole('button', { name: 'Add Insurance Plan' }).click();
                
                const form = page.locator('form.insurance-form');
                await form.locator('input[name="planName"]').fill(plan.name);
                await form.locator('select[name="planType"]').selectOption(plan.type);
                await form.locator('input[name="copay"]').fill(plan.copay.toString());
                await form.locator('input[name="coverage"]').fill(plan.coverage.toString());
                await form.locator('input[name="deductible"]').fill(plan.deductible.toString());
                await form.locator('select[name="authorizationRequired"]').selectOption(plan.authorizationRequired.toString());
                
                await page.getByRole('button', { name: 'Add Insurance Plan' }).click();
                
                // Verify plan addition
                await expect(page.getByText('Insurance plan added successfully')).toBeVisible();
            }
        });

        // Step 3: Create Patient Invoices
        await test.step('Create Patient Invoices', async () => {
            await page.getByRole('link', { name: 'Invoicing' }).click();
            
            // Check for billable encounters
            const billableEncounters = page.locator('.encounter-status').filter({ hasText: 'Ready for Billing' });
            const encounterCount = await billableEncounters.count();
            
            if (encounterCount > 0) {
                for (let i = 0; i < Math.min(encounterCount, 3); i++) {
                    const encounter = billableEncounters.nth(i);
                    await encounter.getByRole('button', { name: 'Create Invoice' }).click();
                    
                    // Review encounter details
                    await expect(page.getByText('Encounter Details')).toBeVisible();
                    await expect(page.getByText('Patient Information')).toBeVisible();
                    
                    // Add services to invoice
                    await page.getByRole('button', { name: 'Add Service' }).click();
                    const serviceForm = page.locator('form.invoice-service-form');
                    await serviceForm.locator('select[name="service"]').selectOption('General Consultation');
                    await serviceForm.locator('input[name="quantity"]').fill('1');
                    await serviceForm.locator('input[name="unitPrice"]').fill('120.00');
                    
                    await page.getByRole('button', { name: 'Add to Invoice' }).click();
                    
                    // Add lab tests
                    await page.getByRole('button', { name: 'Add Lab Test' }).click();
                    await serviceForm.locator('select[name="test"]').selectOption('Complete Blood Count');
                    await serviceForm.locator('input[name="quantity"]').fill('1');
                    
                    await page.getByRole('button', { name: 'Add to Invoice' }).click();
                    
                    // Apply insurance if applicable
                    const insuranceSection = page.locator('.insurance-section');
                    if (await insuranceSection.isVisible()) {
                        await insuranceSection.getByRole('button', { name: 'Apply Insurance' }).click();
                        await page.locator('select[name="insurancePlan"]').selectOption('HealthPlus Insurance');
                        await page.locator('input[name="policyNumber"]').fill('HP-123456');
                        await page.locator('input[name="authorizationNumber"]').fill('AUTH-789');
                        
                        await page.getByRole('button', { name: 'Apply Coverage' }).click();
                    }
                    
                    // Generate invoice
                    await page.getByRole('button', { name: 'Generate Invoice' }).click();
                    
                    // Verify invoice creation
                    await expect(page.getByText('Invoice generated successfully')).toBeVisible();
                    await expect(page.getByText('Invoice Number:')).toBeVisible();
                }
            }
        });

        // Step 4: Process Payments
        await test.step('Process Patient Payments', async () => {
            await page.getByRole('link', { name: 'Payment Processing' }).click();
            
            // Check for pending payments
            const pendingPayments = page.locator('.payment-status').filter({ hasText: 'Pending' });
            const paymentCount = await pendingPayments.count();
            
            if (paymentCount > 0) {
                for (let i = 0; i < Math.min(paymentCount, 3); i++) {
                    const payment = pendingPayments.nth(i);
                    await payment.getByRole('button', { name: 'Process Payment' }).click();
                    
                    // Review invoice details
                    await expect(page.getByText('Payment Details')).toBeVisible();
                    await expect(page.getByText('Invoice Summary')).toBeVisible();
                    
                    // Select payment method
                    const form = page.locator('form.payment-form');
                    await form.locator('select[name="paymentMethod"]').selectOption('Credit Card');
                    
                    // Enter payment details
                    await form.locator('input[name="cardNumber"]').fill('4111111111111111');
                    await form.locator('input[name="cardHolder"]').fill('Test Patient');
                    await form.locator('input[name="expiryDate"]').fill('12/25');
                    await form.locator('input[name="cvv"]').fill('123');
                    await form.locator('input[name="amount"]').fill('100.00');
                    
                    await page.getByRole('button', { name: 'Process Payment' }).click();
                    
                    // Verify payment processing
                    await expect(page.getByText('Payment processed successfully')).toBeVisible();
                    await expect(page.getByText('Payment Confirmation')).toBeVisible();
                }
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });

    test('Insurance Claims Processing', async ({ page }) => {
        console.log('Testing insurance claims workflow...');

        await test.step('Process Insurance Claims', async () => {
            await login(page, TENANT_NAME, INSURANCE_COORDINATOR);
            await page.getByRole('link', { name: 'Insurance Claims' }).click();
            
            // Check for claims to process
            const pendingClaims = page.locator('.claim-status').filter({ hasText: 'Pending Submission' });
            const claimCount = await pendingClaims.count();
            
            if (claimCount > 0) {
                for (let i = 0; i < Math.min(claimCount, 2); i++) {
                    const claim = pendingClaims.nth(i);
                    await claim.getByRole('button', { name: 'Process Claim' }).click();
                    
                    // Review claim details
                    await expect(page.getByText('Claim Information')).toBeVisible();
                    await expect(page.getByText('Service Details')).toBeVisible();
                    await expect(page.getByText('Insurance Information')).toBeVisible();
                    
                    // Validate claim information
                    await page.getByRole('button', { name: 'Validate Claim' }).click();
                    
                    // Check validation results
                    await expect(page.getByText('Claim Validation Results')).toBeVisible();
                    
                    // Submit claim
                    await page.getByRole('button', { name: 'Submit Claim' }).click();
                    await page.locator('textarea[name="submissionNotes"]').fill('Claim validated and submitted electronically');
                    
                    await page.getByRole('button', { name: 'Confirm Submission' }).click();
                    
                    // Verify claim submission
                    await expect(page.getByText('Claim submitted successfully')).toBeVisible();
                    await expect(page.getByText('Claim Number:')).toBeVisible();
                }
            }
        });

        // Step 2: Track Claim Status
        await test.step('Track Claim Status', async () => {
            await page.getByRole('link', { name: 'Claim Tracking' }).click();
            
            // Check submitted claims
            const submittedClaims = page.locator('.claim-status').filter({ hasText: 'Submitted' });
            const submittedCount = await submittedClaims.count();
            
            if (submittedCount > 0) {
                for (let i = 0; i < Math.min(submittedCount, 2); i++) {
                    const claim = submittedClaims.nth(i);
                    await claim.getByRole('button', { name: 'Check Status' }).click();
                    
                    // View claim status details
                    await expect(page.getByText('Claim Status')).toBeVisible();
                    await expect(page.getByText('Submission Date')).toBeVisible();
                    await expect(page.getByText('Expected Response')).toBeVisible();
                    
                    // Update claim status if needed
                    const updateBtn = page.getByRole('button', { name: 'Update Status' });
                    if (await updateBtn.isVisible()) {
                        await updateBtn.click();
                        await page.locator('select[name="newStatus"]').selectOption('Approved');
                        await page.locator('textarea[name="statusNotes"]').fill('Claim approved by insurance provider');
                        await page.locator('input[name="approvedAmount"]').fill('250.00');
                        
                        await page.getByRole('button', { name: 'Update Claim Status' }).click();
                        await expect(page.getByText('Claim status updated successfully')).toBeVisible();
                    }
                }
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });

    test('Financial Reporting and Analytics', async ({ page }) => {
        console.log('Testing financial reporting...');

        await test.step('Generate Financial Reports', async () => {
            await login(page, TENANT_NAME, ACCOUNTS_MANAGER);
            await page.getByRole('link', { name: 'Financial Reports' }).click();
            
            // Generate revenue report
            await page.getByRole('button', { name: 'Revenue Report' }).click();
            
            const form = page.locator('form.report-form');
            await form.locator('input[name="startDate"]').fill('2024-01-01');
            await form.locator('input[name="endDate"]').fill('2024-12-31');
            await form.locator('select[name="reportType"]').selectOption('Monthly Summary');
            await form.locator('select[name="department"]').selectOption('All Departments');
            
            await page.getByRole('button', { name: 'Generate Report' }).click();
            
            // Verify report generation
            await expect(page.getByText('Revenue Report Generated')).toBeVisible();
            await expect(page.locator('.report-content')).toBeVisible();
            await expect(page.getByText('Total Revenue')).toBeVisible();
            await expect(page.getByText('Insurance Collections')).toBeVisible();
            await expect(page.getByText('Patient Payments')).toBeVisible();
            
            // Generate aging report
            await page.getByRole('link', { name: 'Financial Reports' }).click();
            await page.getByRole('button', { name: 'Aging Report' }).click();
            
            await form.locator('select[name="reportType"]').selectOption('Aging Summary');
            await page.getByRole('button', { name: 'Generate Report' }).click();
            
            // Verify aging report
            await expect(page.getByText('Aging Report Generated')).toBeVisible();
            await expect(page.getByText('0-30 Days')).toBeVisible();
            await expect(page.getByText('31-60 Days')).toBeVisible();
            await expect(page.getByText('Over 90 Days')).toBeVisible();
        });

        // Step 2: Dashboard Analytics
        await test.step('Review Financial Dashboard', async () => {
            await page.getByRole('link', { name: 'Dashboard' }).click();
            
            // Check financial metrics
            await expect(page.getByText('Financial Snapshot')).toBeVisible();
            await expect(page.getByText('Monthly Revenue')).toBeVisible();
            await expect(page.getByText('Outstanding Claims')).toBeVisible();
            await expect(page.getByText('Collection Rate')).toBeVisible();
            
            // Check charts and graphs
            const revenueChart = page.locator('.revenue-chart');
            if (await revenueChart.isVisible()) {
                await expect(revenueChart).toBeVisible();
            }
            
            const paymentBreakdown = page.locator('.payment-breakdown');
            if (await paymentBreakdown.isVisible()) {
                await expect(paymentBreakdown).toBeVisible();
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });

    test('Payment Method Management', async ({ page }) => {
        console.log('Testing payment method management...');

        await test.step('Manage Payment Methods', async () => {
            await login(page, TENANT_NAME, BILLING_OFFICER);
            await page.getByRole('link', { name: 'Payment Methods' }).click();
            
            // Add new payment method
            await page.getByRole('button', { name: 'Add Payment Method' }).click();
            
            const form = page.locator('form.payment-method-form');
            await form.locator('select[name="type"]').selectOption('Mobile Payment');
            await form.locator('input[name="provider"]').fill('PayPal');
            await form.locator('input[name="merchantId"]').fill('MERCH-12345');
            await form.locator('textarea[name="description"]').fill('Mobile payment processing');
            await form.locator('select[name="status"]').selectOption('Active');
            
            await page.getByRole('button', { name: 'Add Payment Method' }).click();
            
            // Verify payment method addition
            await expect(page.getByText('Payment method added successfully')).toBeVisible();
            await expect(page.getByText('PayPal')).toBeVisible();
            
            // Test payment processing with new method
            await page.getByRole('link', { name: 'Payment Processing' }).click();
            const pendingPayments = page.locator('.payment-status').filter({ hasText: 'Pending' });
            
            if (await pendingPayments.count() > 0) {
                await pendingPayments.first().getByRole('button', { name: 'Process Payment' }).click();
                
                const paymentForm = page.locator('form.payment-form');
                await paymentForm.locator('select[name="paymentMethod"]').selectOption('Mobile Payment');
                await paymentForm.locator('input[name="mobileNumber"]').fill('555-0101');
                await paymentForm.locator('input[name="amount"]').fill('50.00');
                
                await page.getByRole('button', { name: 'Process Payment' }).click();
                await expect(page.getByText('Payment processed successfully')).toBeVisible();
            }
        });

        await page.getByRole('button', { name: 'Logout' }).click();
    });
});
