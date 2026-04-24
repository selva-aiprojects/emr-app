# Feature Flagging System Implementation

This document describes the comprehensive feature flagging system implemented for the EMR application to gate major modules based on subscription tiers and provide emergency kill switches.

## Overview

The feature flagging system controls access to major application modules based on:
- **Subscription Tiers**: Basic, Professional, Enterprise
- **Custom Feature Assignments**: Tenant-specific overrides
- **Global Kill Switches**: Emergency disable for high-risk features

## Architecture

### Backend Components

#### 1. Feature Flag Service (`server/services/featureFlag.service.js`)
- Core service for evaluating feature flags
- Tenant tier-based feature evaluation
- Global kill switch management
- Caching for performance

#### 2. Feature Flag Middleware (`server/middleware/featureFlag.middleware.js`)
- Request-level feature evaluation
- Module access gating
- Centralized evaluation point

#### 3. Database Schema (`database/migrations/004_feature_flags.sql`)
- `tenant_features`: Custom feature assignments
- `global_kill_switches`: Emergency kill switches
- `feature_flag_audit`: Change tracking
- `tenant_feature_status`: Computed view for effective status

### Frontend Components

#### 1. Feature Flag Service (`client/src/services/featureFlag.service.js`)
- Frontend feature flag evaluation
- Caching and API integration
- React hooks for component integration

#### 2. FeatureGate Components (`client/src/components/FeatureGate.jsx`)
- `FeatureGate`: Conditional rendering wrapper
- `ModuleGate`: Module-specific gating
- `FeatureButton`: Conditional button rendering
- `FeatureLink`: Conditional link rendering

## Feature Flags

### Naming Convention
All feature flags follow the pattern: `permission-{module}-access`

### Available Flags
- `permission-core_engine-access`: Core EMR functionality (dashboard, patients, appointments, EMR, etc.)
- `permission-hr_payroll-access`: HR and payroll features (employees module)
- `permission-accounts-access`: Financial features (billing, accounts)
- `permission-customer_support-access`: Support features
- `permission-inpatient-access`: Advanced Clinical workflows (Inpatient admissions, Bed management)

### Module Mapping
```javascript
{
  dashboard: 'permission-core_engine-access',
  patients: 'permission-core_engine-access',
  appointments: 'permission-core_engine-access',
  emr: 'permission-core_engine-access',
  inpatient: 'permission-inpatient-access',
  employees: 'permission-hr_payroll-access',
  billing: 'permission-accounts-access',
  accounts: 'permission-accounts-access',
  pharmacy: 'permission-core_engine-access',
  inventory: 'permission-core_engine-access',
  reports: 'permission-core_engine-access',
  support: 'permission-customer_support-access'
}
```

## Subscription Tiers

### Basic Tier
- Core Engine access
- **Customer Support** access (Universal for all tiers)

### Professional Tier
- Core Engine + Customer Support
- **Inpatient Management** (High-complexity clinical)

### Enterprise Tier
- All features enabled:
  - Core Engine + Customer Support + Inpatient
  - **HR/Payroll** and **Institutional Accounts/Billing**

## Usage Examples

### Backend Route Protection

```javascript
// Protect entire routes with feature gating
app.post('/api/employees', 
  requireTenant, 
  requirePermission('employees'), 
  moduleGate('employees'),  // Feature gate
  async (req, res) => {
    // Route implementation
  }
);

// Check feature access in controllers
if (req.featureFlags['permission-hr_payroll-access']) {
  // Show advanced features
}
```

### Frontend Conditional Rendering

```jsx
import { FeatureGate, ModuleGate } from './components/FeatureGate.jsx';

function Navigation({ tenantId }) {
  return (
    <nav>
      <ModuleGate module="dashboard" tenantId={tenantId}>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </ModuleGate>
      
      <ModuleGate module="employees" tenantId={tenantId}>
        <NavLink to="/employees">HR & Payroll</NavLink>
      </ModuleGate>
      
      <FeatureGate 
        feature="permission-accounts-access" 
        tenantId={tenantId}
        fallback={<UpgradePrompt />}
      >
        <NavLink to="/billing">Billing</NavLink>
      </FeatureGate>
    </nav>
  );
}
```

### Using Hooks

