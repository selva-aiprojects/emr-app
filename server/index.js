import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { testConnection } from './db/connection.js';

// ── Route Imports ─────────────────────────────────────────────
import authRoutes        from './routes/auth.routes.js';
import userRoutes        from './routes/user.routes.js';
import tenantRoutes      from './routes/tenant.routes.js';
import patientRoutes     from './routes/patient.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import encounterRoutes   from './routes/encounter.routes.js';
import billingRoutes     from './routes/billing.routes.js';
import pharmacyRoutes    from './routes/pharmacy.routes.js';
import inventoryRoutes   from './routes/inventory.routes.js';
import laboratoryRoutes  from './routes/laboratory.routes.js';
import reportRoutes      from './routes/report.routes.js';
import adminRoutes       from './routes/admin.routes.js';
import superadminRoutes  from './routes/superadmin.routes.js';
import supportRoutes     from './routes/support.routes.js';
import employeeRoutes    from './routes/employee.routes.js';
import hrRoutes          from './routes/hr.routes.js';
import insuranceRoutes   from './routes/insurance.routes.js';
import menuRoutes        from './routes/menu.js';
import clinicalRoutes    from './routes/clinical.routes.js';
import infrastructureRoutes from './routes/infrastructure.routes.js';
import communicationRoutes  from './routes/communication.routes.js';
import documentRoutes    from './routes/document.routes.js';
import bloodbankRoutes   from './routes/bloodbank.routes.js';
import ambulanceRoutes   from './routes/ambulance.routes.js';
import aiRoutes          from './routes/ai.routes.js';
import rolesRoutes        from './routes/roles.routes.js';
import clinicalMastersRoutes from './routes/clinical-masters.routes.js';
import masterRoutes      from './routes/master.routes.js';  // /api/bootstrap

const app = express();
const PORT = 4055;

// ── Core Middleware ───────────────────────────────────────────
app.use(cors({
  origin: ['http://127.0.0.1:5175', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health Check ─────────────────────────────────────────────
app.get('/api/version', (_req, res) => res.json({ version: '2.0.0', status: 'ok' }));
app.get('/api/health', (_req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// ── Route Mounting ────────────────────────────────────────────
app.use('/api',          authRoutes);          // POST /api/login, GET /api/me
app.use('/api/users',    userRoutes);
app.use('/api/tenants',  tenantRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/encounters',   encounterRoutes);
app.use('/api/billing',      billingRoutes);
app.use('/api/pharmacy',     pharmacyRoutes);
app.use('/api/inventory',    inventoryRoutes);
app.use('/api/laboratory',   laboratoryRoutes);
app.use('/api/reports',      reportRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/superadmin',   superadminRoutes);
app.use('/api/support',      supportRoutes);
app.use('/api/employees',    employeeRoutes);
app.use('/api/hr',           hrRoutes);
app.use('/api/insurance',    insuranceRoutes);
app.use('/api/menu',         menuRoutes);
app.use('/api/clinical',     clinicalRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/communication',  communicationRoutes);
app.use('/api/documents',    documentRoutes);
app.use('/api/bloodbank',    bloodbankRoutes);
app.use('/api/ambulance',    ambulanceRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/roles',           rolesRoutes);
app.use('/api/clinical-masters', clinicalMastersRoutes);
app.use('/api',              masterRoutes);  // GET /api/bootstrap — must be last /api mount

// ── 404 Fallback ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED_ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Boot ──────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 [STABLE_BACKEND] Listening on port ${PORT}`);
  const ok = await testConnection();
  if (!ok) {
    console.error('❌ DB connection failed on startup — check DATABASE_URL in .env');
  }
});

