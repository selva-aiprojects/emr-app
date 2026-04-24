# EMR Technical Handbook

Last updated: 2026-02-19

This handbook is focused on implementation workflows and maintenance rules for contributors.

## 1. Where to Change What
- Add/modify API contract: `server/index.js` and `server/db/repository.js`
- Change auth or access policy: `server/middleware/auth.middleware.js`
- Change subscription/feature gating: `server/middleware/featureFlag.middleware.js`
- Change app navigation or module wiring: `client/src/App.jsx`, `client/src/config/modules.js`
- Change page behavior: `client/src/pages/*.jsx`
- Change client API calls: `client/src/api.js`

## 2. Frontend Flow Rules
- Top-level state is intentionally centralized in `client/src/App.jsx`.
- Most pages receive data/actions via props, then trigger API calls through handlers defined in `App.jsx`.
- `view` in `App.jsx` controls active module rendering.
- Navigation visibility is computed from:
  - Backend permissions returned by `/api/bootstrap`
  - Frontend fallback map in `client/src/config/modules.js`

## 3. Backend Flow Rules
- Keep route handlers thin: validate input, enforce middleware, call repository, return JSON.
- Keep SQL and transformations in `server/db/repository.js`.
- Enforce tenant context on tenant-scoped routes (`requireTenant`).
- Enforce role/module access (`requirePermission`, `moduleGate`, and role checks).
- Write audit entries for state-changing actions where traceability matters.

## 4. Mandatory Guardrails
- No raw string-interpolated SQL for user data; use parameterized queries.
- Do not bypass tenant checks for tenant-scoped records.
- Keep role names normalized consistently (`Front Office`, `Support Staff`, `HR`, etc.).
- Preserve safe API response parsing in `client/src/api.js` (text then JSON parse fallback).

## 5. Change Playbooks

### Add a new module
1. Add module metadata in `client/src/config/modules.js`.
2. Add permissions in backend `PERMISSIONS` map (`server/middleware/auth.middleware.js`).
3. Create page component in `client/src/pages/`.
4. Register view rendering and handlers in `client/src/App.jsx`.
5. Add backend routes and repository functions as needed.
6. If subscription-gated, apply `moduleGate(...)`/feature checks in backend and `FeatureGate` in frontend.

### Add a new tenant-scoped entity
1. Add repository CRUD with `tenant_id` filtering.
2. Add API routes with `requireTenant`.
3. Add audit logging for create/update/delete.
4. Wire frontend calls in `client/src/api.js`.
5. Add page integration and refresh flow in `client/src/App.jsx`.

### Add a new report
1. Add repository aggregation query in `server/db/repository.js`.
2. Add route in `server/index.js` with `requirePermission('reports')`.
3. Add API helper in `client/src/api.js`.
4. Render in `client/src/pages/ReportsPage.jsx`.

## 6. Known Project Layout Notes
- Legacy files exist and should not be used as primary implementation:
  - `server/index_old.js`, `server/index_v2.js`
  - `client/src/api_old.js`, `client/src/api_v2.js`
- Main active entry points are:
  - `server/index.js`
  - `client/src/App.jsx`
  - `client/src/api.js`

## 7. Maintenance Checklist Before Merge
1. Confirm tenant checks and permission checks exist on new routes.
2. Confirm frontend and backend permission maps remain aligned.
3. Confirm new API errors are handled in UI without hard crash.
4. Confirm docs in this folder remain consistent with actual code paths.
