import { test, expect } from '@playwright/test';

/**
 * NHGL INSTITUTIONAL DATA INTEGRITY AUDIT
 * Automated cross-module verification of summary metrics vs detailed record sets.
 */
test.describe('NHGL Institutional Control Plane - Data Integrity Audit', () => {

    test.beforeEach(async ({ page }) => {
        // Step 0: Authentication
        await page.goto('http://localhost:5175/');
        await page.fill('input[type="email"]', 'admin@nhgl.com');
        await page.fill('input[type="password"]', 'Test@123');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=/Institutional Control Plane/i')).toBeVisible();
    });

    test('Verify Global Dashboard vs Module Registry Consistency', async ({ page }) => {
        console.log('\n--- Phase 01: Global Dashboard Audit ---');
        
        // Get Dashboard Metrics
        const dashboardPatients = await page.locator('.platform-metric-card:has-text("Total Registered Patients") .metric-value').textContent();
        const dashboardAppointments = await page.locator('.platform-metric-card:has-text("Check-up Bookings") .metric-value').textContent();
        
        console.log(`Dashboard Reports: ${dashboardPatients} Patients, ${dashboardAppointments} Appointments`);

        // Verify Patients
        console.log('\n--- Phase 02: Patient Registry Synchronization ---');
        await page.click('[data-testid="dash-nav-patients"]');
        await page.waitForSelector('[data-testid="patient-row"]', { state: 'attached', timeout: 5000 }).catch(() => {});
        const actualPatients = await page.locator('[data-testid="patient-row"]').count();
        console.log(`Actual Patient Rows: ${actualPatients}`);
        
        // If the registry is empty but dashboard shows numbers, it's a discrepancy
        if (parseInt(dashboardPatients) > 0) {
            expect(actualPatients).toBeGreaterThan(0);
        }

        // Verify Appointments
        console.log('\n--- Phase 03: Appointment Ledger Synchronization ---');
        await page.click('[data-testid="dash-nav-appointments"]');
        await page.waitForSelector('.animate-fade-in', { state: 'attached' });
        const actualAppointments = await page.locator('.p-6.hover\\:bg-slate-50').count(); // Count appointment cards
        console.log(`Actual Appointment Cards: ${actualAppointments}`);
        
        if (parseInt(dashboardAppointments) > 0) {
            expect(actualAppointments).toBeGreaterThan(0);
        }
    });

    test('Verify Pharmacy Dashboard vs Inventory Synchronization', async ({ page }) => {
        console.log('\n--- Phase 04: Pharmacy Shard Integrity ---');
        await page.click('[data-testid="dash-nav-pharmacy"]');
        
        // DERIVE EXPECTED FROM SUMMARY CARD
        const summaryTotal = await page.locator('.glass-panel:has-text("Total Items") h3').textContent();
        const summaryCritical = await page.locator('.glass-panel:has-text("Critical") h3').textContent();
        
        console.log(`Pharmacy Dashboard: ${summaryTotal} Total, ${summaryCritical} Critical`);

        // VERIFY INVENTORY TABLE
        await page.click('[data-testid="tab-inventory"]');
        await page.waitForSelector('table tbody tr');
        const inventoryRows = await page.locator('table tbody tr').count();
        console.log(`Actual Inventory Rows: ${inventoryRows}`);
        
        // Verify Summary == Detail
        expect(parseInt(summaryTotal)).toBe(inventoryRows);

        // VERIFY CRITICAL FILTER
        const criticalRows = await page.locator('table tbody tr:has-text("CRITICAL")').count();
        console.log(`Actual Critical Rows in Table: ${criticalRows}`);
        expect(parseInt(summaryCritical)).toBe(criticalRows);
    });

    test('Verify Inpatient Hub Census Integrity', async ({ page }) => {
        console.log('\n--- Phase 05: Inpatient Hub Audit ---');
        await page.click('[data-testid="dash-nav-inpatient"]');
        
        const censusText = await page.locator('.vital-node:has-text("Facility Census") .vital-value').textContent();
        const [activeCount, totalBeds] = censusText.split('/').map(s => parseInt(s.trim()));
        
        console.log(`Inpatient Census: ${activeCount} Active / ${totalBeds} Total`);

        // VERIFY LEDGER ROWS
        await page.click('button:has-text("Admission Ledger")');
        const ledgerRows = await page.locator('[data-testid="encounter-row"]').count();
        
        // Ignore ghost rows if any
        const realRows = await page.locator('[data-testid="encounter-row"]:not(:has-text("EMERGENCY_RENDER_TEST"))').count();
        console.log(`Actual Inpatient Rows: ${realRows}`);
        
        expect(activeCount).toBe(realRows);
    });

});
