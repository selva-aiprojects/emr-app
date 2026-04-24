# HR, Accounts, and Billing Enhancements

STATUS: **COMPLETED** ✅

## Overview
New modules have been added to handle Employee Attendance, Financial Accounting, and Enhanced Patient Billing. All three modules are fully functional end-to-end.

## 1. HR & Attendance ✅
- **Module**: Employees
- **Features**:
  - **Employee Master**: Manageable list of staff with roles, departments, designations, shifts, and salaries.
  - **Daily Attendance**: Mark Check-in/Check-out times and status (Present, Absent, Half-Day). View daily records via `GET /api/attendance`.
  - **Leave Management**: Track employee leave requests (Casual, Sick, Earned).
- **Implementation**:
  - Database: `emr.attendance` table (via `002_finance_hr.sql`)
  - Repository: `recordAttendance()`, `getAttendance()` (in `repo_financials.js`)
  - API: `POST /api/attendance`, `GET /api/attendance` (server/index.js)
  - Frontend: `EmployeesPage.jsx` — tabbed UI (Roster / Attendance / Leaves) with attendance history display
  - Audit: All attendance operations logged via `createAuditLog`

## 2. Accounts Payable & Financials ✅
- **Module**: Accounts Payable
- **Features**:
  - **Record Outflows**: Track operational expenses categorized by type (Salary, Purchase, Maintenance, etc.).
  - **Payment Methods**: Record how expenses are paid (Bank Transfer, Cash, Cheque, Card).
  - **Financial Snapshot**: Real-time view of **Inward** (Revenue from Invoices) vs **Outward** (Expenses), giving a net balance.
  - **Payroll Projection**: Estimates monthly salary liability based on active employees.
  - **Expense Ledger**: Full transaction history with category badges, payment methods, and totals.
  - **Category Breakdown**: Visual horizontal bar chart showing expense distribution.
- **Implementation**:
  - Database: `emr.expenses` table (via `002_finance_hr.sql`)
  - Repository: `addExpense()`, `getExpenses()`, `getFinancialSummary()` (in `repo_financials.js`)
  - API: `POST /api/expenses`, `GET /api/expenses`, `GET /api/reports/financials` (server/index.js)
  - Frontend: `AccountsPage.jsx` — tabbed UI (Snapshot / Record / Ledger) with finance cards, breakdown chart, transaction table
  - Permissions: Expense route uses `requirePermission('billing')`, Admin & Billing roles see `accounts` in nav
  - Audit: All expense operations logged via `createAuditLog`

## 3. Enhanced Billing & Payments ✅
- **Module**: Billing
- **Features**:
  - **Payment Methods**: Supports selecting payment modes (Cash, Card, UPI, Insurance) when creating an invoice or marking it as paid.
  - **Immediate Payment**: Invoices can be marked as "Paid/Settled" instantly upon creation if a payment method is selected.
  - **Audit Logging**: All payment methods and financial transactions are logged in the audit trail.
- **Implementation**:
  - Repository: `createInvoice()` accepts `paymentMethod`, `payInvoice()` logs payment method in audit
  - API: `POST /api/invoices` (paymentMethod param), `PATCH /api/invoices/:id/pay` (paymentMethod param)
  - Frontend: `BillingPage.jsx` — payment method selector in create form, print invoice with clinic branding

## Database Updates
Migration file `database/migrations/002_finance_hr.sql` creates the `attendance` and `expenses` tables with:
- Proper UUID primary keys, tenant multi-tenancy
- CHECK constraints on status and category enums
- Indexes on common query columns
- Auto-updating `updated_at` triggers

## Permissions Model
| Role | Modules |
| --- | --- |
| Admin | dashboard, patients, appointments, emr, inpatient, pharmacy, billing, inventory, employees, reports, **accounts**, admin, users |
| Billing | dashboard, billing, **accounts**, reports |
| Other roles | Unchanged |

## API Endpoints Added
| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| POST | `/api/attendance` | employees | Record daily attendance |
| GET | `/api/attendance` | employees | Get attendance records by date |
| POST | `/api/expenses` | billing | Record a new expense |
| GET | `/api/expenses` | billing | Get expense list (optional month filter) |
| GET | `/api/reports/financials` | reports | Financial summary (income vs expenses) |
