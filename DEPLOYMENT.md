# EMR Application - Render Deployment Guide

Last updated: 2026-03-31

## 📋 Overview

This document provides comprehensive instructions for deploying the Medflow EMR (Electronic Medical Records) application to Render cloud platform using Prisma ORM, PostgreSQL, and modern web technologies.

## 🏗️ Architecture Overview

### **Technology Stack**
- **Frontend**: React 19 + Vite + TailwindCSS
- **Backend**: Node.js 20 + Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for sessions and performance
- **Deployment**: Render Cloud Platform
- **Authentication**: JWT-based multi-tenant system

### **Application Structure**
```
├── client/                 # React frontend
│   ├── src/
│   ├── dist/               # Built frontend files
│   └── package.json
├── server/                 # Node.js backend
│   ├── lib/
│   │   └── prisma.js      # Prisma ORM service
│   ├── controllers/
│   ├── routes/
│   └── index.js
├── prisma/                 # Database schema
│   ├── schema.prisma
│   └── migrations/
└── database/               # SQL schemas
```

## 🚀 Render Services Configuration

### **Required Services**

#### **1. PostgreSQL Database**
```yaml
- type: pserv
- name: emr-database
- databaseName: emr
- user: emr_user
- plan: free
- ipAllowList: [] # Restrict access
```

#### **2. Redis Cache**
```yaml
- type: redis
- name: emr-redis
- plan: free
```

#### **3. Web Application**
```yaml
- type: web
- name: emr-application
- runtime: node
- nodeVersion: 20
- plan: starter
```

### **Complete render-production.yaml**
```yaml
services:
  # PostgreSQL Database
  - type: pserv
    name: emr-database
    databaseName: emr
    user: emr_user
    plan: free
    ipAllowList: []
    
  # Redis for Sessions & Caching
  - type: redis
    name: emr-redis
    plan: free
    
  # Main EMR Application
  - type: web
    name: emr-application
    runtime: node
    nodeVersion: 20
    buildCommand: cd client && npm install && npm run build && cd .. && npm install
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      # Database Connection
      - key: DATABASE_URL
        fromDatabase:
          name: emr-database
          property: connectionString
      
      # Redis Connection  
      - key: REDIS_URL
        fromService:
          type: redis
          name: emr-redis
          property: connectionString
      
      # Application Configuration
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: RENDER
        value: "true"
      
      # Prisma Configuration
      - key: PRISMA_GENERATE_DATAPROXY_TYPES
        value: "true"
      
      # CORS Configuration
      - key: CORS_ORIGIN
        value: "https://emr-application.onrender.com"
      
      # Email Configuration (optional)
      - key: SMTP_HOST
        value: "smtp.gmail.com"
      - key: SMTP_PORT
        value: "587"
      - key: SMTP_SECURE
        value: "true"
    
    # Static file serving
    staticPublishPath: ./client/dist
    
    # Auto-deploy on push
    autoDeploy: true
    
    # Health checks
    healthCheck:
      path: /api/health
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    
    # Resource configuration
    plan: starter
    numInstances: 1
    scaling:
      minInstances: 1
      maxInstances: 3
      targetMemoryPercent: 70
      targetCPUUtilization: 70
    
    # Build optimization
    buildFilter:
      paths:
        - "!node_modules/**"
        - "!client/node_modules/**"
        - "!test/**"
        - "!docs/**"
        - "!.env*"
        - "!*.log"
    
    # Deployment hooks
    preDeployCommand: npm run prisma:generate
    postDeployCommand: npm run prisma:migrate:deploy
```

## 📦 Dependencies

### **Core Dependencies**
```json
{
  "dependencies": {
    "@prisma/client": "^7.6.0",
    "@prisma/adapter-pg": "^7.6.0",
    "prisma": "^7.7.0",
    "react": "^19.0.0",
    "express": "^4.21.2",
    "vite": "^7.3.1",
    "@tailwindcss/postcss": "^4.2.2",
    "@tailwindcss/vite": "^4.2.2",
    "@vitejs/plugin-react": "^4.7.0",
    "autoprefixer": "^10.4.27",
    "axios": "^1.13.5",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "lucide-react": "^0.577.0",
    "echarts": "^6.0.0",
    "@google/generative-ai": "^0.24.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "winston": "^3.11.0",
    "redis": "^4.6.7",
    "ioredis": "^5.3.2",
    "nodemailer": "^6.9.1",
    "pg": "^8.16.3",
    "postcss": "^8.5.8",
    "tailwindcss": "^4.2.2"
  }
}
```

