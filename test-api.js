
import { getReportSummary } from './server/db/repository.js';
import dotenv from 'dotenv';
dotenv.config();

const testTenantId = 'tenant-1'; // Common test ID in this app

async function test() {
    try {
        console.log('Fetching report summary for', testTenantId);
        const data = await getReportSummary(testTenantId);
        console.log('SUCCESS:');
        console.log('Daily Activity Data Points:', data.dailyActivity.length);
        console.log('First 3 days:', data.dailyActivity.slice(0, 3));
        console.log('Last day:', data.dailyActivity[data.dailyActivity.length - 1]);
    } catch (err) {
        console.error('FAILED:', err);
    }
}

test();
