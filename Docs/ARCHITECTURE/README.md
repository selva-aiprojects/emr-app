# System Architecture Documentation

## Overview
This section contains comprehensive documentation about the MedFlow EMR system architecture, including multi-tenant design, API structure, and technical implementation details.

## Architecture Documents

### **[Multi-Tenancy Architecture](../MULTI_TENANCY/)**
- Dynamic schema resolution system
- Tenant isolation strategies
- Schema naming conventions
- Data security and isolation

### **[API Documentation](../API/)**
- REST API endpoints and methods
- Authentication and authorization
- Request/response formats
- Error handling and status codes

### **[Database Architecture](../database/)**
- Schema design and relationships
- Multi-tenant data isolation
- Performance optimization
- Migration and versioning

### **[Frontend Architecture](../client/)**
- React component structure
- State management patterns
- API integration
- UI/UX design system

## Key Architectural Components

### Multi-Tenant System
```
Frontend (React) 
  -> API Gateway (Express)
  -> Dynamic Schema Resolution
  -> Tenant-Specific Schema (demo_emr, nhgl, etc.)
  -> PostgreSQL Database
```

### Schema Organization
```
emr (Global Schema)
  - tenants (tenant management)
  - users (authentication)
  - roles (permissions)

{tenant_code}_emr or nhgl (Tenant Schemas)
  - Clinical data (patients, appointments, encounters)
  - Financial data (invoices, payments, billing)
  - Hospital management (beds, wards, departments)
  - Laboratory (tests, reports, results)
  - Blood bank (donors, units, requests)
  - Pharmacy (inventory, prescriptions)
  - HR (employees, attendance, payroll)
```

### Dynamic Schema Resolution
```javascript
// Automatic schema determination based on tenant login
const schemaName = tenantCode === 'nhgl' ? 'nhgl' : `${tenantCode}_emr`;

// Query with dynamic schema resolution
const result = await queryWithTenantSchema(tenantId, 
  'SELECT * FROM {schema}.patients WHERE tenant_id = $1', 
  [tenantId]
);
```

## Security Architecture

### Authentication Flow
1. User login with tenant credentials
2. Token-based authentication
3. Role-based access control
4. Tenant-specific data isolation

### Data Isolation
- Schema-level isolation per tenant
- Row-level security with tenant_id filtering
- No cross-tenant data access possible
- Encrypted sensitive data

### Access Control
```javascript
// Role-based permissions
const permissions = {
  admin: ['read', 'write', 'delete', 'manage_users'],
  doctor: ['read', 'write', 'manage_patients'],
  nurse: ['read', 'write', 'update_records'],
  pharmacist: ['read', 'write', 'manage_inventory']
};
```

## Performance Architecture

### Database Optimization
- Connection pooling (20-50 connections)
- Query optimization with appropriate indexes
- Schema-level caching
- Read replicas for reporting queries

### Caching Strategy
- Session-level schema resolution caching
- API response caching for static data
- Database query result caching
- Frontend component state caching

### Load Balancing
```
Load Balancer
  -> API Server 1 (Express)
  -> API Server 2 (Express)
  -> API Server N (Express)
    -> Database Connection Pool
    -> PostgreSQL Database
```

## API Architecture

### RESTful Design
```
GET    /api/tenants              - List tenants
POST   /api/tenants              - Create tenant
GET    /api/tenants/:id          - Get tenant details
PUT    /api/tenants/:id          - Update tenant
DELETE /api/tenants/:id          - Delete tenant

GET    /api/reports/summary      - Reports summary
GET    /api/reports/dashboard     - Dashboard metrics
GET    /api/reports/payouts       - Doctor payouts
GET    /api/reports/financials    - Financial analytics
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-04-12T10:00:00Z"
}
```

### Error Handling
```javascript
// Standardized error responses
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": { ... }
  },
  "timestamp": "2025-04-12T10:00:00Z"
}
```

## Frontend Architecture

### Component Structure
```
src/
  components/           # Reusable UI components
  pages/               # Page-level components
  hooks/               # Custom React hooks
  services/            # API service functions
  utils/               # Utility functions
  styles/              # CSS/styling
  assets/              # Static assets
```

### State Management
```javascript
// Global state with React Context
const AppContext = createContext({
  user: null,
  tenant: null,
  reportSummary: null,
  slmInsights: null,
  // ... other state
});

// Custom hooks for API calls
const useReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  // ... API logic
};
```

### Data Flow
```
User Action -> Component Event -> API Service -> Backend API -> Database -> Response -> State Update -> UI Update
```

## Integration Architecture

### External Services
- **Email Service**: Notifications and alerts
- **Payment Gateway**: Billing and payments
- **Lab Integration**: External lab systems
- **Pharmacy API**: Medication management

### Third-Party APIs
```javascript
// Email service integration
const emailService = {
  sendAppointmentReminder: (patientId, appointmentId) => { ... },
  sendBillingNotification: (invoiceId) => { ... },
  sendSystemAlert: (message, severity) => { ... }
};

// Lab system integration
const labService = {
  submitTestRequest: (testData) => { ... },
  getTestResults: (testId) => { ... },
  updateTestStatus: (testId, status) => { ... }
};
```

