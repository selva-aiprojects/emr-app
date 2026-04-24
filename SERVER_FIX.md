# 🔧 **Server Startup Issue - Database Connection Problem**

## ❌ **Problem Identified**
The server is failing to start because of a database connection issue. The error shows:

```
[dev:server] Failed running 'server/index.js'. Waiting for file changes before restarting...
```

## 🔍 **Root Cause**
The `.env` file is missing or has an incorrect `DATABASE_URL` configuration.

---

## 🛠️ **Quick Fix Solutions**

### **Option 1: Use Local PostgreSQL** (Recommended for Development)

#### **1. Update .env file**
Create/update your `.env` file with:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/emr
```

#### **2. Ensure PostgreSQL is Running**
```bash
# Check if PostgreSQL is running
psql -U postgres -h localhost

# If not running, start PostgreSQL service
# Windows:
net start postgresql-x64-14

# Or use Docker:
docker run --name postgres-emr -e POSTGRES_PASSWORD=password -e POSTGRES_DB=emr -p 5432:5432 -d postgres:14
```

#### **3. Create Database**
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE emr;
```

### **Option 2: Use Neon (Cloud PostgreSQL)**

#### **1. Get Neon Database URL**
1. Go to [https://neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string

#### **2. Update .env file**
```env
PORT=4000
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### **Option 3: Use SQLite (Quick Local Setup)**

#### **1. Install SQLite**
```bash
npm install sqlite3
```

#### **2. Create SQLite connection**
Update `server/db/connection.js` temporarily:

```javascript
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function query(text, params = []) {
  // SQLite implementation
  console.log('SQLite query:', text);
  return { rows: [] };
}
```

---

## 🚀 **Immediate Fix Steps**

### **Step 1: Check Current .env**
```bash
cat .env
```

### **Step 2: Update .env with Working Database URL**
```bash
# For local PostgreSQL
echo "PORT=4000" > .env
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/emr" >> .env
```

### **Step 3: Test Database Connection**
```bash
node -e "
import { testConnection } from './server/db/connection.js';
testConnection().then(success => {
  console.log('Database test:', success ? '✅ PASS' : '❌ FAIL');
});
"
```

### **Step 4: Restart Server**
```bash
npm run dev
```

---

## 🧪 **Database Setup Scripts**

### **Run Database Setup**
```bash
# If using local PostgreSQL
node scripts/setup_feature_flags_minimal.js

# If database doesn't exist
node scripts/create_test_tenants.js
```

---

## 📋 **Verification Checklist**

- [ ] PostgreSQL is running (local or cloud)
- [ ] `.env` file has correct `DATABASE_URL`
- [ ] Database `emr` exists
- [ ] Server starts without errors
- [ ] Database connection test passes
- [ ] Test users are created
- [ ] Login works with test credentials

---

## 🎯 **Expected Success Output**

After fixing, you should see:

```
[dev:server] ✅ Connected to PostgreSQL database
[dev:server] ✅ Database connection test successful
[dev:server]    Database: emr
[dev:server]    Server time: 2024-02-18T...
[dev:server] Server running on port 4000
[dev:server] Environment: development
```

---

## 🆘 **If Still Failing**

### **Check PostgreSQL Installation**
```bash
# Windows
psql --version

# Check service
sc query postgresql-x64-14
```

### **Check Network**
```bash
# Test connection
telnet localhost 5432
```

### **Check Environment**
```bash
# Verify .env is loaded
node -e "console.log('DB URL:', process.env.DATABASE_URL)"
```

---

## 🚨 **Emergency Fix**

If you need the server running immediately for testing:

1. **Use Superadmin credentials** (doesn't require database for initial login)
2. **Set up a local PostgreSQL instance**
3. **Use the provided setup scripts**

**The most common fix is ensuring your `.env` file has the correct `DATABASE_URL` for your PostgreSQL setup!** 🔧
