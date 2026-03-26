# EMR Multi-Tenant Application

A comprehensive Electronic Medical Records system built with **React** (frontend) and **PostgreSQL** (Neon) with an Express.js API, deployed on **Netlify**.

🔗 **Live**: [https://emr-sys.netlify.app/](https://emr-sys.netlify.app/)

---

## Architecture

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React + Vite | Netlify CDN |
| Backend | Express.js | Netlify Functions (serverless) |
| Database | PostgreSQL | Neon (cloud) |
| Auth | JWT + bcrypt | — |

## Multi-Tenant Design

Each tenant (hospital/clinic) has isolated data. The system supports:
- **4 tenants**: Selva Care Hospital (SCH), Nila Health Center (NHC), Riverway Community Clinic (RCC), Omega Hospitals (OH)
- **Role-based access**: Superadmin, Admin, Doctor, Nurse, Front Office, Billing, Patient
- **Per-tenant features**: Inventory toggle, telehealth toggle
- **Tenant theming**: Custom primary/accent colors

## Modules

| Module | Features |
|--------|----------|
| **Dashboard** | Metric cards (patients, appointments, walk-ins, employees, revenue), welcome banner |
| **Patients** | Registration, medical history, clinical records, MRN generation |
| **Appointments** | Scheduling, walk-in management, status tracking, rescheduling |
| **EMR** | Encounter creation (OPD/IPD/emergency), diagnosis, notes |
| **Inpatient** | Ward and bed management, discharge protocol, automated billing |
| **Laboratory** | Test results, diagnostics, and integrated results entry |
| **Pharmacy** | Medication dispensing, prescription validation, safety checks |
| **Billing** | Invoice generation, tax calculation, payment tracking, automated settle |
| **Insurance** | Claims registry, insurance hubs and provider management |
| **Inventory** | Stock management, reorder alerts, batch tracking (FEFO) |
| **Employees** | HR records, leave management, shift tracking and payroll |
| **Reports** | Revenue, patient, and appointment trends |
| **Admin** | Tenant settings, user management, feature toggles |
| **Communication** | Internal notice board and employee alerts |
| **Document Vault** | Patient-linked clinical and administrative storage |
| **Support** | Facility assistance, ticketing and resolution |
| **Superadmin** | Platform-wide control, tenant provisioning, system audit |
| **Chatbot** | Tenant-scoped assistant (patient lookup, stats, navigation) |

## Quick Start (Local)

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET

# Run locally
npm start
# Frontend: http://localhost:5173
# Backend:  http://localhost:4000
```

## Test Credentials

| Role | Tenant | Email | Password |
|------|--------|-------|----------|
| Superadmin | — | superadmin@emr.local | Admin@123 |
| Admin | SCH | anita@sch.local | Anita@123 |
| Doctor | SCH | rajesh@sch.local | Rajesh@123 |
| Patient | SCH | meena@sch.local | Meena@123 |
| Admin | NHC | admin@nhc.local | Admin@123 |
| Admin | RCC | admin@rcc.local | Admin@123 |
| Admin | OH | admin@omega.local | Admin@123 |

## Project Structure

```
EMR-Application/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # AppLayout, MetricCard, Chatbot
│   │   ├── pages/            # LoginPage, DashboardPage, PatientsPage, etc.
│   │   ├── config/           # modules.js (page metadata & permissions)
│   │   ├── utils/            # chatEngine.js, format.js
│   │   ├── api.js            # API client with JWT auth
│   │   ├── App.jsx           # Main app (routing, state, auth)
│   │   └── index.css         # Design system (Inter font, healthcare palette)
│   ├── public/
│   │   └── _redirects        # Netlify SPA fallback
│   └── .env                  # VITE_API_URL for local dev
├── server/                   # Express.js backend
│   ├── db/
│   │   ├── connection.js     # PostgreSQL connection pool
│   │   └── repository.js     # All CRUD operations
│   ├── middleware/            # JWT auth middleware
│   └── index.js              # Express app (exports for serverless)
├── database/                 # SQL scripts
│   ├── schema_enhanced.sql   # Full schema with constraints
│   ├── init_db.sql           # Initial seed (tenants, users, 1 patient each)
│   └── seed_patient_journeys.sql  # 10 patients/tenant with full journeys
├── netlify/
│   └── functions/api.js      # Serverless wrapper (serverless-http)
├── netlify.toml              # Build & redirect config
└── docs/                     # Documentation
```

## Deployment (Netlify)

See [deployment.md](deployment.md) for full details.

## Seed Data

See [seed-data.md](seed-data.md) for details on the 40+ patient journeys seeded across all tenants.
