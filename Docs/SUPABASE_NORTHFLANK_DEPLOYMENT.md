# EMR Application - Supabase + Northflank Deployment Guide

Last updated: 2026-04-02

## 🚀 Supabase + Northflank Deployment Overview

This guide provides comprehensive instructions for deploying the Medflow EMR application using **Supabase for PostgreSQL database** and **Northflank for hosting services**.

## 📋 Prerequisites

### **Required Accounts**
- [Supabase Account](https://supabase.com/) (Free tier)
- [Northflank Account](https://northflank.com/) (Free tier)
- [GitHub Repository](https://github.com/) with EMR code

### **Technology Stack**
- **Frontend**: React 19 + Vite (Northflank Static Site)
- **Backend**: Node.js 20 + Express + Prisma ORM (Northflank Container)
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis (Northflank Add-on)
- **Deployment**: Northflank Container + Static Services

## 🏗️ Architecture Overview

```
🏥 EMR Application: Supabase + Northflank
├── 🗄️ Supabase PostgreSQL (Database)
│   ├── 500MB storage
│   ├── Automatic backups
│   ├── Connection pooling
│   └── REST API
├── 🗄️ Northflank Redis (Cache)
│   ├── 256MB memory
│   ├── Persistent storage
│   └── High performance
├── 🚀 Northflank Container (Backend)
│   ├── Node.js 20
│   ├── 512MB RAM
│   ├── Prisma ORM
│   └── API endpoints
└── 📱 Northflank Static Site (Frontend)
    ├── React SPA
    ├── CDN distribution
    └── Custom domain
```

## 💰 Cost Analysis

### **Free Tier Benefits**
```
🆓 Supabase Free Tier:
├── 🗄️ PostgreSQL: 500MB storage
├── 📊 Bandwidth: 2GB/month
├── 👥 Users: 50,000
├── 🔄 API Calls: 500,000/month
└── 💰 Cost: $0/month

🆓 Northflank Free Tier:
├── 🚀 Container: 512MB RAM
├── 🗄️ Redis: 256MB memory
├── 📱 Static Site: Unlimited
├── 🌐 Bandwidth: 100GB/month
└── 💰 Cost: $0/month

💰 Total Monthly Cost: $0
```

### **Capacity Estimation**
```
📊 Resource Capacity:
├── 👥 Concurrent Users: 50-100
├── 📋 Patient Records: 10,000-50,000
├── 📊 API Requests: 100,000/day
├── 💾 Database Storage: 400MB (optimized)
└── 🌐 Bandwidth: 100GB/month
```

## 🚀 Deployment Steps

### **Step 1: Create Supabase Project**

#### **1.1 Sign Up for Supabase**
```
🌐 Go to: https://supabase.com/
👤 Click "Start your project" → "Continue with GitHub"
✅ Authorize Supabase to access your GitHub
📧 Verify your email if prompted
```

#### **1.2 Create New Project**
```
📁 Dashboard → "New Project"
📝 Project Details:
   - Project Name: emr-application
   - Database Password: [secure password]
   - Region: Choose closest to Northflank (Europe West 1)
   - Pricing Plan: Free
✅ Click "Create new project"
⏳ Wait for project to be created (1-2 minutes)
```

#### **1.3 Get Connection Details**
```
📊 Project Settings → Database
📋 Copy Connection String:
   postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

📋 Copy API Details:
   - Project URL: https://[project-ref].supabase.co
   - Anon Key: [your-anon-key]
   - Service Role Key: [your-service-role-key]

📝 Save these for environment variables
```

### **Step 2: Create Northflank Project**

#### **2.1 Create Northflank Project**
```
🌐 Go to: https://northflank.com/
👤 Login with GitHub
📁 Click "Create Project"
📝 Project Details:
   - Name: emr-application
   - Description: Multi-tenant EMR System
   - Region: Europe West 1 (same as Supabase)
   - Plan: Free
✅ Click "Create Project"
```

### **Step 3: Create Northflank Redis Add-on**

#### **3.1 Add Redis**
```
📁 Project → "Add-ons" → "Create Add-on"
🗄️ Select: Redis
📋 Configuration:
   - Name: emr-redis
   - Version: 7
   - Plan: Free
✅ Click "Create Add-on"
```

#### **3.2 Get Redis Details**
```
📊 Add-on Details → "Connection"
📋 Copy Connection Details:
   - Host: [redis-host]
   - Port: [redis-port]
   - Password: [redis-password]
📝 Save these for environment variables
```

### **Step 4: Deploy Backend Container**

#### **4.1 Create Container Service**
```
📁 Project → "Services" → "Add Service"
📱 Select: "Container Service"
📝 Service Details:
   - Name: emr-backend
   - Description: EMR Backend API
✅ Click "Continue"
```

#### **4.2 Connect Repository**
```
📂 Repository Selection:
   - Choose GitHub repository: emr-application
   - Branch: main (or master)
   - Build Context: ./
   - Dockerfile Path: ./Dockerfile
✅ Click "Continue"
```

#### **4.3 Environment Variables**
```
⚙️ Environment Variables:
   # Application
   NODE_ENV=production
   PORT=4000
   
   # Supabase Database
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   SUPABASE_URL=https://[project-ref].supabase.co
   SUPABASE_ANON_KEY=[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   
   # Northflank Redis
   REDIS_URL=redis://[redis-host]:[redis-port]
   
   # Application
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://emr-application.northflank.com

✅ Click "Continue"
```

#### **4.4 Resources and Health Check**
```
📊 Resources:
   - CPU: 0.25 cores
   - Memory: 512Mi
   - Replicas: 1

💚 Health Check:
   - Path: /api/health
   - Port: 4000
   - Interval: 30s
   - Timeout: 5s
   - Retries: 3

✅ Click "Create Service"
```

### **Step 5: Deploy Frontend Static Site**

#### **5.1 Create Static Service**
```
📁 Project → "Services" → "Add Service"
📱 Select: "Static Site"
📝 Service Details:
   - Name: emr-frontend
   - Description: EMR Frontend
✅ Click "Continue"
```

#### **5.2 Build Configuration**
```
📂 Repository Selection:
   - Choose GitHub repository: emr-application
   - Branch: main (or master)

🏗️ Build Settings:
   - Build Context: ./client
   - Build Command: npm run build
   - Output Directory: ./dist

🛣️ Routes:
   - Path: /*
   - Directory: /
   - SPA: true

✅ Click "Create Service"
```

### **Step 6: Run Database Migrations**

#### **6.1 Access Container Console**
```
📁 Go to emr-backend service
🔧 Click "Console" or "Shell"
```

#### **6.2 Run Migrations**
```
📋 Generate Prisma client:
   npx prisma generate

📋 Run database migrations:
   npx prisma migrate deploy

📋 Seed initial data:
   npm run seed:e2e
   npm run seed:services
```

### **Step 7: Verify Deployment**

#### **7.1 Test Backend**
```
🌐 Open: https://emr-application.northflank.com/api/health
✅ Expected Response:
{
  "status": "healthy",
  "timestamp": "2026-04-02T...",
  "services": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" }
  }
}
```

#### **7.2 Test Frontend**
```
🌐 Open: https://emr-application.northflank.com
✅ Expected: EMR application loads
✅ Test: Login functionality
✅ Test: Patient navigation
✅ Test: Service catalog
```

## 🔧 Configuration Files

### **Northflank Deployment YAML**
```yaml
# northflank-supabase-deployment.yaml
services:
  - name: emr-backend
    type: container
    environment:
      - key: DATABASE_URL
        value: ${supabase_database_url}
      - key: REDIS_URL
        value: ${nf_redis_connection_string}
      - key: JWT_SECRET
        value: ${JWT_SECRET}

addons:
  - name: emr-redis
    type: redis
    version: "7"
    plan: free
```

### **Supabase Configuration**
```javascript
// server/config/supabase.js
export const config = {
  database: {
    url: process.env.DATABASE_URL,
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  }
};
```

### **Frontend Configuration**
```javascript
// client/.env.supabase
VITE_API_URL=https://emr-app.northflank.com
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

## 🗄️ Database Management

### **Supabase Dashboard**
```
📊 Supabase Features:
├── 🗄️ Table Editor (Visual database management)
├── 📊 SQL Editor (Direct SQL queries)
├── 👥 Authentication (User management)
├── 📁 Storage (File uploads)
├── 📊 Analytics (Usage monitoring)
└── 🔧 Settings (Configuration)
```

### **Prisma Operations**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# View database
npx prisma studio

# Reset database (development)
npx prisma migrate reset --force
```

### **Backup Strategy**
```
📊 Supabase Backup:
├── 🔄 Automatic daily backups
├── 📅 Point-in-time recovery (7 days)
├── 📊 Download backups manually
└── 🔒 Encrypted storage
```

## 🔍 Monitoring & Health Checks

### **Supabase Monitoring**
```
📊 Dashboard Metrics:
├── 👥 Active users
├── 📊 API requests
├── 💾 Database size
├── 🔄 Bandwidth usage
└── ⚡ Performance metrics
```

### **Northflank Monitoring**
```
📊 Service Metrics:
├── 🚀 Container status
├── 💾 Memory usage
├── ⚡ CPU usage
├── 📊 Build logs
└── 🔍 Error logs
```

### **Health Endpoints**
```javascript
// Backend health check
app.get('/api/health', async (req, res) => {
  const dbHealth = await prismaService.healthCheck();
  const redisHealth = await checkRedisConnection();
  
  res.json({
    status: 'healthy',
    services: {
      database: dbHealth,
      redis: redisHealth
    }
  });
});
```

## 🔒 Security Configuration

### **Supabase Security**
```
🔒 Security Features:
├── 🔑 Row Level Security (RLS)
├── 👥 Authentication & Authorization
├── 🔗 API Key management
├── 🌐 CORS configuration
└── 📊 Audit logs
```

### **Northflank Security**
```
🔒 Security Features:
├── 🔒 Encrypted environment variables
├── 🌐 SSL certificates
├── 🔗 Private repositories
├── 📊 Access logs
└── 🚀 Container isolation
```

## 🚀 Performance Optimization

### **Database Optimization**
```sql
-- Add indexes for performance
CREATE INDEX idx_patients_tenant_active ON patients(tenant_id, is_active);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_encounters_patient ON encounters(patient_id);
```

### **Caching Strategy**
```javascript
// Redis caching for frequent queries
const getCachedPatients = async (tenantId) => {
  const cacheKey = `patients:${tenantId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const patients = await prisma.patient.findMany({
    where: { tenantId, isActive: true }
  });
  
  await redis.setex(cacheKey, 3600, JSON.stringify(patients));
  return patients;
};
```

### **Frontend Optimization**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'echarts']
        }
      }
    }
  }
});
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Database Connection Failed**
```
🔍 Check:
   - Supabase project is active
   - DATABASE_URL is correct
   - Network connectivity

🔧 Fix:
   - Verify connection string
   - Check Supabase status
   - Test connection manually
```

#### **Redis Connection Failed**
```
🔍 Check:
   - Redis add-on is running
   - REDIS_URL is correct
   - Password is correct

🔧 Fix:
   - Verify connection details
   - Restart Redis add-on
   - Check Northflank logs
```

#### **Build Failed**
```
🔍 Check:
   - Dockerfile exists
   - Build logs for errors
   - Package.json scripts

🔧 Fix:
   - Check build logs
   - Verify Dockerfile syntax
   - Update dependencies
```

#### **Health Check Failed**
```
🔍 Check:
   - /api/health endpoint exists
   - Database connection working
   - Redis connection working

🔧 Fix:
   - Verify health endpoint
   - Check environment variables
   - Review service logs
```

## 📈 Scaling Strategy

### **When to Upgrade**
```
📊 Upgrade Triggers:
├── Database: >400MB storage used
├── Memory: >400MB RAM usage
├── CPU: >80% sustained usage
├── Users: >100 concurrent
└── API calls: >500,000/month

💰 Upgrade Costs:
├── Supabase Pro: $25/month
├── Northflank Pro: $20/month
└── Total: $45/month
```

### **Scaling Options**
```yaml
# Scale container service
replicas: 2-3
resources:
  cpu: 0.5-1.0
  memory: 1-2Gi

# Scale database (Supabase Pro)
storage: 10GB
bandwidth: 50GB
users: 100,000
```

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] Supabase account created
- [ ] Supabase project created
- [ ] Northflank account created
- [ ] Northflank project created
- [ ] Redis add-on created
- [ ] Environment variables configured

### **Post-Deployment**
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] Database migrations run
- [ ] Initial data seeded
- [ ] Health check passing
- [ ] Frontend loading correctly
- [ ] Authentication working
- [ ] API endpoints responding

### **Ongoing**
- [ ] Monitor Supabase usage
- [ ] Monitor Northflank resources
- [ ] Check error logs
- [ ] Update dependencies
- [ ] Review security

## 📞 Support

### **Documentation**
- [Supabase Docs](https://supabase.com/docs)
- [Northflank Docs](https://docs.northflank.com/)
- [Prisma Docs](https://www.prisma.io/docs)

### **Troubleshooting Resources**
- Supabase Dashboard logs
- Northflank service logs
- Database connection testing
- Redis connection testing

---

## 🎉 Success! 

Your EMR application is now deployed with:

- ✅ **Zero cost** deployment
- ✅ **Supabase PostgreSQL** with automatic backups
- ✅ **Northflank Redis** for performance
- ✅ **Container-based** backend
- ✅ **Static site** frontend
- ✅ **Health monitoring** and logging
- ✅ **Custom domain** support
- ✅ **Scalable architecture**

**Deploy your EMR application and start serving patients!** 🚀
