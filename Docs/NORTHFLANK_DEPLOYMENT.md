# EMR Application - Northflank Deployment Guide

Last updated: 2026-04-01

## 🚀 Northflank Deployment Overview

This guide provides comprehensive instructions for deploying the Medflow EMR application to Northflank using PostgreSQL and Redis services.

## 📋 Prerequisites

### **Required Accounts**
- [Northflank Account](https://northflank.com/) (Free tier)
- [GitHub Repository](https://github.com/) with EMR code
- [Domain Name](https://namecheap.com/) (optional, for custom domain)

### **Technology Stack**
- **Frontend**: React 19 + Vite
- **Backend**: Node.js 20 + Express + Prisma ORM
- **Database**: PostgreSQL (Northflank Add-on)
- **Cache**: Redis (Northflank Add-on)
- **Deployment**: Northflank Container Service

## 🏗️ Architecture Overview

```
🏥 EMR Application on Northflank
├── 🗄️ PostgreSQL Database (Add-on)
│   ├── 256MB storage
│   ├── Automatic backups
│   └── Connection strings
├── 🗄️ Redis Cache (Add-on)
│   ├── 256MB memory
│   ├── Persistent storage
│   └── High performance
├── 🚀 Backend Container
│   ├── Node.js 20
│   ├── 512MB RAM
│   ├── Prisma ORM
│   └── API endpoints
└── 📱 Static Site
    ├── React SPA
    ├── CDN distribution
    └── Custom domain
```

## 💰 Cost Analysis

### **Free Tier Limits**
```
🆓 Northflank Free Tier:
├── 🗄️ PostgreSQL: 256MB storage → $0/month
├── 🗄️ Redis: 256MB memory → $0/month
├── 🚀 Container: 512MB RAM → $0/month
├── 📱 Static Site: Unlimited → $0/month
├── 🌐 Custom Domain: Free → $0/month
└── 🔄 Auto-deploy: Free → $0/month

💰 Total Monthly Cost: $0
```

### **Capacity Estimation**
```
📊 Resource Capacity:
├── 👥 Concurrent Users: 50-100
├── 📋 Patient Records: 10,000-50,000
├── 📊 API Requests: 100,000/day
├── 💾 Database Storage: 200MB (optimized)
└── 🌐 Bandwidth: 100GB/month
```

## 🚀 Deployment Steps

### **Step 1: Create Northflank Project**

1. **Login to Northflank**
   - Visit [northflank.com](https://northflank.com/)
   - Sign up/login with GitHub

2. **Create New Project**
   ```
   Project Name: emr-application
   Description: Multi-tenant EMR System
   Region: Europe West 1 (or closest to users)
   ```

3. **Connect GitHub Repository**
   - Link your GitHub repository
   - Select `emr-application` repository
   - Configure auto-deploy settings

### **Step 2: Create Database Add-on**

1. **Navigate to Add-ons**
   ```
   Go to Project → Add-ons → Create Add-on
   ```

2. **Configure PostgreSQL**
   ```
   Add-on Type: PostgreSQL
   Version: 14
   Plan: Free
   Name: emr-postgres
   Database Name: emr
   User: emr_user
   ```

3. **Get Connection String**
   ```
   Connection String: postgresql://emr_user:password@host:port/emr
   Save this for environment variables
   ```

### **Step 3: Create Redis Add-on**

1. **Configure Redis**
   ```
   Add-on Type: Redis
   Version: 7
   Plan: Free
   Name: emr-redis
   ```

2. **Get Connection Details**
   ```
   Connection URL: redis://host:port
   Password: [generated password]
   Save these for environment variables
   ```

### **Step 4: Create Backend Container Service**

1. **Create Container Service**
   ```
   Service Type: Container
   Name: emr-backend
   Build Type: Dockerfile
   ```

2. **Configure Build Settings**
   ```yaml
   Build Context: ./
   Dockerfile Path: ./Dockerfile
   Build Command: npm install && npm run build
   ```

3. **Set Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://emr_user:password@host:port/emr
   REDIS_URL=redis://host:port
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://emr-app.northflank.com
   ```

4. **Configure Resources**
   ```yaml
   CPU: 0.25 cores
   Memory: 512Mi
   Replicas: 1
   ```

5. **Set Health Check**
   ```yaml
   Path: /api/health
   Port: 4000
   Interval: 30s
   Timeout: 5s
   Retries: 3
   ```

### **Step 5: Create Frontend Static Site**

1. **Create Static Service**
   ```
   Service Type: Static Site
   Name: emr-frontend
   ```

2. **Configure Build**
   ```yaml
   Build Context: ./client
   Build Command: npm run build
   Output Directory: ./dist
   ```

3. **Set Routes**
   ```yaml
   Route: /*
   Directory: /
   SPA: true
   ```

### **Step 6: Configure Custom Domain (Optional)**

1. **Add Domain**
   ```
   Go to Project → Domains → Add Domain
   Domain: your-domain.com
   ```

2. **Update DNS**
   ```
   CNAME Record: your-domain.com → cname.northflank.com
   ```

3. **Update CORS**
   ```bash
   CORS_ORIGIN=https://your-domain.com
   ```

## 🔧 Configuration Files

### **Dockerfile**
```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --only=production
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY server/ ./server/
COPY --from=frontend-builder /app/client/dist ./client/dist

EXPOSE 4000
CMD ["npm", "start"]
```

### **Northflank Configuration**
```yaml
version: "1"

services:
  - name: emr-backend
    type: container
    image:
      dockerfile: ./Dockerfile
      context: .
    ports:
      - port: 4000
    environment:
      - key: DATABASE_URL
        value: ${nf_postgres_connection_string}
      - key: REDIS_URL
        value: ${nf_redis_connection_string}
      - key: JWT_SECRET
        value: ${JWT_SECRET}

addons:
  - name: emr-postgres
    type: postgres
    version: "14"
    plan: free
  - name: emr-redis
    type: redis
    version: "7"
    plan: free
```

## 🗄️ Database Setup

### **Run Migrations**
```bash
# Connect to Northflank container
# Run database migrations
npx prisma migrate deploy

# Verify database connection
npx prisma db pull
```

### **Seed Initial Data**
```bash
# Seed demo data
npm run seed:e2e

# Create admin user
npm run seed:nah
```

## 🔍 Monitoring & Health Checks

### **Health Endpoint**
```javascript
// server/routes/health.js
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await prismaService.healthCheck();
    const redisHealth = await checkRedisConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### **Monitoring Dashboard**
- **Northflank Dashboard**: Real-time metrics
- **Container Logs**: Application logs
- **Resource Usage**: CPU, memory, storage
- **Health Checks**: Service availability

## 🔒 Security Configuration

### **Environment Variables Security**
```bash
# Use Northflank's encrypted variables
JWT_SECRET=use-northflank-encrypted-variable
DATABASE_URL=use-northflank-connection-string
REDIS_URL=use-northflank-connection-string
```

### **CORS Configuration**
```javascript
// server/config/northflank.js
const cors = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
};
```

### **Rate Limiting**
```javascript
// server/middleware/rateLimit.js
const rateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
  message: 'Too many requests'
});
```

## 🚀 Deployment Commands

### **Manual Deployment**
```bash
# Build and deploy
git push origin main
# Northflank auto-deploys on push
```

### **Database Operations**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Reset database (development)
npx prisma migrate reset --force
```

### **Health Checks**
```bash
# Check service health
curl https://emr-app.northflank.com/api/health

# Check frontend
curl https://emr-app.northflank.com/
```

## 📊 Performance Optimization

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
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### **Redis Connection Failed**
```bash
# Check Redis URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

#### **Build Failed**
```bash
# Check build logs in Northflank dashboard
# Verify Dockerfile path
# Check package.json scripts
```

#### **Health Check Failed**
```bash
# Check if /api/health endpoint exists
# Verify port configuration
# Check service logs
```

### **Performance Issues**
```bash
# Monitor resource usage
# Check database query performance
# Optimize Prisma queries
# Implement caching
```

## 📈 Scaling Strategy

### **When to Upgrade**
```
📊 Upgrade Triggers:
├── Database: >200MB storage used
├── Memory: >400MB RAM usage
├── CPU: >80% sustained usage
└── Users: >100 concurrent

💰 Upgrade Costs:
├── PostgreSQL: $7/month
├── Redis: $7/month
├── Container: $7/month
└── Total: $21/month
```

### **Scaling Options**
```yaml
# Scale container service
replicas: 2-3
resources:
  cpu: 0.5-1.0
  memory: 1-2Gi

# Scale database
plan: professional
storage: 1-10GB

# Scale Redis
plan: professional
memory: 1-4GB
```

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] GitHub repository updated
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Health checks implemented
- [ ] Security settings configured
- [ ] Performance optimizations applied

### **Post-Deployment**
- [ ] Health endpoint responding
- [ ] Database connection working
- [ ] Redis connection working
- [ ] Frontend loading correctly
- [ ] Authentication working
- [ ] API endpoints responding
- [ ] Custom domain configured (if applicable)

### **Ongoing**
- [ ] Monitor resource usage
- [ ] Check error logs
- [ ] Update dependencies
- [ ] Review security
- [ ] Test backup/restore

## 📞 Support

### **Northflank Documentation**
- [Northflank Docs](https://docs.northflank.com/)
- [Container Services](https://docs.northflank.com/services/container-services)
- [Add-ons](https://docs.northflank.com/add-ons/overview)

### **Troubleshooting Resources**
- Northflank Dashboard logs
- Container service logs
- Database connection testing
- Redis connection testing

---

## 🎉 Ready for Deployment!

Your EMR application is now configured for Northflank deployment with:

- ✅ **Zero cost** deployment on free tier
- ✅ **PostgreSQL database** with automatic backups
- ✅ **Redis caching** for performance
- ✅ **Container-based** backend deployment
- ✅ **Static site** frontend serving
- ✅ **Custom domain** support
- ✅ **Health monitoring** and logging
- ✅ **Auto-deployment** on git push

**Deploy your EMR application to Northflank and start serving patients!** 🚀
