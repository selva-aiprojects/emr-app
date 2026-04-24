# 💊 Pharmacy Service - Testing & Usage Guide

## Overview

The Pharmacy Service is a complete microservice for medication management with clinical safety checking, inventory control, and dispensing workflows.

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd pharmacy-service
npm install
```

### Step 2: Run Database Migrations

```bash
# From project root
psql -U your_username -d emr_db -f database/migrations/006_pharmacy_module.sql

# Load sample drug data
psql -U your_username -d emr_db -f database/pharmacy/seed_pharmacy_sample.sql
```

### Step 3: Start Pharmacy Service

```bash
# Terminal 1 - Main EMR app
npm run dev

# Terminal 2 - Pharmacy service
cd pharmacy-service
npm run dev
```

Pharmacy service runs on**port 4001**

---

## 📋 API Endpoints

### Base URL
```
http://localhost:4001/api/pharmacy/v1
```

### Prescription Management

#### 1. Create Prescription (with Safety Check)

```bash
POST /api/pharmacy/v1/prescriptions
Content-Type: application/json
x-tenant-id: {tenant-id}
Authorization: Bearer {jwt-token}

{
  "patientId": "patient-uuid",
  "encounterId": "encounter-uuid",
  "priority": "routine",
  "category": "outpatient",
  "items": [
    {
      "drugId": "drug-uuid",
      "dose": "500",
      "doseUnit": "mg",
      "frequency": "BID",
      "route": "Oral",
      "administrationTiming": "with_food",
      "durationDays": 10,
      "quantity": 20,
      "instructions": "Take 1 tablet by mouth twice daily with food",
      "sigCode": "1 TAB PO BID PC",
      "refillsAllowed": 0,
      "daysSupply": 10
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "prescription": {...},
    "items": [...],
    "safetyCheck": {
      "isSafe": true,
      "requiresOverride": false,
      "totalAlerts": 0,
      "alerts": []
    }
  }
}
```

#### 2. Validate Prescription (Test Safety Check)

```bash
POST/api/pharmacy/v1/prescriptions/validate
Content-Type: application/json
x-tenant-id: {tenant-id}

{
  "patientId": "patient-uuid",
  "items": [...]
}
```

**Use Case**: Test safety validation before submitting prescription

---

#### 3. Get Pharmacy Queue

```bash
GET/api/pharmacy/v1/pharmacy/queue
x-tenant-id: {tenant-id}
```

**Response**: List of pending prescriptions awaiting dispensing

---

#### 4. Dispense Medication

```bash
POST /api/pharmacy/v1/pharmacy/dispense
Content-Type: application/json
x-tenant-id: {tenant-id}
Authorization: Bearer {jwt-token}

{
  "prescriptionItemId": "item-uuid",
  "drugId": "drug-uuid",
  "quantity": 20
}
```

**Features**:
- Automatically selects batches using FEFO (First Expiry, First Out)
- Creates inventory transactions
- Updates prescription status to "completed"

---

### Drug Catalog

#### 5. Search Drugs

```bash
GET/api/pharmacy/v1/drugs/search?q=ibuprofen&dosageForm=Tablet
```

**Query Parameters**:
- `q` - Search term (generic name, brand name, RxNorm code)
- `dosageForm` - Filter by form (Tablet, Capsule, Solution, etc.)
- `route` - Filter by route (Oral, IV, Subcutaneous, etc.)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "drug-uuid",
      "genericName": "Ibuprofen",
      "brandNames": ["Advil", "Motrin"],
      "strength": "400mg",
      "dosageForm": "Tablet",
      "route": "Oral",
      "rxnormCode": "5640",
      "ndcCode": "00074-6631",
      "scheduleType": "OTC",
      "highAlertFlag": false,
      "availableBatches": ["batch-uuid-1", "batch-uuid-2"]
    }
  ]
}
```

#### 6. Get Drug Details

```bash
GET/api/pharmacy/v1/drugs/{drugId}
```

**Returns**: Complete drug information including all available batches

---

### Inventory Alerts

#### 7. Low Stock Alerts

```bash
GET/api/pharmacy/v1/alerts/low-stock
x-tenant-id: {tenant-id}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "drugId": "uuid",
      "drugName": "Amoxicillin",
      "quantityRemaining": 15,
      "reorderThreshold": 50,
      "alertLevel": "CRITICAL",
      "suggestedOrderQuantity": 85
    }
  ]
}
```

#### 8. Expiring Stock Alerts

```bash
GET/api/pharmacy/v1/alerts/expiring?days=90
x-tenant-id: {tenant-id}
```

**Returns**: All batches expiring within specified days

---

## 🧪 Testing Scenarios

### Scenario 1: Create Prescription with Drug Interaction

```javascript
// Test data: Warfarin + Ibuprofen (MAJOR interaction)
const prescription = {
  patientId: 'test-patient',
  encounterId: 'test-encounter',
  items: [
    {
    drugId: 'warfarin-uuid', // Warfarin 5mg
     dose: '5',
     doseUnit: 'mg',
      frequency: 'QD',
     quantity: 30
    },
    {
    drugId: 'ibuprofen-uuid', // Ibuprofen 400mg
     dose: '400',
     doseUnit: 'mg',
      frequency: 'TID',
     quantity: 90
    }
  ]
};

// Expected Response:
{
  "isSafe": false,
  "requiresOverride": true,
  "alerts": [{
  type: 'DRUG_INTERACTION',
  severity: 'MAJOR',
  drugs: ['Warfarin', 'Ibuprofen'],
  description: 'Increased risk of bleeding'
  }]
}
```

---

### Scenario 2: FEFO Batch Selection

```javascript
// Setup: 3 batches with different expiry dates
Batch A: Expires 2026-06-01, Qty: 50
Batch B: Expires 2026-04-01, Qty: 30  <- Earliest
Batch C: Expires 2026-08-01, Qty: 100

// Dispense 40 units
const dispenseRequest = {
  prescriptionItemId: 'item-uuid',
  drugId: 'drug-uuid',
  quantity: 40
};

// Expected: System uses batches in this order:
// 1. Batch B: 30 units (earliest expiry)
// 2. Batch A: 10 units (next earliest)
// Total: 40 units dispensed
```

---

### Scenario 3: Insufficient Stock

```javascript
// Only 10 units available, trying to dispense 30
const dispenseRequest = {
  prescriptionItemId: 'item-uuid',
  drugId: 'drug-uuid',
  quantity: 30
};

// Expected Response:
{
  "success": false,
  "error": "Insufficient stock. Need 30, available 10. Short by 20",
  "requiresStockTransfer": true
}
```

---

## 🔒 Safety Features

### 1. Drug-Drug Interaction Checking

Automatically checks for interactions between all prescribed medications.

**Severity Levels**:
- **CRITICAL** (Contraindicated) - Never allow without override
- **MAJOR** - Requires provider acknowledgment
- **MODERATE** - Warning only
- **MINOR** - Informational

### 2. Allergy Validation

Cross-references prescribed drugs with patient's documented allergies.

**Always requires override if allergy detected**

### 3. Duplicate Therapy Detection

Identifies when patient is already on same/similar medication.

### 4. High-Alert Medication Flags

Special handling for high-risk drugs:
- Insulin
- Heparin/Warfarin
- Opioids
- Chemotherapy agents

---

## 📊 Sample Test Script

Create `test-pharmacy.js`:

```javascript
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4001/api/pharmacy/v1';
const TENANT_ID = 'your-tenant-id';
const AUTH_TOKEN = 'your-jwt-token';

async function testPharmacyService() {
  console.log('🏥 Testing MedFlow Pharmacy Service\n');
  
  // Test 1: Search drug catalog
  console.log('1️⃣ Search Drug Catalog');
  const searchRes = await fetch(`${BASE_URL}/drugs/search?q=metformin`);
  const searchData = await searchRes.json();
  console.log('Found drugs:', searchData.data.length);
  const metforminId = searchData.data[0]?.id;
  
  // Test 2: Get drug details
  console.log('\n2️⃣ Get Drug Details');
  const detailsRes = await fetch(`${BASE_URL}/drugs/${metforminId}`);
  const detailsData = await detailsRes.json();
  console.log('Drug:', detailsData.data.genericName);
  console.log('Available batches:', detailsData.data.batches?.length || 0);
  
  // Test 3: Validate prescription (should pass)
  console.log('\n3️⃣ Validate Safe Prescription');
  const validateRes = await fetch(`${BASE_URL}/prescriptions/validate`, {
   method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID
    },
   body: JSON.stringify({
     patientId: 'test-patient-id',
     items: [{
      drugId: metforminId,
       dose: '500',
       doseUnit: 'mg',
        frequency: 'BID',
       quantity: 60
      }]
    })
  });
  const validateData = await validateRes.json();
  console.log('Safety check passed:', validateData.safetyCheck.isSafe);
  
  // Test 4: Get low stock alerts
  console.log('\n4️⃣ Low Stock Alerts');
  const alertsRes = await fetch(`${BASE_URL}/alerts/low-stock`, {
    headers: { 'x-tenant-id': TENANT_ID }
  });
  const alertsData = await alertsRes.json();
  console.log('Low stock items:', alertsData.data.length);
  
  // Test 5: Get pharmacy queue
  console.log('\n5️⃣ Pharmacy Queue');
  const queueRes = await fetch(`${BASE_URL}/pharmacy/queue`, {
    headers: { 'x-tenant-id': TENANT_ID }
  });
  const queueData = await queueRes.json();
  console.log('Pending prescriptions:', queueData.data.length);
  
  console.log('\n✅ All tests completed!');
}

testPharmacyService().catch(console.error);
```

Run test:
```bash
node test-pharmacy.js
```

---

## 🎯 Integration with Main EMR

### Add to Main Express App (`server/index.js`)

```javascript
import pharmacyRoutes from '../pharmacy-service/src/routes/pharmacy.routes.js';

// Add pharmacy routes
app.use('/api/pharmacy/v1', authenticate, requireTenant, pharmacyRoutes);
```

### Update Environment Variables

Add to `.env`:
```env
PHARMACY_PORT=4001
PHARMACY_SERVICE_URL=http://localhost:4001
```

---

## 📈 Performance Benchmarks

| Operation | Target Response Time | Notes |
|-----------|---------------------|-------|
| Drug Search | < 200ms | With 10K+ drugs in database |
| Safety Check | < 500ms | 4-drug regimen with interactions |
| Dispense Medication | < 300ms | Including FEFO batch selection |
| Get Pharmacy Queue | < 400ms | 100+ pending prescriptions |

---

## 🐛 Troubleshooting

### Issue: No drugs found in search

**Solution**: Ensure sample data was loaded
```bash
psql -U user -d emr_db -f database/pharmacy/seed_pharmacy_sample.sql
```

### Issue: "Insufficient stock" error

**Solution**: Create drug batches
```sql
INSERT INTO emr.drug_batches 
(drug_id, batch_number, quantity_remaining, expiry_date, location)
VALUES 
('drug-uuid', 'TEST-BATCH-001', 100, CURRENT_DATE + INTERVAL '1 year', 'Shelf A-1');
```

### Issue: Safety check always fails

**Solution**: Check drug interaction data
```sql
SELECT * FROM emr.drug_interactions LIMIT 10;
```

---

## ✅ Next Steps

After testing pharmacy service:

1. ✅ **Complete** - Pharmacy microservice operational
2. ⏳ Build React UI components for prescribing
3. ⏳ Implement nurse MAR module
4. ⏳ Add barcode scanning for medication administration
5. ⏳ Integrate with external drug databases (RxNorm API)

---

**Status**: Production Ready ✅  
**Test Coverage**: Service layer complete, UI pending  
**Next Review**: After UI component development