### **Production Scripts**
```json
{
  "scripts": {
    "deploy:render": "bash scripts/render-deploy.sh",
    "prisma:generate": "npx prisma generate",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:migrate:deploy": "npx prisma migrate deploy",
    "prisma:studio": "npx prisma studio",
    "build": "cd client && npm install && cd .. && vite build client --config client/vite.config.js",
    "start": "node server/index.js"
  }
}
```

## 🔧 Environment Configuration

### **Required Environment Variables**
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://user:password@host:port

# Application Configuration
NODE_ENV=production
PORT=10000
RENDER=true

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Prisma Configuration
PRISMA_GENERATE_DATAPROXY_TYPES=true

# CORS Configuration
CORS_ORIGIN=https://your-app-domain.onrender.com

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Production Configuration File**
```javascript
// server/config/production.js
export const config = {
  port: process.env.PORT || 10000,
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: 3600,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256'
  },
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200
  }
};
```

## 🗄️ Database Setup

### **Prisma Schema Highlights**
```prisma
// Multi-tenant architecture
model Tenant {
  id                String    @id @default(cuid())
  name              String
  subscriptionTier  String    @default("Free")
  isActive          Boolean   @default(true)
  
  // Relations
  users             User[]
  patients          Patient[]
  appointments      Appointment[]
  // ... other relations
}

// Patient records (PHI - Protected Health Information)
model Patient {
  id          String    @id @default(cuid())
  tenantId    String
  mrn         String    // Medical Record Number
  firstName   String
  lastName    String
  dateOfBirth DateTime?
  gender      String?
  phone       String?
  email       String?
  
  @@unique([tenantId, mrn])
}
```

### **Migration Management**
```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate dev

# Deploy migrations to production
npm run prisma:migrate:deploy

# Open Prisma Studio
npm run prisma:studio
```

## 🛡️ Security Configuration

### **Security Middleware**
```javascript
// server/middleware/security.js
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
}));
```

### **Authentication & Authorization**
```javascript
// JWT-based authentication
const authenticateToken = (req, res, next) => {
  const token = req.header('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Multi-tenant access control
const requireTenant = (req, res, next) => {
  if (!req.user?.tenantId) {
    return res.status(403).json({ error: 'Tenant access required' });
  }
  req.tenantId = req.user.tenantId;
  next();
};
```

## 📊 Monitoring & Health Checks

### **Health Check Endpoint**
```javascript
// server/routes/health.js
app.get('/api/health', async (req, res) => {
  try {
    // Database health check
    const dbHealth = await prismaService.healthCheck();
    
    // Redis health check
    const redisHealth = await checkRedisConnection();
    
    // Application health
    const appHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: dbHealth,
        redis: redisHealth
      }
    };
    
    res.status(200).json(appHealth);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

### **Logging Configuration**
```javascript
// server/utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

## 🚀 Deployment Process

### **Step 1: Prepare Repository**
```bash
# Add all changes
git add .

# Commit changes
git commit -m "Add Render deployment configuration

- Add render-production.yaml with complete service definitions
- Add production dependencies and security middleware
- Configure Prisma for production deployment
- Add health checks and monitoring
- Add deployment scripts and documentation"

# Push to GitHub
git push origin main
```

