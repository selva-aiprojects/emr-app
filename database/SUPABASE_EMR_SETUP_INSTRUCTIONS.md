# Supabase EMR Custom Schema Setup Instructions

## 🎯 **Why Use Custom EMR Schema?**

### **✅ Benefits of Custom Schema**
- **🏥 Healthcare-Specific**: Dedicated EMR schema for better organization
- **🔒 Enhanced Security**: Clear separation from other data
- **📊 Professional Structure**: Industry best practice
- **🚀 Scalability**: Easy to add new modules
- **🛡️ Compliance Ready**: Easier to audit and secure

### **📋 Schema Structure**
```
🗄️ Database Structure:
├── 🏥 emr.tenants
├── 👥 emr.users
├── 📋 emr.patients
├── 🏢 emr.departments
├── 👨‍⚕️ emr.employees
├── 📅 emr.appointments
├── 🩺 emr.encounters
├── 💰 emr.invoices
├── 📦 emr.inventory
├── 🛎️ emr.services
└── 📄 emr.fhir_resources
```

## 🚀 **Quick Setup Guide**

### **Step 1: Access Supabase SQL Editor**
1. Go to: https://supabase.com/dashboard/project/vfmnjnwcorlqwxqdklfi/sql
2. Make sure you're in the correct project: `vfmnjnwcorlqwxqdklfi`
3. Click on "SQL Editor" in the left sidebar

### **Step 2: Run EMR Schema Setup**
1. Copy the contents of `supabase_emr_schema_setup.sql`
2. Paste it into the SQL Editor
3. Click "Run" or press Ctrl+Enter
4. Wait for the script to complete (should show success message)

### **Step 3: Run Sample Data Script**
1. Copy the contents of `supabase_emr_seed_data.sql`
2. Paste it into the SQL Editor
3. Click "Run" or press Ctrl+Enter
4. Wait for the script to complete

### **Step 4: Verify Setup**
1. In the SQL Editor, run: `SELECT COUNT(*) FROM emr.tenants;`
2. Should return: 1 (demo tenant)
3. Run: `SELECT COUNT(*) FROM emr.patients;`
4. Should return: 8 (sample patients)

## 📋 **Connection String Update**

### **Updated Connection String**
```bash
# Add schema parameter to connection string
DATABASE_URL="postgres://postgres:hms-app%402020@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30&schema=emr"
```

### **For Northflank Deployment**
Update the environment variable in `northflank-final-deployment.yaml`:
```yaml
environment:
  - key: DATABASE_URL
    value: postgres://postgres:hms-app%402020@vfmnjnwcorlqwxqdklfi.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30&schema=emr
```

## 📊 **What Gets Created**

### **EMR Schema Tables (12 total)**
- ✅ `emr.tenants` - Multi-tenant management
- ✅ `emr.users` - User accounts
- ✅ `emr.patients` - Patient records
- ✅ `emr.departments` - Hospital departments
- ✅ `emr.employees` - Staff members
- ✅ `emr.appointments` - Patient appointments
- ✅ `emr.encounters` - Medical visits/encounters
- ✅ `emr.invoices` - Billing and invoices
- ✅ `emr.inventory` - Medical supplies
- ✅ `emr.services` - Service catalog
- ✅ `emr.fhir_resources` - FHIR data storage

### **Security Features**
- ✅ **Custom EMR schema** isolation
- ✅ **Row Level Security (RLS)** on all tables
- ✅ **Tenant isolation** - users can only see their tenant's data
- ✅ **Indexing** for performance optimization
- ✅ **Triggers** for automatic timestamp updates

### **Sample Data**
- ✅ **1 Demo Tenant**: "Demo Hospital"
- ✅ **4 Sample Users**: Admin, Doctor, Nurse, Reception
- ✅ **6 Sample Employees**: Various roles and departments
- ✅ **8 Sample Patients**: With complete demographics
- ✅ **8 Sample Appointments**: Various statuses
- ✅ **5 Sample Encounters**: Medical visit records
- ✅ **8 Sample Inventory Items**: Medical supplies
- ✅ **5 Sample Invoices**: Billing records
- ✅ **6 Sample Services**: Service catalog

## 🔑 **Default Login Credentials**

After running the seed script, you can use these credentials to test the EMR:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | doctor@hospital.com | doctor123 |
| Nurse | nurse@hospital.com | nurse123 |
| Reception | reception@hospital.com | reception123 |

## 🛠️ **Prisma Configuration**

### **Updated Prisma Schema**
The `prisma/schema.prisma` now includes:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schema   = "emr"
}
```

### **Generate Prisma Client**
After setting up the database, run:
```bash
npx prisma generate
```

## 🎯 **Verification Queries**

### **Check EMR Schema**
```sql
-- List all EMR tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'emr' 
ORDER BY table_name;

-- Check sample data
SELECT 'tenants' as table_name, COUNT(*) as count FROM emr.tenants
UNION ALL
SELECT 'users', COUNT(*) FROM emr.users
UNION ALL
SELECT 'patients', COUNT(*) FROM emr.patients
UNION ALL
SELECT 'appointments', COUNT(*) FROM emr.appointments;
```

### **Test Schema Access**
```sql
-- Test accessing EMR schema tables
SELECT * FROM emr.tenants LIMIT 5;
SELECT * FROM emr.patients LIMIT 5;
SELECT * FROM emr.services LIMIT 5;
```

## 🔄 **Migration from Public Schema**

If you previously used the public schema:

1. **Backup existing data** (if any)
2. **Run EMR schema setup** (creates new schema)
3. **Update connection string** to include `&schema=emr`
4. **Regenerate Prisma client** with new schema
5. **Test all functionality**

## 📞 **Troubleshooting**

### **Common Issues**
- **Schema not found**: Ensure the EMR schema setup script ran successfully
- **Permission denied**: Check RLS policies and user permissions
- **Connection issues**: Verify connection string includes `&schema=emr`

### **Helpful Queries**
```sql
-- Check if EMR schema exists
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name = 'emr';

-- Check current search path
SHOW search_path;

-- Set default schema to EMR
SET search_path TO emr, public;
```

## ✅ **Success Checklist**

- [ ] EMR schema setup script completed successfully
- [ ] Sample data script completed successfully
- [ ] All EMR tables created (12 total)
- [ ] Sample data inserted (verified counts)
- [ ] Connection string updated with `&schema=emr`
- [ ] Prisma schema updated with custom schema
- [ ] Prisma client regenerated
- [ ] Default login credentials work
- [ ] Ready for Northflank deployment

---

## 🎉 **Ready for Production!**

Your EMR application now has:

- ✅ **Professional custom schema** structure
- ✅ **Healthcare-specific organization**
- ✅ **Enhanced security and compliance**
- ✅ **Complete sample data** for testing
- ✅ **Production-ready database** structure

**The custom EMR schema provides the professional foundation your healthcare application needs!** 🚀
