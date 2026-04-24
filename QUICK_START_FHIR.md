# 🚀 Quick Start Guide - HL7/FHIR EMR Setup

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm or yarn
- psql (PostgreSQL client)

---

## Step 1: Database Setup

### Run Database Migrations

```bash
# Navigate to project root
cd d:\Training\working\EMR-Application

# Check database connection
psql -U your_username -d emr_db -c "\dt emr.*"

# Run FHIR compliance migration
psql -U your_username -d emr_db -f database/migrations/005_fhir_compliance.sql

# Run Pharmacy module migration
psql -U your_username -d emr_db -f database/migrations/006_pharmacy_module.sql
```

### Verify Tables Created

```bash
# List all tables in emr schema
psql -U your_username -d emr_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'emr' ORDER BY table_name;"
```

Expected output should include:
```
conditions
diagnostic_reports
drug_allergies
drug_batches
drug_interactions
drug_master
medication_administrations
medication_schedules
observations
patient_medication_allocations
pharmacy_alerts
pharmacy_inventory
procedures
purchase_order_items
purchase_orders
service_requests
stock_movements
vendors
ward_stock
```

---

## Step 2: Install Dependencies

### Main Application

```bash
# From project root
npm install
```

### FHIR Service

```bash
cd fhir-service
npm install
cd ..
```

### Create .env Files

**Root `.env`**:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/emr_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=4000
FHIR_PORT=4002
PHARMACY_PORT=4001
FHIR_BASE_URL=http://localhost:4002
```

**`fhir-service/.env`**:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/emr_db
PORT=4002
FHIR_BASE_URL=http://localhost:4002
```

---

## Step 3: Start Services

### Option A: Start All Services Together

```bash
# From project root
npm run dev
```

This starts:
- Frontend (Vite): http://localhost:5173
- Backend API (Express): http://localhost:4000
- FHIR Server: Will start on port 4002

### Option B: Start Services Separately

**Terminal 1 - Backend API**:
```bash
npm run server:dev
```

**Terminal 2 - Frontend**:
```bash
npm run client:dev
```

**Terminal 3 - FHIR Server**:
```bash
cd fhir-service
npm run dev
```

---

## Step 4: Verify Services

### Check Main API

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-10T..."
}
```

### Check FHIR Server

```bash
curl http://localhost:4002/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-10T...",
  "service": "MedFlow FHIR R4 Server"
}
```

### Check FHIR Metadata

```bash
curl -X GET "http://localhost:4002/fhir/R4/metadata" \
  -H "Accept: application/fhir+json"
```

Should return a FHIR CapabilityStatement resource.

---

## Step 5: Test FHIR Endpoints

### Create a Test Patient

Using cURL:

```bash
curl -X POST "http://localhost:4002/fhir/R4/Patient" \
  -H "Content-Type: application/fhir+json" \
  -H "Accept: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "name": [{
      "family": "TestPatient",
      "given": ["John"]
    }],
    "gender": "male",
    "birthDate": "1985-05-15",
    "telecom": [{
      "system": "phone",
      "value": "555-555-5555"
    }],
    "address": [{
      "line": ["123 Test Street"],
      "city": "Boston",
      "district": "MA",
      "postalCode": "02101",
      "country": "USA"
    }]
  }'
```

Expected response (formatted):
```json
{
  "resourceType": "Patient",
  "id": "generated-uuid-here",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-03-10T...",
    "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"]
  },
  "identifier": [{
    "use": "usual",
    "type": {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
        "code": "MR"
      }]
    },
    "system": "urn:oid:2.16.840.1.113883.4.1#tenant-id",
    "value": "MRN-20260310-XXXX"
  }],
  "active": true,
  "name": [{
    "use": "official",
    "family": "TestPatient",
    "given": ["John"]
  }],
  "gender": "male",
  "birthDate": "1985-05-15",
  ...
}
```

### Search for Patients

```bash
# Search by name
curl -X GET "http://localhost:4002/fhir/R4/Patient?name=TestPatient" \
  -H "Accept: application/fhir+json"

# Search by gender
curl -X GET "http://localhost:4002/fhir/R4/Patient?gender=male" \
  -H "Accept: application/fhir+json"

# Search by birthdate
curl -X GET "http://localhost:4002/fhir/R4/Patient?birthdate=1985-05-15" \
  -H "Accept: application/fhir+json"
