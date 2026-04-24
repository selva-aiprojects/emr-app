/**
 * Pharmacy Service Microservice - MedFlow EMR
 * 
 * Independent microservice for medication management
 * Port: 4001
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pharmacyRoutes from './routes/pharmacy.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PHARMACY_PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
 res.json({
   status: 'healthy',
   timestamp: new Date().toISOString(),
  service: 'MedFlow Pharmacy Service'
  });
});

// Pharmacy routes
app.use('/api/pharmacy/v1', pharmacyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Pharmacy Service Error:', err);
  
 res.status(err.statusCode || 500).json({
  success: false,
   error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║        💊 MedFlow Pharmacy Service Started              ║');
  console.log('║                                                          ║');
  console.log(`║        Base URL: http://localhost:${PORT}/api/pharmacy/v1    ║`);
  console.log('║                                                          ║');
  console.log('║        Endpoints:                                        ║');
  console.log('║          POST/prescriptions        - Create Rx         ║');
  console.log('║          POST /prescriptions/validate- Validate safety   ║');
  console.log('║          GET /pharmacy/queue       - Dispensing queue  ║');
  console.log('║          POST /pharmacy/dispense    - Dispense meds    ║');
  console.log('║          GET /drugs/search          - Search catalog    ║');
  console.log('║          GET /alerts/low-stock     - Low stock alerts  ║');
  console.log('║          GET /alerts/expiring      - Expiry alerts    ║');
  console.log('║                                                          ║');
  console.log('║        Features:                                         ║');
  console.log('║          ✓ Drug-drug interaction checking               ║');
  console.log('║          ✓ Allergy validation                            ║');
  console.log('║          ✓ Duplicate therapy detection                   ║');
  console.log('║          ✓ High-alert medication flags                  ║');
  console.log('║          ✓ FEFO inventory dispensing                    ║');
  console.log('║          ✓ Batch/expiry tracking                        ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
});

export default app;
