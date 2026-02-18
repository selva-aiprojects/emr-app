# 🏥 **Tenant Structure & Integration Testing Guide**

## 🎯 **Tenant with ALL Features**

### **🏢 Enterprise Hospital Systems (EHS)**
**This is the ONLY tenant with complete feature access**

#### **🔑 Primary Login (Full Access)**
- **Tenant**: Enterprise Hospital Systems
- **Email**: `michael@enterprise.hos`
- **Password**: `Test@123`
- **Role**: Enterprise Administrator
- **Subscription**: Enterprise Tier ⭐
- **Features**: **ALL MODULES ENABLED**

#### **👥 Additional Users (Same EHS Tenant)**
- **Doctor**: `doctor@enterprise.hos` / `Test@123`
- **Nurse**: `nurse@enterprise.hos` / `Test@123`
- **Admin**: `admin@enterprise.hos` / `Test@123`

---

## 📊 **Complete Feature Breakdown - Enterprise Tier**

### **🎯 Core EMR Features** (Available in all tiers)
- ✅ **Dashboard** - Analytics and system overview
- ✅ **Patients** - Patient registration and management
- ✅ **Appointments** - Scheduling and calendar
- ✅ **EMR** - Electronic Medical Records
- ✅ **Pharmacy** - Medication management
- ✅ **Inventory** - Medical supplies tracking
- ✅ **Reports** - Financial and clinical reports

### **🏢 Enterprise-Exclusive Features** (EHS ONLY)
- ✅ **HR & Payroll** - Employee management and payroll
- ✅ **Accounts** - Financial accounting system
- ✅ **Customer Support** - Help desk and ticketing
- ✅ **Advanced Analytics** - Enterprise-level reporting
- ✅ **Multi-Location Support** - Multiple facility management
- ✅ **Advanced Security** - Enhanced permission controls
- ✅ **API Access** - Full API integration capabilities
- ✅ **Custom Workflows** - Tailored business processes
- ✅ **Audit Trails** - Complete compliance tracking
- ✅ **Data Exports** - Full data extraction tools

---

## 🧪 **Integration Testing Plan**

### **Phase 1: Authentication & Access Control**

#### **1.1 Login Validation**
```bash
# Test Enterprise login (should succeed)
POST /api/login
{
  "tenantId": "EHS",
  "email": "michael@enterprise.hos", 
  "password": "Test@123"
}

# Expected Response:
{
  "token": "jwt_token_here",
  "user": { "id": "...", "name": "Michael", "role": "Enterprise Administrator" },
  "tenantId": "EHS",
  "role": "Enterprise Administrator"
}
```

#### **1.2 Feature Flag Validation**
```bash
# Check Enterprise tenant features
GET /api/tenants/EHS/features
Authorization: Bearer <enterprise_token>

# Expected: All feature flags enabled
{
  "features": {
    "permission-core_engine-access": true,
    "permission-hr_payroll-access": true,
    "permission-accounts-access": true,
    "permission-customer_support-access": true
  }
}
```

### **Phase 2: Module Access Testing**

#### **2.1 Core EMR Modules** (Should work for all tiers)
```bash
# Test all core modules (should return 200)
GET /api/dashboard
GET /api/patients
GET /api/appointments
GET /api/emr
GET /api/pharmacy
GET /api/inventory
GET /api/reports
```

#### **2.2 Enterprise-Exclusive Modules** (EHS ONLY)
```bash
# Test enterprise modules (should return 200 for EHS, 403 for others)
GET /api/employees        # HR & Payroll
GET /api/accounts         # Financial Accounting
GET /api/support          # Customer Support
```

### **Phase 3: Cross-Tier Comparison**

#### **3.1 Basic Tier (BHC) - Limited Access**
```bash
# Login as Basic tenant
POST /api/login
{
  "tenantId": "BHC",
  "email": "sarah@basic.health",
  "password": "Test@123"
}

# Test enterprise modules (should return 403)
GET /api/employees        # Expected: 403 Forbidden
GET /api/accounts         # Expected: 403 Forbidden
GET /api/support          # Expected: 403 Forbidden
```

#### **3.2 Professional Tier (PMC) - Mid-Tier Access**
```bash
# Login as Professional tenant
POST /api/login
{
  "tenantId": "PMC", 
  "email": "robert@professional.med",
  "password": "Test@123"
}

# Test modules
GET /api/support          # Expected: 200 OK
GET /api/employees        # Expected: 403 Forbidden
GET /api/accounts         # Expected: 403 Forbidden
```

---

## 🔧 **Integration Test Scripts**

