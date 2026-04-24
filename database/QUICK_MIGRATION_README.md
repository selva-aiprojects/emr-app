# 🚀 Complete Migration: Public to EMR Schema

## 📋 Overview

This complete migration system will:
1. **Analyze** your current database state
2. **Migrate** all tables from `public` to `emr` schema
3. **Test** all critical functionality
4. **Provide** application testing instructions

## 🎯 Quick Start

### **Option 1: Automated Script (Recommended)**
```bash
# Make the script executable
chmod +x database/run_complete_migration.sh

# Run the complete migration
./database/run_complete_migration.sh
```

### **Option 2: Manual Steps**
```bash
# Step 1: Run migration workflow
psql $DATABASE_URL -f database/complete_migration_workflow.sql

# Step 2: Run test suite
psql $DATABASE_URL -f database/application_test_suite.sql

# Step 3: Test application manually
```

## 📊 What the Migration Does

### **Phase 1: Analysis**
- ✅ Identifies all tables in `public` schema
- ✅ Counts rows and columns in each table
- ✅ Prioritizes tables with data first
- ✅ Checks for existing tables in `emr` schema

### **Phase 2: Migration**
- ✅ Moves tables from `public` to `emr` schema
- ✅ Handles duplicates by merging data
- ✅ Logs all migration activities
- ✅ Preserves all data and relationships

### **Phase 3: Verification**
- ✅ Verifies all tables moved successfully
- ✅ Tests database connectivity
- ✅ Tests core table access
- ✅ Tests application queries

## 🧪 Post-Migration Testing

### **Database Tests (Automatic)**
- Database connectivity
- Core table access (tenants, users, patients, appointments, encounters)
- User authentication queries
- Tenant functionality
- Appointment system
- Billing system
- Foreign key constraints

### **Application Tests (Manual)**
After migration, test these features:

1. **Login System**
   - Try login with existing credentials
   - Test different user roles

2. **Dashboard**
   - Load dashboard successfully
   - View metrics and counts

3. **Patient Management**
   - View patient list
   - Create new patient
   - Edit existing patient

4. **Appointments**
   - View appointment list
   - Schedule new appointment
   - Check calendar view

5. **Billing**
   - View invoices
   - Create new invoice
   - Check payment status

6. **Pharmacy**
   - View medication list
   - Check inventory
   - Process prescriptions

7. **User Management**
   - View user list
   - Create new user
   - Assign roles

## 🔍 Troubleshooting

### **Check Migration Status**
```sql
-- See migration results
SELECT * FROM emr.migration_log ORDER BY migration_time DESC;

-- See test results
SELECT * FROM emr.test_results ORDER BY test_time;
```

### **Common Issues**

#### **Issue: Table Access Failed**
```sql
-- Check if table exists in emr
SELECT tablename FROM pg_tables WHERE schemaname = 'emr';

-- Check table structure
\d emr.table_name
```

#### **Issue: Login Failed**
```sql
-- Check users table
SELECT COUNT(*) FROM emr.users WHERE is_active = true;

-- Check tenants table
SELECT COUNT(*) FROM emr.tenants WHERE status = 'active';
```

#### **Issue: Data Missing**
```sql
-- Compare row counts before/after
SELECT table_name, rows_moved FROM emr.migration_log WHERE status = 'MOVED';
```

### **Rollback (If Needed)**
```sql
-- Emergency rollback for specific table
ALTER TABLE emr.table_name SET SCHEMA public;

-- Check migration log for errors
SELECT table_name, error_message FROM emr.migration_log WHERE status LIKE '%_FAILED';
```

## ✅ Success Indicators

### **Migration Success**
- [ ] No tables remain in `public` schema (except system tables)
- [ ] All tables exist in `emr` schema
- [ ] Migration log shows all 'MOVED' or 'MERGED'
- [ ] No error messages in migration log

### **Application Success**
- [ ] Application starts without errors
- [ ] Login works correctly
- [ ] Dashboard loads successfully
- [ ] All modules function properly
- [ ] No database errors in console

## 🎯 Final Verification

After migration and testing:

1. **Check Schema Cleanliness**
```sql
SELECT schemaname, COUNT(*) FROM pg_tables 
WHERE schemaname IN ('public', 'emr')
AND tablename NOT LIKE 'pg_%'
GROUP BY schemaname;
```

2. **Verify Data Integrity**
```sql
-- Check key tables have data
SELECT 
    'tenants' as table_name, COUNT(*) as row_count FROM emr.tenants
UNION ALL
SELECT 
    'users', COUNT(*) FROM emr.users
UNION ALL
SELECT 
    'patients', COUNT(*) FROM emr.patients;
```

3. **Test Application Flow**
- Complete end-to-end user journey
- Verify all features work as expected
- Check for any console errors

## 📞 Need Help?

If you encounter issues:
1. Check migration logs: `SELECT * FROM emr.migration_log;`
2. Check test results: `SELECT * FROM emr.test_results;`
3. Review error messages carefully
4. Test incrementally - one feature at a time

## 🏁 Ready for Supabase

Once migration is complete and tested:
- All data is in `emr` schema
- Application works correctly
- Ready for Supabase dump:
```bash
pg_dump $DATABASE_URL --schema=emr --no-owner --clean > emr_for_supabase.sql
```