## Deployment Architecture

### Development Environment
```
Local Development
  -> React Dev Server (Vite)
  -> Express API Server
  -> PostgreSQL Database
```

### Production Environment
```
Load Balancer (Nginx)
  -> Frontend (Static Files on CDN)
  -> API Servers (Node.js Cluster)
  -> PostgreSQL Database (Primary + Replicas)
  -> Redis Cache
```

### Container Architecture
```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS builder
FROM node:18-alpine AS runtime

# Environment variables
ENV NODE_ENV=production
ENV PORT=4005
```

## Monitoring Architecture

### Application Monitoring
- **Health Checks**: Service availability
- **Performance Metrics**: Response times, throughput
- **Error Tracking**: Exception logging and alerting
- **User Analytics**: Usage patterns and trends

### Database Monitoring
- **Connection Pool**: Active/idle connections
- **Query Performance**: Slow query identification
- **Schema Sizes**: Storage utilization per tenant
- **Backup Status**: Backup completion verification

### Infrastructure Monitoring
- **Server Metrics**: CPU, memory, disk usage
- **Network Performance**: Latency and bandwidth
- **Database Performance**: Query times and connection health
- **Application Logs**: Error rates and patterns

## Scalability Architecture

### Horizontal Scaling
- **API Servers**: Multiple instances behind load balancer
- **Database**: Read replicas for reporting queries
- **Frontend**: CDN for static assets
- **Cache**: Redis for session and data caching

### Vertical Scaling
- **Server Resources**: CPU, memory, storage upgrades
- **Database**: Connection pool optimization
- **Application**: Memory and processing improvements

### Auto-Scaling
```javascript
// Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: emr-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: emr-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Disaster Recovery

### Backup Strategy
- **Database**: Daily full backups + hourly incremental
- **Application**: Version control + deployment snapshots
- **Infrastructure**: Configuration and infrastructure as code

### Recovery Procedures
```bash
# Database recovery
pg_restore --clean --no-acl --no-owner -d medflow_emr backup.sql

# Application recovery
git checkout <commit-hash>
npm install
npm run build
npm start
```

### High Availability
- **Database**: Primary-replica setup with automatic failover
- **Application**: Multi-instance deployment with load balancing
- **Infrastructure**: Multi-zone deployment
- **Monitoring**: Automated failover detection and alerting

## Development Workflow

### Code Organization
```
src/
  server/           # Backend API
  client/           # Frontend React app
  database/         # Database schemas
  scripts/          # Utility scripts
  docs/             # Documentation
  tests/            # Test suites
```

### Development Process
1. **Feature Development**: Branch-based development
2. **Code Review**: Pull request reviews
3. **Testing**: Unit tests, integration tests, E2E tests
4. **Deployment**: Staging testing, then production
5. **Monitoring**: Post-deployment monitoring

### Quality Assurance
```javascript
// Automated testing
describe('Tenant Provisioning', () => {
  test('should create new tenant with schema', async () => {
    const result = await provisionNewTenant(tenantData);
    expect(result.success).toBe(true);
    expect(result.schemaName).toBeDefined();
  });
});

// Integration testing
describe('API Integration', () => {
  test('should authenticate tenant user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ tenantId, email, password });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

## Technology Stack

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Custom query builder
- **Authentication**: JWT tokens
- **Validation**: Input sanitization and validation

### Frontend Technologies
- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: React Context + Hooks
- **Styling**: CSS Modules + Tailwind CSS
- **Charts**: Chart.js
- **HTTP Client**: Fetch API

### Infrastructure Technologies
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Load Balancer**: Nginx
- **Cache**: Redis
- **Monitoring**: Custom monitoring + logging
- **CI/CD**: GitHub Actions

## Security Architecture

### Authentication & Authorization
```javascript
// JWT Token Structure
{
  "userId": "uuid",
  "tenantId": "uuid", 
  "role": "admin",
  "email": "user@example.com",
  "exp": 1234567890,
  "iat": 1234567890
}

// Permission Checking
const hasPermission = (user, resource, action) => {
  const permissions = rolePermissions[user.role];
  return permissions.includes(`${resource}:${action}`);
};
```

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Hashing**: Passwords hashed with bcrypt
- **Transport**: HTTPS/TLS for all communications
- **Audit Logging**: All data access logged

### Compliance
- **HIPAA**: Healthcare data protection
- **GDPR**: Data privacy and protection
- **SOC 2**: Security controls and processes
- **PCI DSS**: Payment card security

## Future Architecture Plans

### Microservices Migration
- **Service Decomposition**: Split into microservices
- **API Gateway**: Centralized API management
- **Service Mesh**: Inter-service communication
- **Event-Driven Architecture**: Async messaging

### Advanced Features
- **Real-time Updates**: WebSocket integration
- **AI/ML Integration**: Predictive analytics
- **Mobile Apps**: React Native applications
- **IoT Integration**: Medical device connectivity

### Performance Enhancements
- **GraphQL**: Flexible API queries
- **Edge Computing**: Content delivery optimization
- **Advanced Caching**: Multi-layer caching strategy
- **Database Sharding**: Horizontal partitioning
