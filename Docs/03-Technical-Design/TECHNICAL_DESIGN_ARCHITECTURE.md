# Technical Architecture & Design Document (TAD)

## 1. Executive Overview

The MedFlow EMR follows a **Multi-Tenant SaaS (Software as a Service)** architecture. It utilizes a **Single-Page Application (SPA)** frontend communicating with a **Stateless REST API** backend, backed by a relational **SQL Database**.

The core architectural principle is **Tenant Isolation at the Application Layer**. All database queries are scoped by a `tenant_id` to enforce data separation within a shared schema.

---

## 2. High-Level Architecture Diagram
*(Conceptual representation - see `DATA_FLOW_DIAGRAMS.md` for detailed Mermaid charts)*

**Client (Browser)** -> **Internet/CDN (Netlify)** -> **API Gateway (Express)** -> **Service Layer** -> **Repository Layer** -> **Database (PostgreSQL)**

---

## 3. Technology Stack

### 3.1 Frontend (Client)
- **Framework**: React 18 (Vite build tool)
- **Language**: JavaScript (ES6+)
- **State Management**: React `useState`/`useEffect` (Component-level state) + Top-Level `App.jsx` Props (Global store)
- **Routing**: Internal view-state management (Single Page)
- **Styling**: Essential CSS (Responsive Flex/Grid system)
- **HTTP Client**: `fetch` API wrapper (with JWT injection)

### 3.2 Backend (Server)
- **Runtime**: Node.js (Express.js)
- **Language**: JavaScript (ES Modules)
- **Security**:
  - `helmet`: HTTP headers
  - `cors`: Cross-Origin Resource Sharing
  - `bcryptjs`: Password hashing
  - `jsonwebtoken`: Stateless authentication
- **Database Interface**: `pg` (node-postgres)
- **Architecture Pattern**: Controller-Service-Repository

### 3.3 Database
- **Engine**: PostgreSQL 15+ (Neon / Render)
- **Schema**: Shared Schema (Single Database, Tables partitioned logically by `tenant_id`)
- **Key Tables**: `tenants`, `users`, `patients`, `encounters`, `invoices`, `inventory_items`

---

## 4. Component Design

### 4.1 Frontend Components
- **`App.jsx`**: Main controller. Handles Auth check, Routing, Global State (User, Tenant).
- **`AppLayout.jsx`**: Premium glass shell. Handles dynamic tenant branding via CSS variables.
- **`api.js`**: Central API service. Optimized with standard error handling and JWT management.
- **Micro-Components**:
  - `PatientSearch`: Debounced clinical search with premium result styling.
  - `Chatbot`: AI-driven context-aware virtual assistant with glassmorphism UI.
- **Premium Pages**:
  - `EmrPage`: Dual-pane consultation workspace with chronological journal.
  - `InventoryPage`: Asset ledger with visual stock meters and reorder triggers.
  - `PharmacyPage`: Focused dispensation queue with high-contrast status tracking.

### 4.2 Backend Modules (REFINED)
- **`index.js`**: Application entry point.
- **`db/repository.js`**: Data Access Layer.
  - **Security**: Mandatory `tenant_id` scoping in every query.
  - **Performance**: Parameterized queries and JSONB support for clinical records.

---

## 5. Security Architecture

### 5.1 Authentication Refinement
- **Hashed Registry**: Passwords corrected to standard BCrypt hashes for all tenants to resolve legacy login failures.
- **Token Claims**: JWTs now strictly carry `userId`, `tenantId`, and `role`, validated on every request.

### 5.2 Data Isolation Strategy
- **Layered Validation**: Tenant scoping is enforced at the Middleware level and re-validated at the Repository level.

---

## 6. Scalability & Performance

### 6.1 UI Performance
- **CSS Variable Injection**: Dynamic themes (Primary/Accent) are injected into the root, eliminating the need for complex SCSS/JS-in-CSS calculations.
- **Asset Optimization**: Transitioned to SVG-based iconography for zero-latency icon rendering.

### 6.2 Frontend Optimization
- **Premium Rendering**: Use of `backdrop-filter` optimized for Chromium-based browsers (common in medical tablets).
- **Lazy Hydration**: (In Progress) Only loading clinical history modules when the patient is active.

---

## 7. Deployment Strategy

### 7.1 Production Environment
- **Hosting**: Netlify (Frontend + Serverless Functions) or Render (Unified Service).
- **Database**: Managed PostgreSQL (Neon Tech).
- **CI/CD**: Git-based deployment triggers.

### 7.2 Configuration
- Environment Variables (`.env`):
  - `DATABASE_URL`: Connection string.
  - `JWT_SECRET`: Signing key.
  - `NODE_ENV`: production/development toggle.
