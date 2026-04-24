# 🚀 Pharmacy Module - Quick Setup Guide

## Summary

I've created the pharmacy service code, but **you need to run the database migrations first** before the service can work.

---

## What You Need to Do (3 Simple Steps)

### Step 1: Run Database Migrations

Choose ONE of these methods:

#### Method A: Using PowerShell Script (Recommended for Windows)

```powershell
# Open PowerShell in project root
cd d:\Training\working\EMR-Application

# Run the setup script
.\scripts\setup_pharmacy_module.ps1
```

#### Method B: Manual Execution

```powershell
# Navigate to project root
cd d:\Training\working\EMR-Application

# Run each migration in order
psql -U postgres -d emr_db -f database\migrations\005_fhir_compliance.sql
psql -U postgres -d emr_db -f database\migrations\006_pharmacy_module.sql
psql -U postgres -d emr_db -f database\pharmacy\seed_pharmacy_sample.sql
```

**Note**: Replace `postgres` with your actual PostgreSQL username if different.

#### Method C: Using pgAdmin/DBeaver

1. Open your database tool
2. Connect to `emr_db`
3. Open and execute each SQL file in order:
   - `database/migrations/005_fhir_compliance.sql`
   - `database/migrations/006_pharmacy_module.sql`
   - `database/pharmacy/seed_pharmacy_sample.sql`

---

### Step 2: Install Pharmacy Service Dependencies

```bash
cd pharmacy-service
npm install
```

---

### Step 3: Start Pharmacy Service

```bash
# Terminal 1 - Main EMR app
npm run dev

# Terminal 2 - Pharmacy service
cd pharmacy-service
npm run dev
```

The pharmacy service will start on**port 4001**.

---

## ✅ Verify Installation

After running migrations, check if tables were created:

```sql
-- Connect to your database
psql -U postgres -d emr_db

-- List new tables
\dt emr.*

-- Should see these new tables:
-- - drug_master
-- - drug_interactions
-- - drug_allergies
-- - drug_batches
-- - pharmacy_inventory
-- - prescriptions
-- - prescription_items
-- - conditions
-- - procedures
-- - observations
-- - diagnostic_reports
-- etc.
```

Or use the verification query:

```sql
SELECT 
  'drug_master' as table_name, COUNT(*) as row_count FROM emr.drug_master
UNION ALL
SELECT 'drug_interactions', COUNT(*) FROM emr.drug_interactions
UNION ALL
SELECT 'drug_batches', COUNT(*) FROM emr.drug_batches;
```

Expected output after setup:
```
table_name        | row_count
------------------+-----------
drug_master       |        26
drug_interactions |         4
drug_batches      |        50
```

---

## 📋 Files Created

### Code Files (Ready to Use)
```
pharmacy-service/
├── src/
│   ├── services/
│   │   └── pharmacy.service.js          (685 lines)
│   ├── controllers/
│   │   └── pharmacy.controller.js       (437 lines)
│   ├── routes/
│   │   └── pharmacy.routes.js           (57 lines)
│   └── index.js                         (79 lines)
├── package.json                         (38 lines)
└── TESTING_GUIDE.md                     (504 lines)
```

### Database Files (Need to Execute)
```
database/
├── migrations/
│   ├── 005_fhir_compliance.sql          (392 lines)
│   └── 006_pharmacy_module.sql          (600 lines)
└── pharmacy/
    └── seed_pharmacy_sample.sql         (170 lines)
```

### Setup Scripts (Helper Tools)
```
scripts/
├── setup_pharmacy_module.sh             (Bash version)
└── setup_pharmacy_module.ps1            (PowerShell version - for Windows)
```

---

## 🎯 What This Does

Once set up, you'll have:

✅ **Drug Catalog** - 26 common medications loaded  
✅ **Safety Checking** - Drug interactions, allergies, duplicate therapy  
✅ **Inventory Management** - Batch tracking, FEFO dispensing  
✅ **8 REST API Endpoints** - Ready for integration  
✅ **Sample Data** - Pre-loaded for testing  

---

## 🆘 Troubleshooting

### Error: "psql: command not found"

**Solution**: Add PostgreSQL to your PATH or use full path:

```powershell
# Typical PostgreSQL path on Windows
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d emr_db -f database\migrations\005_fhir_compliance.sql
```

### Error: "database does not exist"

**Solution**: Create the database first:

```sql
CREATE DATABASE emr_db;
```

### Error: "permission denied"

**Solution**: Use a user with proper permissions or grant permissions:

```sql
GRANT ALL PRIVILEGES ON SCHEMA emr TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA emr TO your_username;
```

### Migration fails on existing tables

**Solution**: The migrations use `IF NOT EXISTS` so they're idempotent. If you encounter issues, you can:

1. Drop and recreate specific tables
2. Or drop entire schema and start fresh (⚠️ WARNING: This deletes all data!)

```sql
-- Only if you want to completely reset!
DROP SCHEMA emr CASCADE;
CREATE SCHEMA emr;
```

---

## 📞 Next Steps After Setup

1. ✅ Run migrations (Step 1 above)
2. ✅ Install dependencies (Step 2)
3. ✅ Start pharmacy service (Step 3)
4. 📖 Follow [TESTING_GUIDE.md](pharmacy-service/TESTING_GUIDE.md) for API testing
5. 🧪 Test endpoints using Postman or the provided test script

---

**Questions?** Check the comprehensive guides:
- [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) - Full technical documentation
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - How to test the pharmacy service
- [PROGRESS_WAVE2_PHARMACY.md](../PROGRESS_WAVE2_PHARMACY.md) - Feature overview
