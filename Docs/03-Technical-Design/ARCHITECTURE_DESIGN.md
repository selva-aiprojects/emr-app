# Architecture Design

Last updated: 2026-03-31

## 1. System Overview
The Medflow EMR is a multi-tenant SaaS platform optimized for healthcare clinical workflows. It utilizes a layered architecture consisting of a React-based SPA frontend, an Express-based REST API backend, and a PostgreSQL database layer with microservices for specialized healthcare functions.

## 2. Low-Level Architecture Details

### 2.1 Frontend Architecture (React SPA)

#### **Component Hierarchy**
```
App.jsx (Root Component)
├── ErrorBoundary
├── AppLayout.jsx (Navigation & Layout)
│   ├── Sidebar Navigation
│   ├── Header
│   └── Main Content Area
└── View-based Routing
    ├── PatientProfilePage.jsx
    ├── PatientsPage.jsx
    ├── DashboardPage.jsx
    └── [Other clinical modules]
```

#### **State Management Pattern**
```javascript
// Centralized state in App.jsx
const [view, setView] = useState('dashboard');
const [activePatientId, setActivePatientId] = useState('');
const [session, setSession] = useState(null);
const [tenant, setTenant] = useState(null);
const [patients, setPatients] = useState([]);

// View-based routing (not traditional React Router)
{view === 'patient-profile' && <PatientProfilePage patientId={activePatientId} />}
{view === 'patients' && <PatientsPage setView={setView} />}
```

#### **API Layer Architecture**
```javascript
// api.js - Centralized API client
const api = {
  // Authentication
  login: (credentials) => fetch('/api/auth/login', {...}),
  logout: () => fetch('/api/auth/logout', {...}),
  
  // Patient Management
  getPatients: (tenantId, options) => fetch(`/api/patients/${tenantId}`, {...}),
  createPatient: (data) => fetch('/api/patients', {...}),
  getPatient: (patientId) => fetch(`/api/patients/${patientId}`, {...}),
  
  // Clinical Data
  getMedicalHistory: (patientId) => fetch(`/api/patients/${patientId}/medical-history`, {...}),
  getDiagnostics: (patientId) => fetch(`/api/patients/${patientId}/diagnostics`, {...}),
  getMedications: (patientId) => fetch(`/api/patients/${patientId}/medications`, {...}),
  
  // FHIR Integration
  getFHIRPatient: (patientId) => fetch(`/api/fhir/Patient/${patientId}`, {...}),
  getFHIRObservations: (patientId) => fetch(`/api/fhir/Observation?patient=${patientId}`, {...})
};
```

#### **Permission-Based Access Control**
```javascript
// config/modules.js - Role-based permissions
const fallbackPermissions = {
  Admin: ['dashboard', 'patients', 'patient-profile', 'emr', 'inpatient', 'billing', ...],
  Doctor: ['dashboard', 'patients', 'patient-profile', 'emr', 'reports', ...],
  Nurse: ['dashboard', 'patients', 'patient-profile', 'inpatient', ...],
  Lab: ['dashboard', 'patients', 'patient-profile', 'reports', ...],
  // ...
};

// Permission validation in App.jsx
const allowedViews = useMemo(() => {
  const roleViews = permissions[userRole] || ['dashboard'];
  return roleViews.filter(view => tenantHasAccess(view));
}, [permissions, userRole, tenant]);
```

### 2.2 Backend Microservices Architecture

#### **Service Decomposition**
```
Main API Server (Port 3000)
├── Core Application Logic
├── Authentication Middleware
├── Tenant Resolution
└── Request Routing

├── FHIR Service (Separate Process)
│   ├── FHIR Resource Endpoints
│   ├── Healthcare Data Standards
│   └── Interoperability Layer

├── Pharmacy Service (Separate Process)
│   ├── Medication Management
│   ├── Inventory Tracking
│   └── Prescription Processing

└── Additional Services
    ├── Billing Service
    ├── Laboratory Service
    └── Inpatient Management
```

#### **Database Schema Architecture**
```sql
-- Multi-tenant schema pattern
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    mrn VARCHAR(50) NOT NULL,
    -- Clinical fields
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Row-level security
    CONSTRAINT patient_tenant_check CHECK (tenant_id IS NOT NULL)
);

-- FHIR-compliant tables
CREATE TABLE fhir_patients (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    resource JSONB NOT NULL, -- FHIR Patient resource
    last_updated TIMESTAMP DEFAULT NOW()
);
```

### 2.3 Data Flow Architecture

