/**
 * Utility to ensure the server is running before tests start
 */
import http from 'http';

const PORT = process.env.PORT || 4005;
const URL = process.env.API_HEALTH_URL || `http://127.0.0.1:${PORT}/api/health`;
const MAX_ATTEMPTS = 30;
const DELAY = 1000;

async function checkServer() {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(URL, (res) => {
                    if (res.statusCode === 200) resolve();
                    else reject(new Error(`Status: ${res.statusCode}`));
                });
                req.on('error', reject);
                req.end();
            });
            console.log('✅ Server is ready!');
            return true;
        } catch (err) {
            process.stdout.write(`⏳ Waiting for server... (${i + 1}/${MAX_ATTEMPTS})\r`);
            await new Promise(r => setTimeout(r, DELAY));
        }
    }
    console.log('\n❌ Server failed to start in time.');
    return false;
}

checkServer().then(ready => {
    if (!ready) process.exit(1);
});
