const http = require('http');
const data = JSON.stringify({ tenantId: 'superadmin', email: 'admin@medflow.com', password: 'test' });
const req = http.request({
  hostname: 'localhost',
  port: 4001,
  path: '/api/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, body));
});
req.on('error', e => console.log('ERROR:', e.message));
req.write(data);
req.end();
