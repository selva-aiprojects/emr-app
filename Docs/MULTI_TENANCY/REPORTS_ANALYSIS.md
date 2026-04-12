# Reports & Analysis Documentation

## Overview
The Reports & Analysis module provides comprehensive analytics and reporting capabilities for the MedFlow EMR system, with dynamic multi-tenant data isolation.

## Architecture

### Data Flow
```
Frontend (React) 
  -> Reports API (/api/reports/*)
  -> Dynamic Schema Resolution
  -> Tenant-Specific Schema (demo_emr, nhgl, etc.)
  -> Aggregated Analytics
```

### Key Components
- **Dynamic Schema Helper**: Determines correct tenant schema
- **Report Routes**: API endpoints for reports data
- **Dashboard Metrics**: Real-time calculations
- **Frontend Components**: React visualization components

## API Endpoints

### Core Reports Endpoints

#### GET `/api/reports/summary`
Returns comprehensive report summary for the current tenant.

**Response Structure**:
```json
{
  "periodical": {
    "dailyAppointments": 24,
    "openAppointments": 12,
    "pendingInvoices": 193
  },
  "tax": {
    "totalTax": 25044.13
  },
  "monthlyComparison": {
    "revenue": [
      {"month": "Nov", "amount": 15000},
      {"month": "Dec", "amount": 22000},
      {"month": "Jan", "amount": 18660.70}
    ]
  }
}
```

#### GET `/api/reports/dashboard/metrics`
Real-time dashboard metrics with dynamic schema resolution.

**Query Examples**:
```javascript
// Dynamic schema queries
const patients = await queryWithTenantSchema(tenantId, 
  'SELECT COUNT(*)::int as count FROM {schema}.patients WHERE tenant_id = $1', 
  [tenantId]
);

const revenue = await queryWithTenantSchema(tenantId,
  'SELECT COALESCE(SUM(total), 0) as total FROM {schema}.invoices WHERE tenant_id = $1 AND status IN (\'paid\', \'partially_paid\')',
  [tenantId]
);
```

#### GET `/api/reports/payouts`
Doctor performance and revenue sharing data.

#### GET `/api/reports/financials`
Financial analytics and revenue breakdowns.

## Dashboard Metrics

### Core Metrics Calculation

#### Patient Metrics
```sql
-- Total patients
SELECT COUNT(*)::int as count 
FROM {schema}.patients 
WHERE tenant_id = $1

-- New vs returning patients
SELECT 
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::int as new_patients,
  COUNT(CASE WHEN created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::int as returning_patients
FROM {schema}.patients 
WHERE tenant_id = $1
```

#### Appointment Metrics
```sql
-- Today's appointments
SELECT 
  COUNT(CASE WHEN status = 'scheduled' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END)::int as scheduled_today,
  COUNT(CASE WHEN status = 'completed' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END)::int as completed_today,
  COUNT(CASE WHEN status = 'cancelled' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END)::int as cancelled_today,
  COUNT(CASE WHEN status = 'no-show' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END)::int as no_show_today
FROM {schema}.appointments 
WHERE tenant_id = $1
```

#### Bed Occupancy
```sql
-- Bed utilization
SELECT 
  COUNT(CASE WHEN status = 'occupied' THEN 1 END)::int as occupied,
  COUNT(CASE WHEN status = 'available' THEN 1 END)::int as available
FROM {schema}.beds 
WHERE tenant_id = $1
```

#### Financial Metrics
```sql
-- Monthly revenue trend
SELECT TO_CHAR(gs, 'Mon') as label, COALESCE(SUM(i.total), 0) as value
FROM generate_series(
  date_trunc('month', CURRENT_DATE) - INTERVAL '5 months', 
  date_trunc('month', CURRENT_DATE), 
  INTERVAL '1 month'
) gs
LEFT JOIN {schema}.invoices i ON date_trunc('month', i.created_at) = gs 
  AND i.tenant_id = $1 
  AND i.status IN ('paid', 'partially_paid')
GROUP BY gs ORDER BY gs
```

### Advanced Analytics

