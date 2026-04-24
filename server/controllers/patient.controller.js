const prismaService = require('../lib/prisma');

class PatientController {
  // Get all patients for a tenant
  async getPatients(req, res) {
    try {
      const { tenantId } = req.user;
      const { limit = 50, offset = 0, search } = req.query;

      const db = prismaService.getTenantScopedPrisma(tenantId);
      
      let whereClause = {};
      if (search) {
        whereClause = {
          OR: [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } },
            { mrn: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        };
      }

      const patients = await db.patient.findMany({
        where: whereClause,
        include: {
          appointments: {
            where: { status: 'Scheduled' },
            orderBy: { scheduled_start: 'asc' },
            take: 1
          },
          _count: {
            select: {
              appointments: true,
              encounters: true
            }
          }
        },
        orderBy: { last_name: 'asc', first_name: 'asc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      const total = await db.patient.count({ where: whereClause });

      res.json({
        patients,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + limit < total
        }
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  }

  // Get single patient by ID
  async getPatient(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const db = prismaService.getTenantScopedPrisma(tenantId);
      
      const patient = await db.patient.findUnique({
        where: { id },
        include: {
          appointments: {
            orderBy: { appointmentDate: 'desc' },
            take: 10
          },
          encounters: {
            orderBy: { encounterDate: 'desc' },
            take: 5
          },
          medicalHistory: {
            orderBy: { startDate: 'desc' }
          },
          medications: {
            where: { status: 'Active' },
            orderBy: { startDate: 'desc' }
          },
          diagnostics: {
            orderBy: { testDate: 'desc' },
            take: 10
          },
          vitals: {
            orderBy: { recordedAt: 'desc' },
            take: 20
          },
          billing: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      res.json(patient);
    } catch (error) {
      console.error('Error fetching patient:', error);
      res.status(500).json({ error: 'Failed to fetch patient' });
    }
  }

  // Create new patient
  async createPatient(req, res) {
    try {
      const { tenantId } = req.user;
      const patientData = req.body;

      const db = prismaService.getTenantScopedPrisma(tenantId);

      // Generate MRN if not provided
      if (!patientData.mrn) {
        const lastPatient = await db.patient.findFirst({
          orderBy: { created_at: 'desc' },
          select: { mrn: true }
        });
        
        const lastNumber = lastPatient?.mrn?.split('-')[1] || '0000';
        const nextNumber = String(parseInt(lastNumber) + 1).padStart(4, '0');
        patientData.mrn = `MRN-${nextNumber}`;
      }

      // Map camelCase to snake_case for DB
      const mappedData = {
        mrn: patientData.mrn,
        first_name: patientData.firstName || patientData.first_name,
        last_name: patientData.lastName || patientData.last_name,
        email: patientData.email,
        phone: patientData.phone,
        date_of_birth: patientData.dob ? new Date(patientData.dob) : (patientData.date_of_birth ? new Date(patientData.date_of_birth) : null),
        gender: patientData.gender,
        address: patientData.address,
        blood_group: patientData.bloodGroup || patientData.blood_group
      };

      const patient = await db.patient.create({
        data: mappedData,
        include: {
          _count: {
            select: {
              appointments: true,
              encounters: true
            }
          }
        }
      });

      res.status(201).json(patient);
    } catch (error) {
      console.error('Error creating patient:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Patient with this MRN already exists' });
      }
      
      res.status(500).json({ error: 'Failed to create patient' });
    }
  }

  // Update patient
  async updatePatient(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const updateData = req.body;

      const db = prismaService.getTenantScopedPrisma(tenantId);

      const patient = await db.patient.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              appointments: true,
              encounters: true
            }
          }
        }
      });

      res.json(patient);
    } catch (error) {
      console.error('Error updating patient:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      res.status(500).json({ error: 'Failed to update patient' });
    }
  }

  // Delete patient (soft delete)
  async deletePatient(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const db = prismaService.getTenantScopedPrisma(tenantId);

      await db.patient.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
      console.error('Error deleting patient:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      res.status(500).json({ error: 'Failed to delete patient' });
    }
  }

  // Get patient medical history
  async getMedicalHistory(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const db = prismaService.getTenantScopedPrisma(tenantId);

      // Verify patient exists and belongs to tenant
      const patient = await db.patient.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const medicalHistory = await db.medicalHistory.findMany({
        where: { patientId: id },
        orderBy: { startDate: 'desc' }
      });

      res.json(medicalHistory);
    } catch (error) {
      console.error('Error fetching medical history:', error);
      res.status(500).json({ error: 'Failed to fetch medical history' });
    }
  }

  // Get patient medications
  async getMedications(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const db = prismaService.getTenantScopedPrisma(tenantId);

      // Verify patient exists
      const patient = await db.patient.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const medications = await db.medication.findMany({
        where: { patientId: id },
        orderBy: { startDate: 'desc' }
      });

      res.json(medications);
    } catch (error) {
      console.error('Error fetching medications:', error);
      res.status(500).json({ error: 'Failed to fetch medications' });
    }
  }

  // Get patient diagnostics
  async getDiagnostics(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const db = prismaService.getTenantScopedPrisma(tenantId);

      // Verify patient exists
      const patient = await db.patient.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const diagnostics = await db.diagnostic.findMany({
        where: { patientId: id },
        orderBy: { testDate: 'desc' }
      });

      res.json(diagnostics);
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      res.status(500).json({ error: 'Failed to fetch diagnostics' });
    }
  }

  // Get patient vitals
  async getVitals(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const db = prismaService.getTenantScopedPrisma(tenantId);

      // Verify patient exists
      const patient = await db.patient.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const vitals = await db.vital.findMany({
        where: { patientId: id },
        orderBy: { recordedAt: 'desc' },
        take: 50 // Last 50 vital readings
      });

      res.json(vitals);
    } catch (error) {
      console.error('Error fetching vitals:', error);
      res.status(500).json({ error: 'Failed to fetch vitals' });
    }
  }

  // Get patient billing
  async getBilling(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const db = prismaService.getTenantScopedPrisma(tenantId);

      // Verify patient exists
      const patient = await db.patient.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const billing = await db.invoice.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' }
      });

      res.json(billing);
    } catch (error) {
      console.error('Error fetching billing:', error);
      res.status(500).json({ error: 'Failed to fetch billing' });
    }
  }
}

module.exports = new PatientController();
