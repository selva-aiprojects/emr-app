# 🔑 **EMR Application - Demo Login Credentials**

## 🛡️ **Superadmin Access**
**Platform Administration - Full System Control**

| Field | Value |
|-------|-------|
| **Tenant** | Platform Superadmin |
| **Email** | superadmin@emr.local |
| **Password** | Admin@123 |
| **Role** | Superadmin |
| **Access** | All system features, tenant management, feature flags |

---

## 🏥 **Enterprise Tenant - Full Features**
**Complete EMR System - All Modules Enabled**

| Field | Value |
|-------|-------|
| **Tenant** | Enterprise Hospital Systems |
| **Email** | michael@enterprise.hos |
| **Password** | Test@123 |
| **Role** | Enterprise Administrator |
| **Subscription** | Enterprise Tier ⭐ |
| **Access** | **ALL FEATURES** - Dashboard, Patients, Appointments, EMR, Pharmacy, Inventory, HR, Accounts, Support, Reports |

---

## ⭐ **Professional Tenant - Mid-Tier Features**
**Professional Medical Center - Core + Support**

| Field | Value |
|-------|-------|
| **Tenant** | Professional Medical Center |
| **Email** | robert@professional.med |
| **Password** | Test@123 |
| **Role** | Professional Administrator |
| **Subscription** | Professional Tier |
| **Access** | Core EMR + Customer Support (8 modules) |

---

## 🩺 **Basic Tenant - Core Features**
**Basic Health Clinic - Essential EMR Only**

| Field | Value |
|-------|-------|
| **Tenant** | Basic Health Clinic |
| **Email** | sarah@basic.health |
| **Password** | Test@123 |
| **Role** | Basic Administrator |
| **Subscription** | Basic Tier |
| **Access** | Core EMR features only (7 modules) |

---

## 🎭 **Additional User Roles (Enterprise Tenant)**
**Multi-Role Testing Environment**

### 👨‍⚕️ **Doctor Role**
| Field | Value |
|-------|-------|
| **Tenant** | Enterprise Hospital Systems |
| **Email** | doctor@enterprise.hos |
| **Password** | Test@123 |
| **Role** | Doctor |
| **Access** | Clinical modules only |

### 👩‍⚕️ **Nurse Role**
| Field | Value |
|-------|-------|
| **Tenant** | Enterprise Hospital Systems |
| **Email** | nurse@enterprise.hos |
| **Password** | Test@123 |
| **Role** | Nurse |
| **Access** | Patient care modules |

### 💼 **Admin Role**
| Field | Value |
|-------|-------|
| **Tenant** | Enterprise Hospital Systems |
| **Email** | admin@enterprise.hos |
| **Password** | Test@123 |
| **Role** | Administrator |
| **Access** | All modules including HR/Accounts |

---

## 📊 **Feature Access by Subscription Tier**

| Module/Tenant | Basic (BHC) | Professional (PMC) | Enterprise (EHS) |
|---------------|-------------|-------------------|-----------------|
| Dashboard | ✅ | ✅ | ✅ |
| Patients | ✅ | ✅ | ✅ |
| Appointments | ✅ | ✅ | ✅ |
| EMR | ✅ | ✅ | ✅ |
| Pharmacy | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ |
| Support | ❌ | ✅ | ✅ |
| Employees (HR) | ❌ | ❌ | ✅ |
| Accounts | ❌ | ❌ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |

---

## 🚀 **Quick Login Steps**

### **1. Access the Application**
```
URL: http://localhost:5175
```

### **2. Select Tenant**
Choose from dropdown:
- Platform Superadmin
- Enterprise Hospital Systems
- Professional Medical Center  
- Basic Health Clinic

### **3. Use Demo Credentials**
Click "🎭 Demo Credentials" button to auto-fill login details

### **4. Sign In**
Click "Sign In" to access the system

---

## 🎯 **Testing Scenarios**

### **🛡️ Superadmin Testing**
- **Purpose**: System administration, tenant management
- **Features**: Kill switches, tenant settings, feature flags
- **URL**: After login → Superadmin section

### **🏥 Enterprise Testing**
- **Purpose**: Full EMR functionality validation
- **Features**: All modules, complete workflow testing
- **Best for**: Comprehensive feature testing

### **⭐ Professional Testing**
- **Purpose**: Mid-tier feature validation
- **Features**: Core EMR + Customer Support
- **Best for**: Tier comparison testing

### **🩺 Basic Testing**
- **Purpose**: Essential features validation
- **Features**: Core EMR only
- **Best for**: Minimum viable product testing

---

## 🔧 **API Testing Credentials**

### **Enterprise Token (Full Access)**
```bash
# Login to get token, then test:
curl -H "Authorization: Bearer <enterprise-token>" http://localhost:4000/api/employees
curl -H "Authorization: Bearer <enterprise-token>" http://localhost:4000/api/accounts
curl -H "Authorization: Bearer <enterprise-token>" http://localhost:4000/api/support
```

### **Basic Token (Limited Access)**
```bash
# Should return 403 for HR/Accounts:
curl -H "Authorization: Bearer <basic-token>" http://localhost:4000/api/employees
curl -H "Authorization: Bearer <basic-token>" http://localhost:4000/api/accounts
```

---

## 📱 **Mobile Testing**

All credentials work on mobile devices:
- Responsive design tested
- Touch-friendly interface
- Full feature access on mobile

---

## 🆘 **Troubleshooting**

### **Login Issues**
1. **Check tenant selection** - Must match exactly
2. **Verify email spelling** - Case-sensitive
3. **Password accuracy** - Copy/paste recommended
4. **Browser cache** - Clear if needed

### **Feature Access Issues**
1. **Subscription tier** - Check tenant subscription level
2. **Kill switches** - Superadmin can disable features
3. **User permissions** - Role-based access control

### **Performance Issues**
1. **Network connection** - Check internet connectivity
2. **Server status** - Verify backend is running
3. **Browser compatibility** - Use modern browser

---

## 📞 **Support Information**

### **System Requirements**
- **Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **Internet**: Stable connection required
- **Screen**: Minimum 1024x768 resolution

### **Best Practices**
- **Use Enterprise tenant** for full feature testing
- **Test all tiers** for subscription validation
- **Document issues** with screenshots
- **Clear cache** between tier switches

---

**🎯 Use Enterprise Hospital Systems (EHS) for complete feature validation!**

**🛡️ Use Superadmin for system administration testing**

**📊 Use all tiers for subscription comparison testing**
