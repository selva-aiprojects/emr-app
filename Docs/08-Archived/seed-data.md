# Seed Data — Patient Journeys

## Overview

The file `database/seed_patient_journeys.sql` populates the database with realistic patient journey data across all 4 tenants.

## Data Summary

| Tenant | Code | Patients | Appointments | Encounters | Invoices | Walk-ins | Employees | Inventory |
|--------|------|----------|-------------|------------|----------|----------|-----------|-----------|
| Selva Care Hospital | SCH | 11 | ~30 | ~20 | ~20 | 2 | 3 | 5 |
| Nila Health Center | NHC | 11 | ~20 | ~15 | ~15 | 2 | 3 | 3 |
| Riverway Community Clinic | RCC | 11 | ~20 | ~15 | ~15 | 2 | 2 | — |
| Omega Hospitals | OH | 11 | ~30 | ~15 | ~20 | 2 | 4 | 5 |

## Patient Journey Flow

Each patient goes through:

```
Registration → Appointment → Encounter → Invoice
     ↑              ↑            ↑          ↑
  Demographics   Scheduled   OPD/IPD/    Consultation
  Medical Hx     Completed   Emergency   Lab fees
  Insurance      Follow-up   Diagnosis   Paid/Unpaid
```

## Medical Data Realism

- **Indian names & addresses** (Chennai, Coimbatore, Madurai, Hyderabad)
- **Blood groups**: A+, B+, O+, AB+, A-, B-, O-, AB-
- **Conditions**: Diabetes, Hypertension, Asthma, COPD, Arthritis, Migraine
- **Allergies**: Penicillin, Sulfa, Peanuts, Aspirin, Latex, Shellfish, NSAIDs
- **Encounter types**: OPD consultations, emergency visits, follow-ups
- **Invoice ranges**: ₹300 (OPD) to ₹9,440 (MRI scan)

## Running the Seed

```bash
# Using node + pg
node -e "
  const fs = require('fs');
  const { Client } = require('pg');
  const sql = fs.readFileSync('database/seed_patient_journeys.sql', 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  client.connect().then(() => client.query(sql)).then(() => {
    console.log('Seed complete!');
    client.end();
  });
"
```

The script uses `ON CONFLICT DO NOTHING` so it's safe to run multiple times.
