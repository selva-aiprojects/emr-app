# Developer Guides

## Overview
This section contains comprehensive documentation for developers working on the MedFlow EMR system, including setup guides, coding standards, API documentation, and testing procedures.

## Key Documents

### **[Development Setup](../DEVELOPMENT/SETUP.md)**
- Complete development environment setup
- Local configuration and dependencies
- Development server startup procedures
- IDE and tooling recommendations

### **[API Reference](../DEVELOPMENT/API_REFERENCE.md)**
- Complete REST API documentation
- Endpoint specifications and examples
- Authentication and authorization
- Error handling and status codes

### **[Testing Guide](../DEVELOPMENT/TESTING.md)**
- Testing procedures and tools
- Unit testing, integration testing, E2E testing
- Test automation and CI/CD integration
- Code coverage and quality metrics

### **[Code Standards](../DEVELOPMENT/CODE_STANDARDS.md)**
- JavaScript/ES6+ coding standards
- React component patterns
- Database query patterns
- Security best practices

## Quick Links

### **Development Environment**
```bash
# Clone repository
git clone <repository-url>
cd EMR-Application

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with database credentials

# Start development servers
npm run dev
```

### **Testing**
```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Security tests
npm run test:security
```

### **Code Quality**
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Security audit
npm audit fix
```

## Development Environment Setup

### Prerequisites
- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher
- **PostgreSQL**: 14.0 or higher
- **Git**: Version control system
- **VS Code**: Recommended IDE

### Local Development
```bash
# 1. Clone Repository
git clone <repository-url>
cd EMR-Application

# 2. Install Dependencies
npm install

# 3. Environment Configuration
cp .env.example .env
# Edit .env with your local database credentials

# 4. Database Setup
npm run db:setup

# 5. Seed Initial Data
npm run db:seed

# 6. Start Development Servers
npm run dev
```

### IDE Configuration
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "extensions": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint"
  ],
  "eslint.workingDirectories": ["client", "server"]
}
```

## Coding Standards

### JavaScript/ES6+ Standards
```javascript
// Use const and let instead of var
const apiEndpoint = '/api/reports/dashboard/metrics';
let isLoading = false;

// Use arrow functions for callbacks
const fetchData = async () => {
  try {
    const response = await api.get(apiEndpoint);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

// Use template literals for SQL queries
const query = `
  SELECT COUNT(*)::int as count 
  FROM ${schemaName}.patients 
  WHERE tenant_id = $1
`;

// Use destructuring for objects and arrays
const { id, name, email } = user;
const [first, second] = items;
```

### React Component Patterns
```javascript
// Functional Components with Hooks
import React, { useState, useEffect } from 'react';

export default function ReportsPage({ reportSummary, tenant }) {
  const [payouts, setPayouts] = useState([]);
  
  useEffect(() => {
    async function loadPayouts() {
      if (!tenant?.id) return;
      const data = await api.getDoctorPayouts(tenant.id);
      setPayouts(data);
    }
    loadPayouts();
  }, [tenant?.id]);

  return (
    <div className="reports-container">
      {/* Component JSX */}
    </div>
  );
}
```

### Database Query Patterns
```javascript
// Use parameterized queries
async function getPatients(tenantId, filters = {}) {
  const { search, limit = 50, offset = 0 } = filters;
  
  let query = `
    SELECT id, first_name, last_name, email, phone
    FROM ${schemaName}.patients 
    WHERE tenant_id = $1
  `;
  
  const params = [tenantId];
  
  if (search) {
    query += ` AND (first_name ILIKE $2 OR last_name ILIKE $2 OR email ILIKE $2)`;
    params.push(`%${search}%`);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $3 OFFSET $4`;
  params.push(limit, offset);
  
  return await query(query, params);
}

