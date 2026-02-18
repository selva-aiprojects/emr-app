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
| **Email** | admin@ehs.local |
| **Password** | Test@123 |
| **Role** | Admin |
| **Subscription** | Enterprise Tier ⭐ |
| **Access** | **ALL FEATURES** - Dashboard, Patients, Appointments, EMR, Pharmacy, Inventory, HR, Accounts, Support, Reports |

---

## 🎭 **Additional User Roles (Enterprise Tenant)**
**Multi-Role Testing Environment (Tenant: EHS)**

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@ehs.local` | `Test@123` | Clinical records, PHI access |
| **Nurse** | `nurse@ehs.local` | `Test@123` | Patient care, limited PHI |
| **Support Staff**| `support@ehs.local` | `Test@123` | Facility maintenance, masked PHI |
| **Operations** | `ops@ehs.local` | `Test@123` | Operational overview, masked PHI |
| **HR** | `hr@ehs.local` | `Test@123` | Employee records, salary, masked PHI |
| **Accounts** | `accounts@ehs.local`| `Test@123` | Billing, expenses, masked PHI |
| **Pharmacy** | `pharmacy@ehs.local`| `Test@123` | Prescriptions, masked PHI |
| **Lab** | `lab@ehs.local` | `Test@123` | Test results, masked PHI |
| **Insurance** | `insurance@ehs.local`| `Test@123` | Claims, masked PHI |
| **Management** | `management@ehs.local`| `Test@123` | Analytics, masked PHI |

---

## 🚀 **Quick Login Steps**

### **1. Access the Application**
```
URL: http://localhost:5174
```

### **2. Select Tenant**
Choose from dropdown:
- **Platform Superadmin** (use superadmin credentials)
- **Enterprise Hospital Systems** (use EHS credentials)

### **3. Sign In**
Enter the email and password provided above.

---

## 🔧 **API Testing Credentials**

### **Login to get token, then test:**
```bash
# Example for HR data access (Enterprise Token)
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/employees
```

---

## 🆘 **Troubleshooting**

1. **Check tenant selection** - Must match exactly in the dropdown.
2. **Verify email spelling** - Ensure no trailing spaces.
3. **Server status** - Verify backend (port 4000) and frontend (port 5174) are running.

---

**🎯 Use Enterprise Hospital Systems (EHS) for complete feature validation!**

**🛡️ Use Superadmin for system administration testing**
