# EMR Technical Handbook & Implementation Guide

This document provides a clear, concise guide to the unique architectural patterns and recent implementations in this EMR application. Use this for onboarding or to understand how this project differs from standard React/Node implementations.

---

## 1. Core Architecture Pattern: "Unified State Management"

Unlike projects that use Redux or heavy Context providers, this application uses a **Top-Down State Flow** managed in `client/src/App.jsx`.

- **Source of Truth**: All critical data (active user, tenants, patients, encounters) is fetched and stored in `App.jsx`.
- **Prop Drilling for Clarity**: Props are passed explicitly to pages (e.g., `PatientsPage`, `EmrPage`). This makes it extremely easy to trace where data comes from without searching through global stores.
- **Unified Navigation**: The `view` state in `App.jsx` controls which module is visible, allowing for seamless deep-linking between modules (e.g., clicking a patient in Billing switches `view` to `mpi` and sets `activePatientId`).

---

## 2. Multi-Tenancy Implementation

This system is built for **Tenant Isolation** using a shared database schema.

- **Database Layer**: Almost every table has a `tenant_id` column.
- **Repository Filter**: `server/db/repository.js` functions always require a `tenantId` parameter to ensure a user from "Kidz Clinic" can never see data from "Omega Hospitals".
- **API Security**: The `tenantId` is encoded in the JWT token. The server verifies that the requested `tenantId` matches the token's `tenantId`.

---

## 3. Mobile Responsiveness System

We use a **Hybrid Responsive Strategy** that combines CSS Media Queries with React state.

### The Slide-out Sidebar
- **State**: `isMobileMenuOpen` in `AppLayout.jsx`.
- **CSS**: Located in `index.css` under the `@media (max-width: 1024px)` breakpoint.
- **Overlay**: A `sidebar-overlay` component blurs the background and closes the menu when clicked.
- **Auto-Close**: Navigation buttons in the sidebar automatically call `setIsMobileMenuOpen(false)` when a new module is selected.

### Layout Stacking
- We use `display: grid` globally. On mobile, we override these grids with `grid-template-columns: 1fr !important` to stack horizontal layouts (like the MPI search + record view) into a vertical scroll.

---

## 4. Facilities Entries (Clinical Record Journal)

A key feature for clinicians is the **Federated Timeline**.

- **Implementation**: Instead of showing medical history as separate tables, we map the patient's `clinical_records` array (from the database) into a single chronological journal.
- **Data Shape**: Each entry contains a `section` (finding, med, diagnostic) and a `payload`/`content` string.
- **Blank Handling**: To prevent "ghost" entries or empty UI boxes, the system uses logical fallbacks:
  ```javascript
  {clinicalRecords.length > 0 ? (
    clinicalRecords.map(...)
  ) : (
    <div className="empty-state">No entries found</div>
  )}
  ```

---

## 5. Defensive UI & API Safety

This project prioritizes **System Stability** through multiple layers of safety:

1. **Safe API Parsing**: `api.js` uses `.text()` then `JSON.parse()` within a try-catch to prevent "Unexpected end of JSON" crashes when the server returns empty responses.
2. **UI Fallbacks**:
   - Avatars use `(p.firstName || 'P')[0]` to prevent crashes on undefined names.
   - Values use `|| 'N/A'` or `|| 'Not Checked'` to provide meaning to empty data fields.
3. **Route Safety**: `AppLayout.jsx` checks if `moduleMeta[item]` exists before rendering a nav button, preventing crashes if a new role is added without metadata.

---

## 6. Backend Repository Pattern

The backend is cleanly divided into:
- **`index.js`**: Route definitions and auth middleware.
- **`repository.js`**: Pure database queries. **Crucial**: All utility functions (like `createAuditLog`) must be **exported** specifically to be used by the API layer.

---

## 8. Premium Design System Implementation

The v2.0 update introduces the **Premium Glassmorphism** system.

- **Variable Injection**: Themes are managed in `AppLayout.jsx` by setting `--tenant-primary` and `--tenant-accent` on the root container.
- **Glass Utility**: Use the `.premium-glass` class on any panel to apply the standardized blur and border treatment.
- **Micro-Animations**: Transitions use `cubic-bezier(0.16, 1, 0.3, 1)` for a "premium" tactile feel during page switches.

---

## 9. Common Workflows (Updated)

- **Adding a New Module**:
  1. Add metadata to `client/src/config/modules.js`.
  2. Create Page component in `client/src/pages/`.
  3. Wrap main panels in `.premium-glass` for consistency.
  4. Register the route in `client/src/App.jsx`.