```

### Read Patient by ID

```bash
# Replace {id} with the actual patient ID from create response
curl -X GET "http://localhost:4002/fhir/R4/Patient/{id}" \
  -H "Accept: application/fhir+json"
```

---

## Step 6: Insert Sample Data (Optional)

### Create Sample Drug Master Records

```bash
psql -U your_username -d emr_db <<EOF
INSERT INTO emr.drug_master 
(tenant_id, generic_name, brand_names, strength, dosage_form, route, 
 ndc_code, rxnorm_code, snomed_code, schedule_type, high_alert_flag)
VALUES 
(NULL, 'Paracetamol', ARRAY['Tylenol', 'Calpol'], '500mg', 'Tablet', 'Oral',
 '12345-678-90', '161', '323987006', 'Prescription', false),
(NULL, 'Ibuprofen', ARRAY['Advil', 'Motrin'], '400mg', 'Tablet', 'Oral',
 '23456-789-01', '5640', '372552008', 'Prescription', false),
(NULL, 'Insulin Glargine', ARRAY['Lantus'], '100 units/mL', 'Solution', 'Subcutaneous',
 '34567-890-12', '261551', '372724001', 'Prescription', true);
EOF
```

### Verify Drug Data

```bash
psql -U your_username -d emr_db -c "SELECT generic_name, brand_names, strength FROM emr.drug_master LIMIT 5;"
```

---

## Step 7: Access Web Interface

Open browser to:

- **Main Application**: http://localhost:5173
  - Login with test credentials (see README.md)
  
- **FHIR Metadata**: http://localhost:4002/fhir/R4/metadata

---

## Step 8: Explore Postman Collection

Import the FHIR collection into Postman:

1. Open Postman
2. Click Import
3. Select file: `docs/fhir-postman-collection.json` (if available)
4. Set environment variable: `base_url = http://localhost:4002/fhir/R4`
5. Test all endpoints

---

## Troubleshooting

### Issue: Database Migration Fails

**Error**: `relation "emr.patients" does not exist`

**Solution**: Run the base schema first:
```bash
psql -U your_username -d emr_db -f database/schema.sql
```

### Issue: FHIR Server Won't Start

**Error**: `Cannot find module'express'`

**Solution**: Install dependencies:
```bash
cd fhir-service
npm install
```

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::4002`

**Solution**: Change port in `.env`:
```env
FHIR_PORT=4003
```

### Issue: CORS Errors

**Solution**: Ensure CORS is enabled in both main app and FHIR service:
```javascript
app.use(cors());
```

---

## Next Steps After Setup

### Week 1 Tasks
1. ✅ Complete remaining FHIR resource controllers
2. ✅ Test all Patient CRUD operations
3. ✅ Implement Encounter FHIR controller
4. ✅ Implement Condition FHIR controller
5. ✅ Implement Observation FHIR controller

### Week 2 Tasks
1. Create clinical service layer
2. Build doctor UI for problem list entry
3. Build nurse UI for vital signs entry
4. Test end-to-end clinical workflows

---

## Useful Commands

### Database Queries

```bash
# View all patients
psql -U your_username -d emr_db -c "SELECT * FROM emr.patients LIMIT 10;"

# View FHIR references
psql -U your_username -d emr_db -c "SELECT id, mrn, first_name, fhir_patient_ref FROM emr.patients LIMIT 5;"

# View drug master
psql -U your_username -d emr_db -c "SELECT generic_name, strength, rxnorm_code FROM emr.drug_master LIMIT 10;"

# Check table sizes
psql -U your_username -d emr_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'emr' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Development

```bash
# Watch logs
tail -f server-dev.out.log
tail -f client-dev.out.log

# Check running processes
npm run list-processes

# Restart services
npm run restart
```

---

## Support Resources

- **Documentation**: See `IMPLEMENTATION_GUIDE.md`
- **Architecture Overview**: See `IMPLEMENTATION_SUMMARY.md`
- **API Examples**: See `fhir-service/examples/`
- **Database Schema**: See `database/schema_enhanced.sql`

---

## Success Indicators

✅ All migrations ran without errors  
✅ FHIR metadata endpoint returns CapabilityStatement  
✅ Can create/read patients via FHIR API  
✅ Web interface loads successfully  
✅ No console errors in browser 
✅ Database has 20+ new tables  

---

**Setup Time**: 30-60 minutes  
**Difficulty**: Intermediate  
**Next Milestone**: Complete FHIR resource controllers (Week 1)
