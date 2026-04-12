# 🎭 EMR Feature Flag System - Testing Guide

## 🔑 **Superadmin Credentials**
- **Tenant**: `superadmin`
- **Email**: `superadmin@emr.local`
- **Password**: `Admin@123`

## 🏥 **Test Tenants & Credentials**

### 🩺 **Basic Health Clinic** (Basic Tier)
- **Tenant**: `BHC`
- **Email**: `sarah@basic.health`
- **Password**: `Test@123`
- **Expected Features**: Core EMR only
- **Navigation**: Dashboard, Patients, Appointments, EMR, Pharmacy, Inventory, Reports

### ⭐ **Professional Medical Center** (Professional Tier)
- **Tenant**: `PMC`
- **Email**: `robert@professional.med`
- **Password**: `Test@123`
- **Expected Features**: Core + Customer Support
- **Navigation**: All Basic + Support module

### 🏢 **Enterprise Hospital Systems** (Enterprise Tier)
- **Tenant**: `EHS`
- **Email**: `michael@enterprise.hos`
- **Password**: `Test@123`
- **Expected Features**: All features
- **Navigation**: All modules including HR & Accounts

## 🧪 **Testing Workflows**

### 1. **Login Testing**
1. Go to http://localhost:5173
2. Select tenant from dropdown
3. Click "🎭 Demo Credentials" to see login details
4. Copy/paste credentials and login
5. Verify navigation shows correct modules

### 2. **Superadmin Feature Management**
1. Login as Superadmin
2. Navigate to "Superadmin" section
3. **Tenant Management**: View all tenants with subscription tiers
4. **Kill Switches**: Test emergency feature disabling
5. **Feature Status**: Click "View Features" for any tenant

### 3. **Feature Gating Verification**
1. **Basic Tier**: Should NOT see Employees or Accounts modules
2. **Professional Tier**: Should see Support module
3. **Enterprise Tier**: Should see ALL modules
4. **API Testing**: Try accessing gated endpoints (should return 403)

### 4. **Kill Switch Testing**
1. As Superadmin, enable a kill switch (e.g., HR Payroll)
2. All tenants should lose access to that feature instantly
3. Disable kill switch to restore access
4. Check audit logs for changes

## 🎯 **Expected UI Behavior**

### **Navigation Items by Tier**
- **🟦 Basic**: Dashboard, Patients, Appointments, EMR, Pharmacy, Inventory, Reports
- **🟦 Professional**: Basic + Support
- **🟦 Enterprise**: All modules including HR, Accounts

### **Error Handling**
- **403 Errors**: When accessing gated features
- **Clear Messages**: "Feature not available for your subscription tier"
- **Graceful Fallbacks**: Hide/disable UI elements

### **Visual Indicators**
- **Tenant Badges**: Color-coded by subscription tier
- **Feature Status**: Enabled/disabled indicators
- **Kill Switch Warnings**: ⚠️ When active

## 🔧 **Advanced Testing**

### **API Endpoint Testing**
```bash
# Test feature flags
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/tenants/EHS/features

# Test kill switches
curl -H "Authorization: Bearer <superadmin-token>" \
  http://localhost:4000/api/admin/kill-switches

# Test gated endpoint (should fail for Basic tier)
curl -H "Authorization: Bearer <basic-token>" \
  http://localhost:4000/api/employees
```

### **Database Verification**
```sql
-- Check tenant subscriptions
SELECT name, subscription_tier FROM emr.tenants;

-- Check feature flags
SELECT * FROM emr.global_kill_switches;

-- Check tenant features
SELECT * FROM emr.tenant_features;
```

## 🚨 **Troubleshooting**

### **Common Issues**
1. **Navigation not updating**: Refresh page after tenant tier changes
2. **Features still showing**: Clear browser cache
3. **API errors**: Check server logs for feature flag evaluation
4. **Kill switches not working**: Verify Superadmin permissions

### **Debug Mode**
- Browser Console: Look for feature flag evaluation logs
- Server Logs: Check middleware evaluation
- Network Tab: Verify API responses

## 📊 **Success Criteria**

✅ **Login System**: Enhanced with demo credentials
✅ **Tenant Management**: Clear subscription tier display
✅ **Feature Gating**: Proper module access control
✅ **Kill Switches**: Emergency disable functionality
✅ **UI/UX**: Intuitive and responsive design
✅ **Error Handling**: Clear user feedback
✅ **Audit Trail**: Complete change tracking

## 🎉 **Ready for Production!**

The feature flagging system is now fully operational with:
- **Multi-tier subscription management**
- **Real-time feature control**
- **Emergency safety mechanisms**
- **Comprehensive audit logging**
- **Enhanced user experience**

Test all workflows and verify the feature gating works as expected across different subscription tiers!
