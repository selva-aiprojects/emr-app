# 🚀 Quick Migration Guide

## 📋 Step-by-Step Process

### **Step 1: Initial Analysis**
```bash
# Run the first migration (automatically selects safest table)
psql $DATABASE_URL -f start_first_migration.sql
```

### **Step 2: Test After Migration**
```bash
# Verify migration success and test functionality
psql $DATABASE_URL -f test_after_migration.sql
```

### **Step 3: Test Application**
- Start your application server
- Test basic functionality (login, dashboard, etc.)
- Verify the migrated table's features work

### **Step 4: Continue Migration**
```bash
# Migrate next table (replace with actual table name)
psql $DATABASE_URL -f migrate_next_table.sql -v table_name=your_table_name
```

### **Step 5: Repeat**
- Run test_after_migration.sql after each migration
- Test application functionality
- Continue until all tables are migrated

## 🎯 Migration Order (Recommended)

### **Low Risk (Start Here)**
1. `admin_settings`
2. `tenant_features` 
3. `global_kill_switches`
4. Configuration tables

### **Medium Risk**
5. `tenants`
6. `departments`
7. `roles`
8. `user_roles`

### **High Risk (Test Thoroughly)**
9. `users`
10. `patients`
11. `appointments`
12. `encounters`
13. `billing`
14. `pharmacy_*` tables

## ⚠️ Important Notes

### **Before Each Migration:**
- ✅ Check table exists in public
- ✅ Note row count
- ✅ Check if duplicate exists in emr

### **After Each Migration:**
- ✅ Verify table moved to emr
- ✅ Check row count preserved
- ✅ Test application features
- ✅ Check migration log

### **If Migration Fails:**
- 📋 Check migration log for errors
- 🔄 Run rollback if needed
- 🔧 Fix issues and retry

## 🛠️ Useful Commands

### **Check Migration Progress:**
```sql
SELECT * FROM emr.migration_log ORDER BY migration_time DESC;
```

### **See Remaining Tables:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%' ORDER BY tablename;
```

### **Check Schema Status:**
```sql
SELECT schemaname, COUNT(*) FROM pg_tables 
  WHERE schemaname IN ('public', 'emr')
  AND tablename NOT LIKE 'pg_%' GROUP BY schemaname;
```

## 🎯 Success Indicators

- ✅ Migration log shows 'MOVED' or 'MERGED'
- ✅ Table exists in emr schema with correct row count
- ✅ Table no longer exists in public schema
- ✅ Application features work correctly
- ✅ No error messages in logs

## 🔄 Troubleshooting

### **Common Issues:**
1. **Foreign Key Constraints**: Move dependent tables first
2. **Duplicate Data**: Use merge strategy instead of move
3. **Permission Errors**: Check database user permissions
4. **Connection Issues**: Verify DATABASE_URL

### **Quick Fixes:**
```sql
-- Check migration errors
SELECT table_name, error_message FROM emr.migration_log 
WHERE status LIKE '%_FAILED';

-- Rollback a specific table (if needed)
ALTER TABLE emr.table_name SET SCHEMA public;
```

## 🏁 Completion Checklist

When all tables are migrated:
- [ ] No data tables remain in public schema
- [ ] All tables exist in emr schema
- [ ] Application works correctly
- [ ] Migration log shows all successful
- [ ] Ready for Supabase dump

## 📞 Need Help?

- Check migration logs for errors
- Review table dependencies
- Test incrementally
- Keep backups handy
