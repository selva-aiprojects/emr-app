# Provisioning Service Update Summary

## Version Update
- **File**: `server/services/provisioning.service.js`
- **Status**: Updated with institutional branding support and audit log fixes

## Critical Updates Applied

### 1. Institutional Branding Support (NEW)
**Problem**: The provisioning service was not creating tenants with branding columns, causing issues when trying to use institutional branding features.

**Solution**: Updated both tenant table inserts to include branding columns:

#### Legacy Tenants Table (`emr.tenants`)
```sql
INSERT INTO emr.tenants (name, code, subdomain, contact_email, subscription_tier, status, logo_url, theme, features, billing_config, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9, NOW(), NOW())
```

#### Management Tenants Table (`emr.management_tenants`)
```sql
INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier, logo_url, theme, features, billing_config, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
```

### 2. Audit Log Fixes (CRITICAL)
**Problem**: The provisioning service was using the old `management_system_logs` table structure and had UUID compatibility issues.

**Solution**: Updated all audit logging to use the new `audit_logs` table structure:

#### Success Logging
```sql
INSERT INTO emr.audit_logs (id, tenant_id, user_id, user_name, action, entity_name, entity_id, details, ip_address, user_agent, timestamp)
VALUES (gen_random_uuid(), $1, $2, $3, 'tenant.provision', 'tenant', $4, $5, NULL, NULL, NOW())
```

#### Error Logging
```sql
INSERT INTO emr.audit_logs (id, tenant_id, user_id, user_name, action, entity_name, entity_id, details, ip_address, user_agent, timestamp)
VALUES (gen_random_uuid(), $1, NULL, NULL, 'tenant.provision.failed', 'tenant', $2, $3, NULL, NULL, NOW())
```

### 3. Branding Parameter Support
**Added support for the following tenant data parameters:**
- `tenantData.logoUrl` - Institutional logo URL
- `tenantData.theme` - Theme customization (colors, etc.)
- `tenantData.features` - Feature toggles (inventory, telehealth, etc.)
- `tenantData.billingConfig` - Payment gateway settings

### 4. Schema File Integration
**The provisioning service automatically uses:**
- Updated `SHARD_MASTER_BASELINE.sql` (v2.3.1) for tenant schema creation
- Includes all institutional tables and audit log fixes
- Proper UUID column types throughout

## Key Features Now Supported

### New Tenant Provisioning
- **Complete branding setup** from tenant creation
- **Theme customization** available immediately
- **Feature toggles** configured during provisioning
- **Billing integration** ready from day one
- **Proper audit trail** for all provisioning operations

### Audit Compliance
- **Complete audit logging** for tenant creation
- **Error tracking** with proper UUID handling
- **User attribution** for all tenant operations
- **Comprehensive metadata** in audit records

## Usage Examples

### Basic Tenant Provisioning
```javascript
const tenantData = {
  name: 'New Hospital',
  code: 'NH001',
  subdomain: 'newhospital',
  contactEmail: 'admin@newhospital.com',
  subscriptionTier: 'Enterprise',
  // NEW: Branding support
  logoUrl: 'https://example.com/logo.png',
  theme: {
    primary: '#0f5a6e',
    accent: '#f57f17',
    hero: '#1e293b',
    text: '#334155'
  },
  features: {
    inventory: true,
    telehealth: true,
    payroll: false,
    staff_governance: true,
    institutional_ledger: true
  },
  billingConfig: {
    provider: 'Stripe',
    currency: 'INR',
    gatewayKey: 'sk_test_...',
    accountStatus: 'linked'
  }
};

const adminData = {
  name: 'Hospital Admin',
  email: 'admin@newhospital.com'
};

const tenant = await provisionNewTenant(tenantData, adminData);
```

## Migration Compatibility
- **Backward Compatible**: Existing provisioning calls work without changes
- **Forward Compatible**: New branding parameters are optional
- **Audit Safe**: All provisioning operations are properly logged
- **Schema Ready**: Uses updated SHARD file with all fixes

## Impact
This update ensures that:
1. **New tenants** get complete branding capabilities from creation
2. **Institutional Branding** works immediately after provisioning
3. **Audit logging** works properly for all tenant operations
4. **Resource Synchronization** errors are prevented at the provisioning level
5. **Complete audit trail** for compliance and troubleshooting

## Verification Checklist
- [x] Branding columns added to both tenant tables
- [x] Audit logging updated to use audit_logs table
- [x] UUID compatibility issues resolved
- [x] Branding parameters properly integrated
- [x] Error handling updated with proper audit logging
- [x] Schema file integration confirmed

The provisioning service is now fully compatible with the institutional branding features and audit log fixes!
