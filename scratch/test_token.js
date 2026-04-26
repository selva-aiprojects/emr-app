import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'supersecret';

async function test() {
  const token = jwt.sign({
    userId: '12345678-1234-1234-1234-123456789012',
    tenantId: null,
    role: 'Superadmin',
    email: 'test@example.com'
  }, JWT_SECRET, { expiresIn: '7d' });

  console.log('Generated token length:', token.length);

  try {
    const res = await fetch('http://127.0.0.1:4011/api/superadmin/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status:', res.status);
    const data = await res.text();
    console.log('Response:', data);
  } catch (err) {
    console.log('Error 4011:', err.message);
  }

  try {
    const res = await fetch('http://127.0.0.1:4055/api/superadmin/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status 4055:', res.status);
    const data = await res.text();
    console.log('Response 4055:', data);
  } catch (err) {
    console.log('Error 4055:', err.message);
  }
}

test();
