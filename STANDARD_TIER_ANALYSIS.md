# Standard Subscription Tier Analysis

## 🔍 **Where is the Standard Subscription?**

### **Answer: The "Standard" tier exists ONLY in code, NOT in the database!**

---

## 📊 **Current State Analysis**

### **✅ Where "Standard" EXISTS:**

#### 1. **Service Defaults** (`subscriptionCatalog.service.js`)
```javascript
{ id: 'standard', name: 'Standard', cost: '4999', period: 'per mo', color: 'blue', 
  features: ['Email Support', 'Advanced Analytics', 'Up to 25 Users'], 
  moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','hospital_settings','departments'] }
```

#### 2. **Frontend Fallbacks** (`SubscriptionEngine.jsx`)
```javascript
{ id: 'standard', name: 'Standard', cost: '4999', period: 'per mo', color: 'blue',
  features: ['Email Support', 'Advanced Analytics', 'Up to 25 Users'],
  moduleKeys: ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','hospital_settings','departments'] }
```

#### 3. **Database Query Ordering** (in SQL ORDER BY)
```sql
WHEN 'standard' THEN 1
```

### **❌ Where "Standard" DOES NOT EXIST:**

#### 1. **Database Table** (`nexus.subscription_catalog`)
```
Result: NO standard tier found
Only has: basic
```

#### 2. **Features Tiers Table** (`nexus.features_tiers`)
```
Result: NO standard tier found
Available tiers: ['enterprise', 'basic', 'professional']
```

#### 3. **Migration Script** (`012_subscription_catalog.sql`)
```
Only inserts: free, basic, professional, enterprise
NO standard tier
```

---

## 🎯 **The Problem**

### **Data Inconsistency**
- **Code expects**: 4 tiers (basic, standard, professional, enterprise)
- **Database has**: 1 tier (basic) in subscription_catalog
- **Features table has**: 3 tiers (basic, professional, enterprise)
- **Missing**: standard tier completely from database

### **Why This Causes Issues**
1. **Frontend tries to display** 4 tiers
2. **Service function returns** inconsistent data
3. **Features mapping fails** for standard tier
4. **Subscription display breaks** due to missing data

---

## 🚀 **Solutions**

### **Option 1: Add Standard Tier to Database** (Recommended)
```sql
-- Add standard tier to subscription catalog
INSERT INTO nexus.subscription_catalog (plan_id, name, cost, period, color, module_keys, features)
VALUES (
  'standard', 'Standard', '4999', 'per mo', 'blue',
  '["dashboard","patients","appointments","emr","reports","support","communication","documents","inventory","pharmacy","ambulance","lab","hospital_settings","departments"]'::jsonb,
  '["Email Support","Advanced Analytics","Up to 25 Users"]'::jsonb
) ON CONFLICT (plan_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  cost = EXCLUDED.cost,
  period = EXCLUDED.period,
  color = EXCLUDED.color,
  module_keys = EXCLUDED.module_keys,
  features = EXCLUDED.features,
  updated_at = now();

-- Add standard tier to features_tiers
INSERT INTO nexus.features_tiers (tier_key, feature_key, module_keys, enabled)
VALUES
  ('standard', 'patient_management', '["patients"]', true),
  ('standard', 'doctor_management', '["users"]', true),
  ('standard', 'electronic_medical_records', '["emr"]', true),
  ('standard', 'opd_appointment_scheduling', '["appointments"]', true),
  ('standard', 'pharmacy', '["pharmacy"]', true),
  ('standard', 'inventory_management', '["inventory"]', true),
  ('standard', 'laboratory', '["lab"]', true),
  ('standard', 'billing', '["billing"]', true),
  ('standard', 'reports', '["reports"]', true),
  ('standard', 'rbac', '["admin","users"]', true)
ON CONFLICT (tier_key, feature_key) DO UPDATE
SET 
  module_keys = EXCLUDED.module_keys,
  enabled = EXCLUDED.enabled;
```

### **Option 2: Remove Standard Tier from Code**
```javascript
// Remove from DEFAULT_CATALOG
export const DEFAULT_CATALOG = [
  { id: 'basic', ... },
  { id: 'professional', ... },
  { id: 'enterprise', ... }
];

// Remove from FALLBACK_PLANS
const FALLBACK_PLANS = [
  { id: 'basic', ... },
  { id: 'professional', ... },
  { id: 'enterprise', ... }
];
```

### **Option 3: Hybrid Approach**
- Keep standard tier in code for future use
- Add to database but mark as disabled
- Enable when ready

---

## 📋 **Current Subscription Structure**

### **What Should Be Displayed:**
| Tier | Status | Price | Location |
|------|--------|-------|----------|
| **Basic** | ✅ Available | $1999 | Database + Code |
| **Standard** | ❌ Missing | $4999 | Code Only |
| **Professional** | ✅ Available | $7999 | Database + Code |
| **Enterprise** | ✅ Available | $14999 | Database + Code |

### **What's Actually Displayed:**
- **Inconsistent** - depends on which data source wins
- **Often shows errors** due to missing standard tier
- **May fall back to defaults** which include standard

---

## 🎯 **Recommendation**

### **Add Standard Tier to Database**
The "standard" tier should exist because:

1. **Code already expects it** - removing would break more things
2. **Logical pricing progression**: $1999 → $4999 → $7999 → $14999
3. **Feature differentiation**: Mid-tier between basic and professional
4. **Market positioning**: Common subscription tier structure

### **Standard Tier Features**
- **Price**: $4999/month
- **Features**: Email Support, Advanced Analytics, Up to 25 Users
- **Modules**: Basic + inventory, pharmacy, lab, departments
- **Target**: Medium-sized hospitals needing more than basic but not full professional

---

## 🔧 **Immediate Fix**

Run this SQL to add the missing standard tier:

```sql
-- Add standard subscription plan
INSERT INTO nexus.subscription_catalog (plan_id, name, cost, period, color, module_keys, features)
VALUES (
  'standard', 'Standard', '4999', 'per mo', 'blue',
  '["dashboard","patients","appointments","emr","reports","support","communication","documents","inventory","pharmacy","ambulance","lab","hospital_settings","departments"]'::jsonb,
  '["Email Support","Advanced Analytics","Up to 25 Users"]'::jsonb
) ON CONFLICT (plan_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  cost = EXCLUDED.cost,
  period = EXCLUDED.period,
  color = EXCLUDED.color,
  module_keys = EXCLUDED.module_keys,
  features = EXCLUDED.features,
  updated_at = now();
```

---

## 📊 **Expected Result After Fix**

| Tier | Price | Status |
|------|-------|--------|
| **Basic** | $1999 | ✅ Available |
| **Standard** | $4999 | ✅ Available |
| **Professional** | $7999 | ✅ Available |
| **Enterprise** | $14999 | ✅ Available |

**All 4 tiers will display correctly** with consistent data across all components.

---

**Summary**: The "standard" subscription exists in code but not in database, causing the display issues. Adding it to the database will fix the subscription display problem.
