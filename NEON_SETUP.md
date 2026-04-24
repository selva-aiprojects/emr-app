# 🚀 Quick Setup with Your Existing Neon Database

## ✅ Good News!

You already have a Neon database configured! I've created the `.env` file with your connection details.

**Database:** `stockstewardai` (on Neon)  
**Schema:** `emr` (will be created in this database)

---

## 📋 Setup Steps (10 minutes)

### Step 1: Install Dependencies (2 minutes)

```bash
cd D:\Training\working\EMR-Application

npm install bcryptjs jsonwebtoken
```

### Step 2: Test Connection & Setup Schema (3 minutes)

```bash
node scripts/setup_neon_db.js
```

This script will:
- ✅ Test connection to your Neon database
- ✅ Check if EMR schema exists
- ✅ Create EMR schema if needed
- ✅ Load test data (superadmin, sample tenant, users)
- ✅ Show you test credentials

**Expected Output:**
```
🚀 Neon Database Setup

✅ Successfully connected to Neon database!
   Database: stockstewardai
   User: neondb_owner
   
🔍 Checking if EMR schema exists...
⚠️  EMR schema does not exist yet

🏗️  Creating EMR schema and tables...
✅ EMR schema created successfully!

✅ Created 15 tables:
   ✓ emr.tenants
   ✓ emr.users
   ✓ emr.patients
   ... (and more)

📦 Loading initial test data...
✅ Initial data loaded successfully!

🔐 TEST CREDENTIALS
Superadmin:
   Tenant: superadmin
   Email: superadmin@emr.local
   Password: Admin@123
```

### Step 3: Switch to New Server (2 minutes)

```bash
# Backup old server
cp server/index.js server/index_old.js

# Use new PostgreSQL server
cp server/index_v2.js server/index.js
```

### Step 4: Update Frontend API (2 minutes)

```bash
# Backup old API
cp client/src/api.js client/src/api_old.js

# Use new API with JWT authentication
cp client/src/api_v2.js client/src/api.js
```

### Step 5: Start & Test (1 minute)

```bash
# Start server
npm run dev:server
```

**Expected output:**
```
✅ Connected to PostgreSQL database
✅ Database connection test successful
   Database: stockstewardai
   Server time: 2026-02-14...
✅ EMR API v2.0 listening on http://localhost:4000
   Environment: development
   Database: PostgreSQL
   Authentication: JWT
```

**Test in browser or curl:**
```bash
# Health check
curl http://localhost:4000/api/health

# Login
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "superadmin",
    "email": "superadmin@emr.local",
    "password": "Admin@123"
  }'
```

---

## 🔐 Your Test Credentials

### Superadmin (Full System Access)
```
Tenant: superadmin
Email: superadmin@emr.local
Password: Admin@123
```

### Tenant Admin (Selva Care Hospital)
```
Email: anita@sch.local
Password: Anita@123
```

### Doctor
```
Email: rajesh@sch.local
Password: Rajesh@123
```

### Nurse
```
Email: priya@sch.local
Password: Priya@123
```

### Patient
```
Email: meena@sch.local
Password: Meena@123
```

---

## 📊 What's in Your Database Now?

After setup, your Neon database will have:

**Schema:** `emr` (alongside any existing schemas)

**Tables (15 total):**
- ✅ emr.tenants - Tenant/hospital management
- ✅ emr.users - User accounts with hashed passwords
- ✅ emr.sessions - JWT session management
- ✅ emr.patients - Patient records
- ✅ emr.clinical_records - Medical history, prescriptions, etc.
- ✅ emr.walkins - Walk-in registrations
- ✅ emr.appointments - Appointment scheduling
- ✅ emr.encounters - EMR encounters
- ✅ emr.prescriptions - Prescriptions
- ✅ emr.invoices - Billing
- ✅ emr.invoice_items - Invoice line items
- ✅ emr.inventory_items - Inventory management
- ✅ emr.inventory_transactions - Inventory history
- ✅ emr.employees - HR management
- ✅ emr.employee_leaves - Leave management
- ✅ emr.audit_logs - Audit trail

**Sample Data:**
- 1 Superadmin user
- 1 Tenant (Selva Care Hospital)
- 5 Users (Admin, Doctor, Nurse, Front Office, Patient)
- 1 Sample patient
- 3 Sample employees
- 5 Sample inventory items

---

## ✅ Verification Checklist

After running the setup script, verify:

- [ ] Script completes without errors
- [ ] Shows "✅ EMR schema created successfully"
- [ ] Shows "✅ Initial data loaded successfully"
- [ ] Shows 15 tables created
- [ ] Server starts without errors
- [ ] Health endpoint returns OK: `curl http://localhost:4000/api/health`
- [ ] Login returns JWT token

---

## 🔧 Troubleshooting

### Issue: "Connection failed"
**Check:**
```bash
# Verify .env file exists
cat .env

# Check DATABASE_URL is correct
# Should start with: postgresql://neondb_owner:...
```

### Issue: "Schema already exists"
**This is OK!** The script will detect existing schema and not recreate it.

Run with option to keep existing:
```bash
node scripts/setup_neon_db.js keep
```

### Issue: "bcryptjs not found"
```bash
npm install bcryptjs jsonwebtoken --save
```

### Issue: "Cannot find module './db/connection.js'"
**Make sure you're in the project root:**
```bash
cd D:\Training\working\EMR-Application
node scripts/setup_neon_db.js
```

---

## 📝 Important Notes

### About Your Database:
- ✅ Your existing `stockstewardai` database is used
- ✅ EMR uses a separate `emr` schema (won't affect other data)
- ✅ If you have other schemas/tables, they're safe
- ✅ Connection uses pooling for performance
- ✅ SSL is enabled (required by Neon)

### About Security:
- ✅ All passwords are hashed with bcrypt
- ✅ JWT tokens expire after 7 days
- ✅ Change JWT_SECRET in production
- ✅ Change default passwords after first login

### About Data:
- ✅ Test data is separate from your real data
- ✅ Delete test data before production
- ✅ Or create a new tenant for real use

---

## 🚀 Next Steps

1. **Run setup script:**
   ```bash
   node scripts/setup_neon_db.js
   ```

2. **Start server:**
   ```bash
   npm run dev:server
   ```

3. **Start frontend:**
   ```bash
   npm run dev:client
   ```

4. **Login:**
   - Open: http://localhost:5173
   - Tenant: `superadmin`
   - Email: `superadmin@emr.local`
   - Password: `Admin@123`

5. **Test all features!**

---

## 💡 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review `.env` file (DATABASE_URL should be your Neon URL)
3. Make sure you're in the project root directory
4. Check that dependencies are installed: `npm list bcryptjs jsonwebtoken`

---

**You're ready to go! Run the setup script to get started.** 🎉

```bash
node scripts/setup_neon_db.js
```
