# Revised Tenant Login Credentials

**Standard Default for ALL Tenants**: `admin@<tenant.code>.com` / `Admin@123`

## Superadmin
| Tenant | Email | Password |
|--------|-------|----------|
| Platform Superadmin | `superadmin@emr.local` | `Admin@123` |

## Live Tenants (from DB)
| Tenant Name | Code/Schema | Admin Email | Password |
|-------------|-------------|-------------|----------|
| NHGL Healthcare Institute | nhgl | `admin@nhgl.com` | `Admin@123` |
| Starlight Mega Center | smcmega | `admin@smcmega.com` | `Admin@123` |
| Enterprise Hospital Systems | ehs | `admin@ehs.com` | `Admin@123` |
| Magnum Healthcare Pvt Ltd | magnum | `admin@magnum.com` | `Admin@123` |
| nitra healthcare solutions ltd (NHSL) | nhsl | `admin@nhsl.com` | `Admin@123` |
| Valley Health Clinic | valley | `admin@valley.com` | `Admin@123` |
| City General Hospital | citygeneral | `admin@citygeneral.com` | `Admin@123` |
| New Age Hospital | newage | `admin@newage.com` | `Admin@123` |
| MedFlow Demo: Enterprise Tier | demo-ent | `admin@demo-ent.com` | `Admin@123` |
| (others similar...)

**Note**: Password standardized to `Admin@123` in provisioning. For non-standard emails (e.g. admin@smcmega.local), run scripts/standardize_tenant_admins.js after creation.

## Tenant Creation Confirmation Email
- Fixed: provisioning.service.js already calls sendTenantWelcomeEmail with creds.
- Status: Logs to server/logs/latest_mail_preview.html if no API keys.
- To enable real email:
  - Set RESEND_API_KEY=... (preferred)
  - Or EMAIL_USER=your@gmail.com EMAIL_APP_PASSWORD=app_pass
- Test: Run scripts/create_fresh_tenant.cjs – check logs/email.

**Login URL**: http://localhost:5175 (select tenant by name/code)