```jsx
import { useFeatureAccess } from './components/FeatureGate.jsx';

function EmployeeManagement({ tenantId }) {
  const { canAccessModule, loading } = useFeatureAccess(tenantId);
  
  if (loading) return <Loading />;
  
  if (!canAccessModule('employees')) {
    return <FeatureUnavailable feature="HR & Payroll" />;
  }
  
  return <EmployeeList />;
}
```

## API Endpoints

### Get Tenant Feature Flags
```
GET /api/tenants/:id/features
Authorization: Bearer <token>
```

Response:
```json
{
  "permission-core_engine-access": {
    "enabled": true,
    "killSwitchActive": false
  },
  "permission-hr_payroll-access": {
    "enabled": false,
    "killSwitchActive": false
  }
}
```

### Admin: Get Global Kill Switches
```
GET /api/admin/kill-switches
Authorization: Bearer <admin-token>
```

### Admin: Update Kill Switch
```
POST /api/admin/kill-switches
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "featureFlag": "permission-hr_payroll-access",
  "enabled": true,
  "reason": "Critical bug discovered in payroll calculation"
}
```

## Database Operations

### Adding Custom Features to Tenant
```sql
INSERT INTO emr.tenant_features (tenant_id, feature_flag, enabled)
VALUES (1, 'permission-hr_payroll-access', true)
ON CONFLICT (tenant_id, feature_flag) 
DO UPDATE SET enabled = EXCLUDED.enabled;
```

### Updating Tenant Subscription Tier
```sql
UPDATE emr.tenants 
SET subscription_tier = 'Enterprise' 
WHERE id = 1;
```

### Checking Feature Status
```sql
SELECT * FROM emr.tenant_feature_status 
WHERE tenant_id = 1 AND feature_flag = 'permission-hr_payroll-access';
```

## Emergency Procedures

### Enabling Kill Switch
1. Access admin panel or use API endpoint
2. Select the feature flag to disable
3. Enable kill switch with reason
4. Monitor system for impact

### Kill Switch Impact
- Immediate feature disabling across all tenants
- UI components hide/disable automatically
- API endpoints return 403 for affected features
- Audit trail created for compliance

## Performance Considerations

### Caching Strategy
- **Backend**: Global kill switches cached for 1 minute
- **Frontend**: Feature flags cached for 5 minutes
- **Database**: Materialized view for computed status

### Optimization Tips
- Use `evaluateAllFeatures` middleware once per request
- Batch feature flag checks where possible
- Monitor database query performance
- Consider Redis for distributed caching

## Security & Compliance

### Audit Trail
All feature flag changes are logged:
- Who made the change
- When the change was made
- Reason for the change
- Old vs new values

### Access Control
- Only Superadmin can manage kill switches
- Tenant-specific features require tenant context
- Feature evaluation fails safe (denies access)

## Testing

### Unit Testing
```javascript
import { evaluateFeatureFlag } from '../services/featureFlag.service.js';

test('Basic tier should only have core engine access', async () => {
  const hasCore = await evaluateFeatureFlag(1, 'permission-core_engine-access');
  const hasHR = await evaluateFeatureFlag(1, 'permission-hr_payroll-access');
  
  expect(hasCore).toBe(true);
  expect(hasHR).toBe(false);
});
```

### Integration Testing
```javascript
test('Employees endpoint should be gated for Basic tier', async () => {
  const response = await request(app)
    .post('/api/employees')
    .set('Authorization', `Bearer ${basicTenantToken}`)
    .send(employeeData);
    
  expect(response.status).toBe(403);
  expect(response.body.code).toBe('MODULE_NOT_AVAILABLE');
});
```

## Migration Guide

### For Existing Features
1. Identify module to gate
2. Add feature flag mapping
3. Apply middleware to routes
4. Update frontend components
5. Test with different tiers

### For New Features
1. Define feature flag following naming convention
2. Add to module mapping
3. Apply gating during development
4. Document tier requirements

## Monitoring & Alerting

### Key Metrics
- Feature flag evaluation latency
- Kill switch activation frequency
- Failed feature access attempts
- Cache hit/miss ratios

### Alerts
- Kill switch activation
- High rate of feature access denials
- Feature flag service failures

## Future Enhancements

### Planned Features
- Time-based feature flags
- Percentage-based rollouts
- A/B testing integration
- Feature flag analytics dashboard
- External provider integration (LaunchDarkly, Unleash)

### Scalability Improvements
- Distributed caching with Redis
- Feature flag CDN
- Edge computing integration
- Real-time feature flag updates