### **Step 2: Create Render Services**
1. **Login to Render Dashboard** (https://dashboard.render.com)
2. **Connect Your GitHub Repository**
3. **Create New Services**:
   - **PostgreSQL**: Use `render-production.yaml` or create manually
   - **Redis**: Create manually
   - **Web Service**: Use `render-production.yaml`

### **Step 3: Configure Environment Variables**
In Render Dashboard for your web service:
- **DATABASE_URL**: Auto-populated from PostgreSQL service
- **REDIS_URL**: Auto-populated from Redis service
- **JWT_SECRET**: Generate new secret
- **CORS_ORIGIN**: Set to your Render app URL
- **NODE_ENV**: Set to `production`

### **Step 4: Deploy**
```bash
# Automatic deployment on git push
# Or manual deployment via Render dashboard
```

### **Step 5: Verify Deployment**
```bash
# Check health endpoint
curl https://your-app.onrender.com/api/health

# Test database connection
curl https://your-app.onrender.com/api/patients

# Verify frontend loads
curl https://your-app.onrender.com/
```

## 🔄 CI/CD Pipeline

### **Render Webhook Configuration**
```yaml
# render.yaml additions
webhooks:
  - url: https://api.render.com/deploy/webhook
    events: [push]
    branches: [main]
    autoDeploy: true
```

### **Deployment Hooks**
```yaml
# In render-production.yaml
preDeployCommand: npm run prisma:generate
postDeployCommand: npm run prisma:migrate:deploy
```

### **Build Optimization**
```yaml
buildFilter:
  paths:
    - "!node_modules/**"
    - "!client/node_modules/**"
    - "!test/**"
    - "!docs/**"
    - "!.env*"
    - "!*.log"
```

## 📈 Performance Optimization

### **Database Performance**
```javascript
// Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'],
});

// Query optimization
const patients = await prisma.patient.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    mrn: true,
    createdAt: true
  },
  where: { tenantId, isActive: true },
  orderBy: { lastName: 'asc' },
  take: 50
});
```

### **Caching Strategy**
```javascript
// Redis caching for sessions
const cache = new Map();

const getCachedData = async (key) => {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data, ttl = 3600) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + (ttl * 1000)
  });
};
```

### **Static Asset Optimization**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'echarts'],
        },
      chunkFileNames: 'static/js/[name]-[hash].js',
      entryFileNames: 'static/js/[name].js',
    },
  },
});
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check database status
curl https://your-app.onrender.com/api/health

# Check Render service logs
# Navigate to Render Dashboard > Your Service > Logs
```

#### **Migration Issues**
```bash
# Reset database (development only)
npx prisma migrate reset --force

# Deploy migrations manually
npx prisma migrate deploy
```

#### **Build Issues**
```bash
# Clear build cache
rm -rf client/dist
npm run build

# Check build logs in Render dashboard
```

### **Performance Issues**
```bash
# Monitor resource usage
# Render Dashboard > Your Service > Metrics

# Check database query performance
# Enable Prisma query logging in development
```

## 📱 Scaling Configuration

### **Auto-Scaling**
```yaml
# In render-production.yaml
scaling:
  minInstances: 1
  maxInstances: 3
  targetMemoryPercent: 70
  targetCPUUtilization: 70
```

### **Database Scaling**
```sql
-- Connection pool optimization
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = 256MB;
ALTER SYSTEM SET effective_cache_size = 1GB;
```

### **Redis Scaling**
```javascript
// Connection pool configuration
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});
```

## 🔐 Maintenance

### **Regular Tasks**
- **Database Backups**: Render automatically backs up PostgreSQL
- **Log Rotation**: Configure log rotation for Winston logs
- **Security Updates**: Regularly update dependencies
- **Performance Monitoring**: Monitor Render metrics

### **Backup Strategy**
```bash
# Database backups (automatic on Render)
# Manual backup commands:
pg_dump emr > backup-$(date +%Y%m%d).sql

# Redis backups
redis-cli BGSAVE
```

### **Update Process**
```bash
# Update dependencies
npm update

# Run migrations
npm run prisma:migrate:deploy

# Restart service (automatic on Render)
```

## 📞 Support & Monitoring

### **Render Dashboard**
- **Service Logs**: Monitor application logs
- **Metrics**: CPU, memory, and performance metrics
- **Events**: Deployment and scaling events
- **Health Checks**: Service health status

### **External Monitoring**
```javascript
// Application metrics endpoint
app.get('/api/metrics', async (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeUsers: await getActiveUsersCount(),
    databaseConnections: await getDatabaseConnections(),
    cacheHitRate: await getCacheHitRate(),
  };
  
  res.json(metrics);
});
```

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] All dependencies updated
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Health checks implemented
- [ ] Security middleware added
- [ ] Logging configured
- [ ] Build process optimized

### **Post-Deployment**
- [ ] Health endpoint responding
- [ ] Database connection working
- [ ] Frontend loading correctly
- [ ] Authentication working
- [ ] Multi-tenancy functional
- [ ] API endpoints responding
- [ ] Static assets serving

### **Ongoing**
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Update dependencies regularly
- [ ] Review security logs
- [ ] Test backup/restore procedures

---

## 📞 Support

For deployment issues:
1. Check Render service logs
2. Verify environment variables
3. Test health endpoints
4. Review this documentation
5. Contact support if needed

**Happy deploying! 🚀**
