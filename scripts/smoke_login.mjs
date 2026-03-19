// Quick smoke test for login endpoint for all 4 demo tenants
const PASSWORD = 'Test@123';
const TESTS = [
  { tenantCode: 'seedling', email: 'admin@seedling.local' },
  { tenantCode: 'greenvalley', email: 'admin@greenvalley.local' },
  { tenantCode: 'sunrise', email: 'admin@sunrise.local' },
  { tenantCode: 'apollo', email: 'admin@apollo.local' },
];

for (const { tenantCode, email } of TESTS) {
  try {
    const res = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: tenantCode, email, password: PASSWORD })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ ${email} (${tenantCode}): role=${data.role}, tenantId=${data.tenantId}`);
    } else {
      console.log(`❌ ${email} (${tenantCode}): ${res.status} ${data.error}`);
    }
  } catch (err) {
    console.log(`💥 ${email} (${tenantCode}): ${err.message}`);
  }
}
