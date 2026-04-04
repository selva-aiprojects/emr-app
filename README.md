# MedFlow EMR Application (Premium v2.0)

This project is a high-end, multi-tenant Electronic Medical Records (EMR) system built with **React** (Vite), **Express.js**, and **PostgreSQL**. It features a robust multi-tenant architecture with role-based access control (RBAC) and a premium glassmorphic UI.

## 🚀 Project Documentation
We have consolidated all fragmented documents into three authoritative guides:

- **[Scope & Requirements](docs/SCOPE_AND_REQUIREMENTS.md)**: Product definition, functional specs, and business scope.
- **[Technical Design & Architecture](docs/TECHNICAL_DESIGN.md)**: System architecture, data flow, tech stack, and security.
- **[User Manual & Access](docs/USER_MANUAL.md)**: Step-by-step role-based workflows and demo login credentials.

---

## 🏗️ Core Technology Stack
- **Frontend**: React 18, Vanilla CSS (Premium Glassmorphism), Vite / Vite.
- **Backend**: Node.js, Express.js REST API.
- **ORM**: Prisma 7 (Schema-per-tenant isolation strategy).
- **Database**: PostgreSQL (Supabase / Neon with Driver Adapters).
- **Session**: JWT-based stateless authentication with BCrypt hashing.
- **Intelligence**: Integrated **Google Gemini-1.5-Flash** for clinical summarization.

---

## 🛠️ Development Setup
1. **Install dependencies**: `npm install`
2. **Database Configuration**:
   - Ensure you have a `.env` file with `DATABASE_URL` and `JWT_SECRET`.
   - Use `node server/db/check_db.js` to verify your Prisma connection.
3. **Run locally**: `npm run dev`
   - **Frontend**: `http://localhost:5174` (Vite)
   - **Backend API**: `http://localhost:4000/api`

---

## 🔑 Access Credentials
Detailed login details for all roles (Admin, Doctor, Nurse, etc.) can be found in the **[User Manual](docs/USER_MANUAL.md)**.

---

## 📦 System Modules
- **Dashboard**: Real-time glassmorphic metrics and clinical overview.
- **EMR (Clinical Workspace)**: Dual-pane consultation ledger with longitudinal journal.
- **Laboratory & Diagnostics**: Test orders, results, and critical alerts.
- **Pharmacy & Inventory**: Stock visual intelligence and focused dispensation.
- **Emergency (EMS)**: Ambulance fleet management and dispatching.
- **Billing & Insurance**: Invoicing payment collection, and claims.
- **HR & Employees**: Shift management, attendance, and leaves.
- **Superadmin**: Global tenant lifecycle and platform monitoring.

---

## ⚠️ Maintenance Note
The root directory has been cleaned of legacy test files (`test-*.mjs`, `check-*.js`). All new testing should follow the **[INTEGRATION_TESTING.md](INTEGRATION_TESTING.md)** flow.