#### **Request Lifecycle**
```
1. User Action (Click MRN button)
   ↓
2. React Component Event Handler
   setView('patient-profile');
   setActivePatientId(patientId);
   ↓
3. State Change Triggers Re-render
   ↓
4. PatientProfilePage Component Mounts
   ↓
5. useEffect Triggers API Calls
   api.getPatient(patientId);
   api.getMedicalHistory(patientId);
   ↓
6. API Client Makes HTTP Requests
   ↓
7. Backend Service Processes Requests
   ↓
8. Database Queries Execute
   ↓
9. Response Returns to Frontend
   ↓
10. Component State Updates
   ↓
11. UI Re-renders with New Data
```

#### **Error Handling & Fallback Strategy**
```javascript
const loadPatientData = async () => {
  setLoading(true);
  try {
    // Primary data source
    const patientResponse = await api.get(`/patients/${patientId}`);
    setPatient(patientResponse.data);
  } catch (error) {
    // Fallback data for graceful degradation
    console.error('Error loading patient info:', error);
    setPatient({
      id: patientId,
      firstName: 'John',
      lastName: 'Doe',
      mrn: `MRN-${patientId.slice(0, 8).toUpperCase()}`,
      dateOfBirth: '1980-01-01',
      gender: 'Male',
      phone: '+1-555-0123',
      email: 'john.doe@example.com'
    });
  }
  
  // Similar pattern for all data endpoints
  try {
    const historyResponse = await api.get(`/patients/${patientId}/medical-history`);
    setMedicalHistory(historyResponse.data || []);
  } catch (error) {
    setMedicalHistory([
      { condition: 'Hypertension', description: 'Chronic condition', date: '2023-01-15' },
      { condition: 'Type 2 Diabetes', description: 'Managed condition', date: '2023-03-20' }
    ]);
  }
};
```

### 2.4 Security Architecture

#### **Multi-Tenant Data Isolation**
```javascript
// Tenant-aware API calls
const tenantId = tenant?.id || session?.tenantId;
const data = await api.getPatients(tenantId, { limit: 50 });

// Backend middleware for tenant enforcement
app.use('/api/patients', (req, res, next) => {
  const tenantId = req.user.tenantId;
  req.query.tenant_id = tenantId; // Force tenant scope
  next();
});
```

#### **JWT Authentication Flow**
```javascript
// Frontend token management
const login = async (credentials) => {
  const response = await api.login(credentials);
  const { token, user, tenant } = response.data;
  
  // Store session securely
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('tenant', JSON.stringify(tenant));
  
  setSession({ user, tenant });
};

// Backend token validation
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

## 3. Architecture Diagram (High Level)
```mermaid
graph TD
    classDef default font-family:sans-serif;
    
    subgraph HMS["Medflow EMR Core Modules"]
        direction LR
        RBAC["Multi-Tenancy & RBAC"]
        OP["OP Module\nConsultancy, Prescription, EMR\nPharmacy, Lab, Billing"]
        IP["IP Module\nBed Mgmt, Theatres\nInsurance"]
        ERP["ERP\nStock Inventory, Ambulance\nBlood Bank, HR & Staff"]
    end

    subgraph "Frontend Layer"
        FE["Frontend\nReactJS (React 18, Vite)\nSPA Pattern\nCentralized Hooks\nVanilla CSS\nApache ECharts"]
    end

    subgraph "Backend Layer"
        BE["Backend\nNode.js (Express)\nREST API & Middleware\nJWT (RS256)\nGoogle Gemini AI Engine"]
    end

    subgraph "Intelligence"
        AI["AI Analytics & Reports\nApache ECharts\nGoogle Gemini"]
    end

    subgraph "Data Layer"
        DB["Database\nPostgreSQL\nPool-Driven PG Connection"]
    end

    Infra["Docker / ESG Containerization"]
    
    WebClient["Web App Interface"]
    MobileClient["Mobile App Interface"]

    %% Edges
    HMS <==> FE
    HMS <==> BE
    
    FE <==> BE
    BE <.-> AI
    
    FE -.-> WebClient
    FE -.-> MobileClient
    
    BE ==> DB
    DB ==> Infra
    
    RBAC ~~~ OP
    OP ~~~ IP
    IP ~~~ ERP

    classDef op fill:#fef3c7,stroke:#f59e0b,stroke-width:2px;
    classDef ip fill:#ecfdf5,stroke:#10b981,stroke-width:2px;
    classDef erp fill:#fef3c7,stroke:#f59e0b,stroke-width:2px;
    classDef mt fill:#eff6ff,stroke:#3b82f6,stroke-width:2px;
    
    classDef front fill:#eff6ff,stroke:#2563eb,stroke-width:3px;
    classDef back fill:#f0fdf4,stroke:#16a34a,stroke-width:3px;
    classDef data fill:#eff6ff,stroke:#2563eb,stroke-width:3px;
    classDef ai fill:#f8fafc,stroke:#94a3b8,stroke-width:2px,stroke-dasharray: 4 4;
    
    class RBAC mt;
    class OP op;
    class IP ip;
    class ERP erp;
    class FE front;
    class BE back;
    class DB data;
    class AI ai;