#### No-Show Analysis
```sql
-- No-show trends
SELECT TO_CHAR(gs, 'DD Mon') as label, 
       COUNT(a.id) FILTER (WHERE lower(a.status) = 'no-show') as "noShow",
       CASE WHEN COUNT(a.id) > 0 THEN 
         (COUNT(dist.id) FILTER (WHERE lower(dist.status) = 'no-show') * 100 / COUNT(dist.id)) 
         ELSE 0 END as rate
FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') gs
LEFT JOIN {schema}.appointments a ON DATE(a.scheduled_start) = gs AND a.tenant_id = $1
LEFT JOIN {schema}.appointments dist ON DATE(dist.scheduled_start) = gs AND dist.tenant_id = $1
GROUP BY gs ORDER BY gs
```

#### Top Diagnoses
```sql
-- Most common diagnoses
SELECT diagnosis as name, COUNT(*)::int as value 
FROM {schema}.encounters 
WHERE tenant_id = $1 AND diagnosis IS NOT NULL 
GROUP BY diagnosis 
ORDER BY value DESC LIMIT 10
```

#### Service Utilization
```sql
-- Service request categories
SELECT category as name, COUNT(*)::int as value 
FROM {schema}.service_requests 
WHERE tenant_id = $1 AND category IS NOT NULL 
GROUP BY category 
ORDER BY value DESC LIMIT 8
```

## Frontend Implementation

### ReportsPage Component
```javascript
export default function ReportsPage({ reportSummary, tenant, slmInsights, superOverview }) {
  const [payouts, setPayouts] = useState([]);
  
  // Fetch doctor payouts
  useEffect(() => {
    async function loadPayouts() {
      if (!tenant?.id) return;
      const data = await api.getDoctorPayouts(tenant.id);
      setPayouts(data);
    }
    loadPayouts();
  }, [tenant?.id]);

  // Calculate metrics based on tenant type
  const metrics = !tenant ? superTenantMetrics : tenantMetrics;

  return (
    <div className="reports-container">
      {/* Report sections */}
    </div>
  );
}
```

### Data Visualization
- **Revenue Charts**: Monthly trends with Chart.js
- **Patient Analytics**: Demographics and trends
- **Performance Metrics**: Doctor performance tables
- **Financial Reports**: Revenue breakdowns

## Multi-Tenant Data Isolation

### Schema Resolution
```javascript
// Automatic schema determination
const schemaName = await getTenantSchema(tenantId);

// Query with tenant isolation
const result = await queryWithTenantSchema(tenantId, 
  'SELECT COUNT(*) as count FROM {schema}.patients WHERE tenant_id = $1',
  [tenantId]
);
```

### Security Measures
- **Tenant Filtering**: All queries include `tenant_id` filter
- **Schema Isolation**: Each tenant has separate database schema
- **Row-Level Security**: Additional tenant_id constraints
- **API Authentication**: Token-based tenant verification

## Performance Optimization

### Query Optimization
```javascript
// Efficient aggregation queries
const metrics = await Promise.all([
  safeQuery(`SELECT COUNT(*)::int as count FROM {schema}.patients WHERE tenant_id = $1`, [tenantId]),
  safeQuery(`SELECT COUNT(*)::int as count FROM {schema}.appointments WHERE tenant_id = $1`, [tenantId]),
  safeQuery(`SELECT COALESCE(SUM(total), 0) as total FROM {schema}.invoices WHERE tenant_id = $1 AND status IN ('paid', 'partially_paid')`, [tenantId])
]);
```

### Caching Strategy
- **Session Caching**: Tenant schema resolution cached per session
- **Data Caching**: Frequently accessed metrics cached
- **Query Optimization**: Indexed queries for performance

## Required Tables for Reports

### Essential Tables
- `patients` - Patient demographics and counts
- `appointments` - Appointment scheduling and status
- `invoices` - Financial data and revenue
- `beds` - Hospital capacity and occupancy
- `employees` - Staff metrics and performance
- `lab_tests` - Laboratory services utilization
- `blood_units` - Blood bank inventory
- `encounters` - Clinical encounters and diagnoses