### **Test Script 1: Full Enterprise Validation**
```javascript
// enterprise-full-test.js
const axios = require('axios');

async function testEnterpriseFullAccess() {
  try {
    // 1. Login as Enterprise user
    const loginResponse = await axios.post('http://localhost:4000/api/login', {
      tenantId: 'EHS',
      email: 'michael@enterprise.hos',
      password: 'Test@123'
    });
    
    const token = loginResponse.data.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    
    console.log('✅ Enterprise Login Success');
    
    // 2. Test all modules
    const modules = [
      '/api/dashboard',
      '/api/patients', 
      '/api/appointments',
      '/api/emr',
      '/api/pharmacy',
      '/api/inventory',
      '/api/reports',
      '/api/employees',      // Enterprise only
      '/api/accounts',        // Enterprise only
      '/api/support'          // Enterprise only
    ];
    
    for (const module of modules) {
      try {
        const response = await axios.get(`http://localhost:4000${module}`, {
          headers: authHeaders
        });
        console.log(`✅ ${module} - ${response.status}`);
      } catch (error) {
        console.log(`❌ ${module} - ${error.response?.status || 'Network Error'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

testEnterpriseFullAccess();
```

### **Test Script 2: Tier Comparison**
```javascript
// tier-comparison-test.js
const tenants = [
  { id: 'BHC', email: 'sarah@basic.health', name: 'Basic' },
  { id: 'PMC', email: 'robert@professional.med', name: 'Professional' },
  { id: 'EHS', email: 'michael@enterprise.hos', name: 'Enterprise' }
];

const enterpriseModules = ['/api/employees', '/api/accounts', '/api/support'];

async function testTierComparison() {
  for (const tenant of tenants) {
    console.log(`\n🧪 Testing ${tenant.name} Tenant...`);
    
    try {
      // Login
      const loginResponse = await axios.post('http://localhost:4000/api/login', {
        tenantId: tenant.id,
        email: tenant.email,
        password: 'Test@123'
      });
      
      const token = loginResponse.data.token;
      const authHeaders = { 'Authorization': `Bearer ${token}` };
      
      // Test enterprise modules
      for (const module of enterpriseModules) {
        try {
          const response = await axios.get(`http://localhost:4000${module}`, {
            headers: authHeaders
          });
          console.log(`✅ ${tenant.name} ${module} - ${response.status}`);
        } catch (error) {
          console.log(`❌ ${tenant.name} ${module} - ${error.response?.status}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ ${tenant.name} Login Failed:`, error.message);
    }
  }
}

testTierComparison();
```

---

## 🎯 **Expected Test Results**

### **Enterprise Hospital Systems (EHS)**
```
✅ /api/dashboard - 200
✅ /api/patients - 200
✅ /api/appointments - 200
✅ /api/emr - 200
✅ /api/pharmacy - 200
✅ /api/inventory - 200
✅ /api/reports - 200
✅ /api/employees - 200     (Enterprise only)
✅ /api/accounts - 200      (Enterprise only)
✅ /api/support - 200       (Enterprise only)
```

### **Basic Health Clinic (BHC)**
```
✅ /api/dashboard - 200
✅ /api/patients - 200
✅ /api/appointments - 200
✅ /api/emr - 200
✅ /api/pharmacy - 200
✅ /api/inventory - 200
✅ /api/reports - 200
❌ /api/employees - 403     (Enterprise only)
❌ /api/accounts - 403      (Enterprise only)
❌ /api/support - 403       (Enterprise only)
```

### **Professional Medical Center (PMC)**
```
✅ /api/dashboard - 200
✅ /api/patients - 200
✅ /api/appointments - 200
✅ /api/emr - 200
✅ /api/pharmacy - 200
✅ /api/inventory - 200
✅ /api/reports - 200
❌ /api/employees - 403     (Enterprise only)
❌ /api/accounts - 403      (Enterprise only)
✅ /api/support - 200       (Professional + Enterprise)
```

---

## 🚀 **Quick Integration Test**

### **Manual Testing Steps**
1. **Open Browser**: `http://localhost:5175`
2. **Login Enterprise**: Select "Enterprise Hospital Systems"
3. **Use Credentials**: `michael@enterprise.hos` / `Test@123`
4. **Validate Navigation**: All 10+ modules should be visible
5. **Test Each Module**: Click each module - should load without errors
6. **Test HR Module**: Employee management should work
7. **Test Accounts Module**: Financial features should work
8. **Test Support Module**: Ticket system should work

### **Automated Testing**
```bash
# Run the test scripts
node enterprise-full-test.js
node tier-comparison-test.js
```

---

## 📊 **Summary**

### **🏢 Enterprise Hospital Systems (EHS) = ALL FEATURES**
- **Primary User**: `michael@enterprise.hos` / `Test@123`
- **Additional Users**: doctor@, nurse@, admin@ (all same tenant)
- **Total Modules**: 10+ (all features enabled)
- **Best For**: Complete system validation and integration testing

**Use EHS tenant for comprehensive integration testing of all EMR features!** 🎯