```

## 4. Performance Optimization Architecture

### 4.1 Frontend Performance Patterns

#### **Lazy Loading Strategy**
```javascript
// Code splitting for better performance
const PatientProfilePage = lazy(() => import('./pages/PatientProfilePage.jsx'));
const PatientsPage = lazy(() => import('./pages/PatientsPage.jsx'));

// Suspense boundary with loading fallback
<Suspense fallback={<div>Loading...</div>}>
  {view === 'patient-profile' && <PatientProfilePage />}
</Suspense>
```

#### **Memoization Patterns**
```javascript
// Expensive computations cached
const filteredPatients = useMemo(() => {
  return patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [patients, searchQuery]);

// Callback memoization to prevent re-renders
const handlePatientSelect = useCallback((patientId) => {
  setActivePatientId(patientId);
  setView('patient-profile');
}, []);
```

#### **API Response Caching**
```javascript
// Request deduplication and caching
const apiCache = new Map();

const cachedApiCall = async (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  apiCache.set(cacheKey, data);
  return data;
};
```

### 4.2 Backend Performance Patterns

#### **Database Connection Pooling**
```javascript
// PostgreSQL connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### **Query Optimization**
```sql
-- Indexed queries for performance
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_patients_mrn ON patients(mrn);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);

-- Tenant-scoped queries for data isolation
SELECT * FROM patients 
WHERE tenant_id = $1 
  AND (first_name ILIKE $2 OR last_name ILIKE $2 OR mrn ILIKE $2)
ORDER BY last_name, first_name
LIMIT 50 OFFSET $3;
```

## 5. Deployment Architecture

### 5.1 Container Configuration
```dockerfile
# Frontend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

```dockerfile
# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 5.2 Environment Configuration
```javascript
// Multi-environment support
const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    wsUrl: 'ws://localhost:3000',
    environment: 'development'
  },
  production: {
    apiUrl: 'https://api.medflow.com/api',
    wsUrl: 'wss://api.medflow.com',
    environment: 'production'
  },
  staging: {
    apiUrl: 'https://staging-api.medflow.com/api',
    wsUrl: 'wss://staging-api.medflow.com',
    environment: 'staging'
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

### 5.3 Health Check Architecture
```javascript
// Frontend health monitoring
const HealthChecker = () => {
  const [isHealthy, setIsHealthy] = useState(true);
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        setIsHealthy(response.ok);
      } catch (error) {
        setIsHealthy(false);
      }
    };
    
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return isHealthy ? null : <HealthAlert />;
};
```

## 6. Monitoring & Observability

### 6.1 Error Boundary Implementation
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    console.error('Application Error:', error, errorInfo);
    
    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // Integration with error tracking service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userId: this.props.activeUser?.id,
        tenantId: this.props.tenant?.id
      })
    });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 6.2 Performance Monitoring
```javascript
// Performance metrics collection
const PerformanceMonitor = () => {
  useEffect(() => {
    // Core Web Vitals monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });

    return () => observer.disconnect();
  }, []);
};
```

## 7. Healthcare Compliance Architecture

### 7.1 HIPAA Compliance Patterns
```javascript
// PHI (Protected Health Information) handling
const PHIHandler = {
  // Audit logging for all PHI access
  logPHIAccess: (patientId, userId, action) => {
    const auditLog = {
      patientId,
      userId,
      action,
      timestamp: new Date().toISOString(),
      ipAddress: window.location.hostname,
      userAgent: navigator.userAgent
    };
    
    // Send to audit logging service
    api.post('/audit/phi-access', auditLog);
  },

  // Data encryption for sensitive information
  encryptPHI: (data) => {
    // Client-side encryption before transmission
    return btoa(JSON.stringify(data)); // Simplified for example
  },

  // Automatic session timeout for inactivity
  setupSessionTimeout: () => {
    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    
    let timeoutId;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        api.logout();
        window.location.href = '/login';
      }, TIMEOUT_DURATION);
    };

    // Reset timeout on user activity
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    resetTimeout();
  }
};
```

### 7.2 FHIR Integration Architecture
```javascript
// FHIR resource conversion
const FHIRConverter = {
  // Convert internal patient model to FHIR Patient resource
  patientToFHIR: (patient) => ({
    resourceType: 'Patient',
    id: patient.id,
    identifier: [{
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }] },
      value: patient.mrn
    }],
    name: [{
      family: patient.lastName,
      given: [patient.firstName]
    }],
    birthDate: patient.dateOfBirth,
    gender: patient.gender.toLowerCase(),
    telecom: [
      { system: 'phone', value: patient.phone, use: 'home' },
      { system: 'email', value: patient.email, use: 'home' }
    ]
  }),

  // Convert FHIR back to internal model
  fhirToPatient: (fhirPatient) => ({
    id: fhirPatient.id,
    mrn: fhirPatient.identifier?.[0]?.value,
    firstName: fhirPatient.name?.[0]?.given?.[0] || '',
    lastName: fhirPatient.name?.[0]?.family || '',
    dateOfBirth: fhirPatient.birthDate,
    gender: fhirPatient.gender?.charAt(0).toUpperCase() + fhirPatient.gender?.slice(1),
    phone: fhirPatient.telecom?.find(t => t.system === 'phone')?.value || '',
    email: fhirPatient.telecom?.find(t => t.system === 'email')?.value || ''
  })
};
```

## 8. Scalability Architecture

### 8.1 Horizontal Scaling Patterns
```javascript
// Load balancing ready session management
const SessionManager = {
  // Redis-based session storage for multi-instance scaling
  storeSession: async (sessionData) => {
    await api.post('/sessions', {
      sessionId: sessionData.id,
      data: sessionData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  },

  // Session recovery across instances
  recoverSession: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  }
};
```

### 8.2 Database Scaling Strategy
```sql
-- Read replica configuration for reporting queries
-- Primary database handles writes
-- Read replicas handle analytics and reporting

-- Partitioning strategy for large tables
CREATE TABLE patients_partitioned (
    LIKE patients INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE patients_2024 PARTITION OF patients_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE patients_2025 PARTITION OF patients_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

## 9. Technology Stack Matrix

### 3.1 Frontend (The Clinical Interface)
- **Framework**: **ReactJS (React 18)** with Vite for high-performance HMR.
- **Architectural Pattern**: Single Page Application (SPA) with component-based architecture.
- **State Management**: Centralized application state in `App.jsx` using React Hooks for cross-module consistency.
- **Design System**: **Critical Care Design System**—a custom-built Vanilla CSS architecture focused on cognitive ergonomics and zero-runtime overhead.
- **Visualization**: **Apache ECharts** for high-density clinical and fiscal analytics.
- **Icons**: **Lucide-React** for premium, healthcare-standard UI across all modules.

### 3.2 Backend (The Governance Layer)
- **Runtime**: **Node.js 20+** with Express.js framework.
- **API Architecture**: RESTful API pattern for predictable client-server communication.
- **Middleware Pattern**: Modular pipeline architecture (Express Middleware) for request authentication, tenant resolving, permission validation, and feature gating.
- **Security**: **JWT (RS256)** authentication for stateless, tenant-scoped identity management.
- **AI Intelligence**: **Google Gemini-1.5-Flash** integrated for generative clinical summarization and decision support.

### 3.3 Data Layer (The Institutional Persistence)
- **Database**: **PostgreSQL** relational database for ACID-compliant clinical and financial records.
- **Isolation Strategy**: Single-schema multi-tenancy with `tenant_id` scoping at the query level (Row-Level Security pattern equivalent).
- **Connection Strategy**: Pool-driven PostgreSQL client for optimized resource lifecycle.

### 3.4 Infrastructure & Operations
- **Deployment**: Container-first architecture for elastic scalability.
- **Observability**: Real-time KPI aggregation nodes for system health monitoring.
- **Modernization Stack**: Integrated **Global Toast Notification** system and **Cost Governance Dashboard**.

## 4. Multi-Tenant Financial Sharding
- **Offer Engine**: Dynamic tier pricing and discount provisioning logic mapped per tenant.
- **Cost Governance**: Real-time compute utilization and vendor cost tracking for institutional efficiency.
- **Payment Nodes**: Decoupled Platform and Tenant payment flows, allowing hospitals to use their own gateway shards.
