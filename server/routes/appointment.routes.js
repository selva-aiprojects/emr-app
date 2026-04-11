import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all appointment/token routes
router.use(authenticate);
router.use(requireTenant);
router.use(moduleGate('appointments'));

/**
 * @route   GET /api/appointments
 * @desc    Get paginated appointments for a tenant
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const appointments = await repo.getAppointments(req.tenantId, limit, offset);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching paginated appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * @route   POST /api/opd-tokens
 * @desc    Generate a new OPD token for a patient/appointment
 */
router.post('/tokens', requirePermission('appointments'), async (req, res) => {
  try {
    const { patientId, departmentId, doctorId, priority = 'general', visitType = 'new', chiefComplaint, appointmentId } = req.body;

    if (!patientId || !departmentId) {
      return res.status(400).json({ error: 'patientId and departmentId are required' });
    }

    const token = await repo.generateOPDToken({
      tenantId: req.tenantId,
      patientId,
      departmentId,
      doctorId,
      priority,
      visitType,
      chiefComplaint,
      appointmentId,
      createdBy: req.user.id
    });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'opd.token.create',
      entityName: 'opd_token',
      entityId: token.id,
      details: { tokenNumber: token.full_token, priority, visitType }
    });

    res.status(201).json(token);
  } catch (error) {
    console.error('Error creating OPD token:', error);
    res.status(500).json({ error: 'Failed to create OPD token' });
  }
});

/**
 * @route   GET /api/opd-tokens
 * @desc    Get OPD tokens with various filters
 */
router.get('/tokens', requirePermission('appointments'), async (req, res) => {
  try {
    const { status, departmentId, doctorId, date, priority } = req.query;
    const tokens = await repo.getOPDTokens(req.tenantId, { status, departmentId, doctorId, date, priority });
    res.json(tokens);
  } catch (error) {
    console.error('Error fetching OPD tokens:', error);
    res.status(500).json({ error: 'Failed to fetch OPD tokens' });
  }
});

/**
 * @route   PATCH /api/opd-tokens/:id/status
 * @desc    Update OPD token status (e.g., waiting -> in_progress)
 */
router.patch('/tokens/:id/status', requirePermission('appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorId } = req.body;

    const validStatuses = ['waiting', 'called', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const token = await repo.updateTokenStatus(id, req.tenantId, status, { doctorId });
    if (!token) return res.status(404).json({ error: 'Token not found' });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'opd.token.update_status',
      entityName: 'opd_token',
      entityId: id,
      details: { oldStatus: token.status, newStatus: status }
    });

    res.json(token);
  } catch (error) {
    console.error('Error updating token status:', error);
    res.status(500).json({ error: 'Failed to update token status' });
  }
});

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment (Staff authored)
 */
router.post('/', requirePermission('appointments'), async (req, res) => {
  try {
    const { patientId, providerId, start, end, reason } = req.body;

    if (!patientId || !providerId || !start || !end) {
      return res.status(400).json({ error: 'patientId, providerId, start, and end are required' });
    }

    if (new Date(end) <= new Date(start)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const appointment = await repo.createAppointment({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId,
      providerId,
      start,
      end,
      reason,
      source: 'staff',
      status: 'scheduled',
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * @route   POST /api/appointments/self
 * @desc    Create a new appointment (Patient authored)
 */
router.post('/self', async (req, res) => {
  try {
    const { patientId, providerId, start, end, reason } = req.body;

    if (!patientId || !providerId || !start || !end) {
      return res.status(400).json({ error: 'patientId, providerId, start, and end are required' });
    }

    // Verify patient can only book for themselves
    if (req.user.role === 'Patient' && req.user.patientId !== patientId) {
      return res.status(403).json({ error: 'You can only book appointments for yourself' });
    }

    if (new Date(end) <= new Date(start)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const appointment = await repo.createAppointment({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId,
      providerId,
      start,
      end,
      reason,
      source: 'self',
      status: 'requested',
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating self appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * @route   PATCH /api/appointments/:id/reschedule
 * @desc    Reschedule an existing appointment
 */
router.patch('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, reason } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end are required' });
    }

    if (new Date(end) <= new Date(start)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const appointment = await repo.rescheduleAppointment({
      appointmentId: id,
      tenantId: req.tenantId,
      userId: req.user.id,
      start,
      end,
      reason,
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

/**
 * @route   GET /api/doctor-availability
 * @desc    Get availability slots for doctors
 */
router.get('/doctor-availability', requirePermission('appointments'), async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const availability = await repo.getDoctorAvailability(req.tenantId, doctorId || null, date || null);
    res.json(availability);
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ error: 'Failed to fetch doctor availability' });
  }
});

router.get('/doctor-availability/calendar', requirePermission('appointments'), async (req, res) => {
  try {
    const { doctorId, startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const calendar = await repo.getDoctorAvailabilityCalendar(req.tenantId, doctorId || null, startDate, endDate);
    res.json(calendar);
  } catch (error) {
    console.error('Error fetching doctor availability calendar:', error);
    res.status(500).json({ error: 'Failed to fetch doctor availability calendar' });
  }
});

router.post('/doctor-availability', requirePermission('appointments'), async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, slotDurationMinutes = 15, maxAppointments = 1, notes } = req.body;
    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'doctorId, date, startTime, and endTime are required' });
    }

    const slots = await repo.generateDoctorAvailabilitySlots({
      tenantId: req.tenantId,
      doctorId,
      date,
      startTime,
      endTime,
      slotDurationMinutes,
      maxAppointmentsPerSlot: maxAppointments,
      createdBy: req.user.id
    });

    if (notes) {
      await Promise.all(
        slots.map((slot) => repo.updateDoctorAvailabilitySlot(slot.id, req.tenantId, { notes }))
      );
    }

    res.status(201).json(slots);
  } catch (error) {
    console.error('Error creating doctor availability:', error);
    res.status(500).json({ error: 'Failed to create doctor availability' });
  }
});

/**
 * @route   GET /api/doctor-availability/slots
 * @desc    Get specific available slots for a doctor/date
 */
router.get('/doctor-availability/slots', requirePermission('appointments'), async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ error: 'doctorId and date are required' });

    const slots = await repo.getAvailableSlotsForDoctor(req.tenantId, doctorId, date);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

export default router;