// Use transactions for multiple operations
async function createAppointment(appointmentData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      'INSERT INTO appointments (tenant_id, patient_id, scheduled_start, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [appointmentData.tenantId, appointmentData.patientId, appointmentData.scheduledStart, appointmentData.status]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Security Best Practices
```javascript
// Input Validation
import Joi from 'joi';

const appointmentSchema = Joi.object({
  tenantId: Joi.string().uuid().required(),
  patientId: Joi.string().uuid().required(),
  scheduledStart: Joi.date().iso().required(),
  status: Joi.string().valid(['scheduled', 'completed', 'cancelled', 'no-show']).required()
});

// Validate input
const { error, value } = appointmentSchema.validate(appointmentData);
if (error) {
  throw new Error(`Validation failed: ${error.details[0].message}`);
}

// SQL Injection Prevention
// Always use parameterized queries
const safeQuery = 'SELECT * FROM patients WHERE tenant_id = $1 AND email = $2';
const params = [tenantId, email];

// Never do this!
const unsafeQuery = `SELECT * FROM patients WHERE tenant_id = '${tenantId}' AND email = '${email}'`;
```

## API Development

### RESTful API Design
```javascript
// GET /api/reports/summary
router.get('/api/reports/summary', authenticate, requireTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const reportData = await generateReportSummary(tenantId);
    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Reports summary error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate reports summary' 
    });
  }
});

// POST /api/appointments
router.post('/api/appointments', authenticate, requireTenant, async (req, res) => {
  try {
    const { error, value } = appointmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.details[0].message 
      });
    }
    
    const appointment = await createAppointment(value);
    res.status(201).json({ 
      success: true, 
      data: appointment 
    });
  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create appointment' 
    });
  }
});
```

### Error Handling
```javascript
// Standardized Error Response
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Error Handler Middleware
const errorHandler = (error, req, res, next) => {
  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};
```

### Response Format
```javascript
// Success Response
{
  "success": true,
  "data": {
    "id": "12345678-1234-1234-1234-123456789012",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-04-12T10:00:00Z"
}

// Error Response
{
  "success": false,
  "error": "Validation failed: Email is required",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Email is required",
      "value": null
    }
  ],
  "timestamp": "2025-04-12T10:00:00Z"
}
```

## Testing

### Unit Testing
```javascript
// Example Unit Test
import { generateReportSummary } from '../server/reports/service';

describe('generateReportSummary', () => {
  test('should generate report summary for tenant', async () => {
    const tenantId = 'test-tenant-id';
    const result = await generateReportSummary(tenantId);
    
    expect(result).toHaveProperty('periodical');
    expect(result).toHaveProperty('tax');
    expect(result).toHaveProperty('monthlyComparison');
    expect(result.periodical.dailyAppointments).toBeGreaterThan(0);
  });

  test('should handle database errors gracefully', async () => {
    const tenantId = 'invalid-tenant-id';
    
    await expect(generateReportSummary(tenantId))
      .rejects.toThrow('Tenant not found');
  });
});
```

### Integration Testing
```javascript
// Example Integration Test
import request from 'supertest';
import app from '../server/app';

describe('Reports API', () => {
  test('GET /api/reports/summary should return report data', async () => {
      const response = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

  test('GET /api/reports/summary should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/summary')
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
});
```

### E2E Testing
```javascript
// Example E2E Test
import { test, expect } from '@playwright/test';

test('Reports page should load and display data', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'admin@demo.hospital');
  await page.fill('[data-testid="password-input"]', 'Demo@123');
  await page.click('[data-testid="login-button"]');
  
  // Navigate to Reports
  await page.click('[data-testid="reports-link"]');
  
  // Verify page loaded
  await expect(page.locator('[data-testid="reports-container"]')).toBeVisible();
  
  // Verify data displayed
  await expect(page.locator('[data-testid="total-patients"]')).toContainText('Patients:');
  await expect(page.locator('[data-testid="total-revenue"]')).toContainText('Revenue:');
});
```

## Performance Optimization

### Database Optimization
```javascript
// Use EXPLAIN ANALYZE for slow queries
const slowQuery = `
  EXPLAIN ANALYZE
  SELECT COUNT(*) FROM ${schemaName}.patients 
  WHERE tenant_id = $1
  AND created_at >= $2
`;

// Add appropriate indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_tenant_id_created_at 
ON patients(tenant_id, created_at);
```

### Frontend Optimization
```javascript
// Use React.memo for expensive calculations
const ExpensiveComponent = React.memo(({ data, filters }) => {
  const processedData = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [data, filters.search]);
  
  return <Component data={processedData} />;
});

// Use useCallback for expensive functions
const expensiveCalculation = useCallback((data) => {
  return data.reduce((acc, item) => acc + item.value, 0);
}, []);

// Use React.lazy for code splitting
const LazyReportsPage = React.lazy(() => import('./ReportsPage'));
```

### Caching Strategy
```javascript
// API Response Caching
const reportCache = new Map();

const getReportSummary = async (tenantId) => {
  const cacheKey = `reports:summary:${tenantId}`;
  
  if (reportCache.has(cacheKey)) {
    return reportCache.get(cacheKey);
  }
  
  const data = await generateReportSummary(tenantId);
  reportCache.set(cacheKey, data);
  
  // Cache for 5 minutes
  setTimeout(() => reportCache.delete(cacheKey), 300000);
  
  return data;
};
```

## Debugging

### Logging
```javascript
// Structured Logging
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    }
  }
};
```

### Database Debugging
```javascript
// Query Debugging
async function debugQuery(tenantId, query, params) {
  console.log(`[DEBUG] Query: ${query}`);
  console.log(`[DEBUG] Params: ${JSON.stringify(params)}`);
  
  try {
    const result = await queryWithTenantSchema(tenantId, query, params);
    console.log(`[DEBUG] Result: ${result.rows.length} rows`);
    return result;
  } catch (error) {
    console.error(`[DEBUG] Error: ${error.message}`);
    throw error;
  }
}
```

## Contributing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... edit files ...

# Stage changes
git add .
git commit -m "Add new feature"

# Push branch
git push origin feature/new-feature

# Create pull request
# ... on GitHub ...
```

### Code Review Process
1. **Self-Review**: Review your own code first
2. **Peer Review**: Request review from team members
3. **Testing**: Ensure all tests pass
4. **Documentation**: Update relevant documentation
5. **Approval**: Get approval before merge

### Pull Request Template
```markdown
## Description
Brief description of the changes made.

## Type
- [ ] Bug fix
- [ ] New feature
- [ ] Improvement
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project standards
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No breaking changes
- [ ] Performance impact considered
```

## Resources

### Documentation
- **[API Reference](../DEVELOPMENT/API_REFERENCE.md)** - Complete API documentation
- **[Database Schema](../database/README.md)** - Database design documentation
- **[Multi-Tenancy](../MULTI_TENANCY/DYNAMIC_SCHEMA_SYSTEM.md)** - Dynamic schema system
- **[Architecture](../ARCHITECTURE/README.md)** - System architecture overview

### Tools and Libraries
- **Development**: Node.js, npm, VS Code, Git
- **Testing**: Jest, Playwright, Supertest
- **Database**: PostgreSQL, pg-pool
- **Frontend**: React, Vite, Tailwind CSS
- **Security**: JWT, bcrypt, helmet

### Learning Resources
- **React Documentation**: https://react.dev/
- **Node.js Documentation**: https://nodejs.org/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Jest Testing**: https://jestjs.io/docs/
- **Playwright**: https://playwright.dev/

---

*Last Updated: April 12, 2025*
*Version: 2.0*
