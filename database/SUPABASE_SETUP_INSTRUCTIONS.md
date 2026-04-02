# Supabase Database Setup Instructions

## 🚀 Quick Setup Guide

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/vfmnjnwcorlqwxqdklfi/sql
2. Make sure you're in the correct project: `vfmnjnwcorlqwxqdklfi`
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run Main Setup Script
1. Copy the contents of `supabase_complete_setup.sql`
2. Paste it into the SQL Editor
3. Click "Run" or press Ctrl+Enter
4. Wait for the script to complete (should show success message)

### Step 3: Run Sample Data Script
1. Copy the contents of `supabase_seed_data.sql`
2. Paste it into the SQL Editor
3. Click "Run" or press Ctrl+Enter
4. Wait for the script to complete

### Step 4: Verify Setup
1. In the SQL Editor, run: `SELECT COUNT(*) FROM tenants;`
2. Should return: 1 (demo tenant)
3. Run: `SELECT COUNT(*) FROM patients;`
4. Should return: 8 (sample patients)

## 📋 What Gets Created

### Database Tables (12 total)
- ✅ `tenants` - Multi-tenant management
- ✅ `users` - User accounts
- ✅ `patients` - Patient records
- ✅ `departments` - Hospital departments
- ✅ `employees` - Staff members
- ✅ `appointments` - Patient appointments
- ✅ `encounters` - Medical visits/encounters
- ✅ `invoices` - Billing and invoices
- ✅ `inventory` - Medical supplies
- ✅ `services` - Service catalog
- ✅ `fhir_resources` - FHIR data storage

### Security Features
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Tenant isolation** - users can only see their tenant's data
- ✅ **Indexing** for performance optimization
- ✅ **Triggers** for automatic timestamp updates

### Sample Data
- ✅ **1 Demo Tenant**: "Demo Hospital"
- ✅ **4 Sample Users**: Admin, Doctor, Nurse, Reception
- ✅ **6 Sample Employees**: Various roles and departments
- ✅ **8 Sample Patients**: With complete demographics
- ✅ **8 Sample Appointments**: Various statuses
- ✅ **5 Sample Encounters**: Medical visit records
- ✅ **8 Sample Inventory Items**: Medical supplies
- ✅ **5 Sample Invoices**: Billing records
- ✅ **6 Sample Services**: Service catalog

## 🔑 Default Login Credentials

After running the seed script, you can use these credentials to test the EMR:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | doctor@hospital.com | doctor123 |
| Nurse | nurse@hospital.com | nurse123 |
| Reception | reception@hospital.com | reception123 |

## 🛠️ Troubleshooting

### If Script Fails
1. **Check permissions**: Make sure you have admin rights
2. **Run step by step**: Run smaller sections individually
3. **Check for existing tables**: Drop and recreate if needed

### Common Issues
- **Permission denied**: Ensure you're logged in as admin
- **Table exists**: Run `DROP TABLE IF EXISTS table_name;` first
- **Syntax errors**: Check for copy-paste issues

### Verification Queries
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check sample data
SELECT 'tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'patients', COUNT(*) FROM patients
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments;

-- Test RLS policies
SELECT current_user, auth.jwt() ->> 'tenant_id' as tenant_id;
```

## 🎯 Next Steps

After database setup is complete:

1. **Deploy to Northflank** using the configuration files
2. **Test the application** with sample data
3. **Verify all features** work correctly
4. **Add your own data** as needed

## 📞 Support

If you encounter any issues:

1. **Check the Supabase logs** in the dashboard
2. **Verify connection string** matches your project
3. **Ensure all scripts ran successfully**
4. **Test with sample credentials** provided

---

## ✅ Success Checklist

- [ ] Main setup script completed successfully
- [ ] Sample data script completed successfully
- [ ] All tables created (12 total)
- [ ] Sample data inserted (verified counts)
- [ ] Default login credentials work
- [ ] Ready for Northflank deployment

**Your Supabase database is now ready for the EMR application!** 🚀