### Supporting Tables
- `departments` - Departmental breakdowns
- `wards` - Ward management
- `services` - Service utilization
- `diagnostic_reports` - Lab results
- `conditions` - Medical conditions tracking
- `drug_allergies` - Patient allergies

## Troubleshooting

### Common Issues

#### Blank Reports Page
**Causes**:
- Missing tenant data
- Schema resolution failure
- API authentication issues

**Solutions**:
```javascript
// Check tenant data
const hasData = await checkTenantData(tenantId);

// Verify schema resolution
const schema = await getTenantSchema(tenantId);

// Test API authentication
const token = await authenticateUser(credentials);
```

#### Missing Dashboard Cards
**Causes**:
- Missing tables in tenant schema
- No data in required tables
- Query execution errors

**Solutions**:
```javascript
// Check table existence
const tables = await getTenantTables(tenantId);

// Verify data presence
const counts = await getTableCounts(tenantId);

// Test query execution
const test = await testQueries(tenantId);
```

#### Performance Issues
**Causes**:
- Large dataset queries
- Missing indexes
- Inefficient aggregations

**Solutions**:
```sql
-- Add performance indexes
CREATE INDEX idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX idx_invoices_status_date ON invoices(status, created_at);
CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
```

### Diagnostic Commands

#### Check Reports Data
```javascript
// Test all required tables
const requiredTables = ['patients', 'appointments', 'invoices', 'beds', 'lab_tests'];
const checks = await Promise.all(
  requiredTables.map(table => 
    queryWithTenantSchema(tenantId, `SELECT COUNT(*) as count FROM {schema}.${table} WHERE tenant_id = $1`, [tenantId])
  )
);

// Verify API responses
const apiTest = await fetch('/api/reports/summary', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### Monitor Performance
```javascript
// Query execution time
const start = Date.now();
const result = await queryWithTenantSchema(tenantId, query, params);
const duration = Date.now() - start;
console.log(`Query executed in ${duration}ms`);
```

## Data Verification

### Automated Testing
```javascript
// Verify tenant data completeness
async function verifyTenantData(tenantId) {
  const required = [
    { table: 'patients', minCount: 1 },
    { table: 'appointments', minCount: 1 },
    { table: 'invoices', minCount: 1 },
    { table: 'lab_tests', minCount: 5 }
  ];
  
  for (const req of required) {
    const count = await queryWithTenantSchema(tenantId,
      `SELECT COUNT(*) as count FROM {schema}.${req.table} WHERE tenant_id = $1`,
      [tenantId]
    );
    
    if (count.rows[0].count < req.minCount) {
      console.warn(`Insufficient data in ${req.table}: ${count.rows[0].count} < ${req.minCount}`);
    }
  }
}
```

### Data Quality Checks
```javascript
// Check data consistency
async function checkDataConsistency(tenantId) {
  const inconsistencies = [];
  
  // Check orphaned records
  const orphanedAppointments = await queryWithTenantSchema(tenantId,
    `SELECT COUNT(*) as count FROM {schema}.appointments a 
     LEFT JOIN {schema}.patients p ON a.patient_id = p.id 
     WHERE p.id IS NULL`
  );
  
  if (orphanedAppointments.rows[0].count > 0) {
    inconsistencies.push('Orphaned appointments found');
  }
  
  return inconsistencies;
}
```

## Best Practices

### Query Optimization
- Use appropriate indexes
- Limit result sets for large datasets
- Use efficient aggregation functions
- Cache frequently accessed data

### Error Handling
- Graceful fallbacks for missing data
- Clear error messages for debugging
- Retry mechanisms for transient failures
- Comprehensive logging

### Security
- Always include tenant_id in queries
- Validate user permissions
- Sanitize user inputs
- Audit data access

## Future Enhancements

### Advanced Analytics
- Predictive analytics for patient flow
- Resource utilization forecasting
- Revenue trend analysis
- Performance benchmarking

### Real-time Updates
- WebSocket-based live metrics
- Real-time dashboard updates
- Push notifications for alerts
- Live occupancy tracking

### Custom Reports
- User-defined report templates
- Scheduled report generation
- Export functionality (PDF, Excel)
- Custom KPI tracking
