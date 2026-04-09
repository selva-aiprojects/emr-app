import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

class PrismaService {
  constructor() {
    this.prisma = new PrismaClient({
      adapter: new PrismaPg(),
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Prisma connected to database');
    } catch (error) {
      console.error('❌ Prisma connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
    console.log('🔌 Prisma disconnected from database');
  }

  // Tenant-aware queries
  getTenantScopedPrisma(tenantId) {
    return {
      // Patient operations
      patient: {
        findMany: (args) => this.prisma.patient.findMany({ ...args, where: { ...args.where, tenant_id: tenantId } }),
        findUnique: (args) => this.prisma.patient.findUnique(args),
        create: (args) => this.prisma.patient.create({ ...args, data: { ...args.data, tenant_id: tenantId } }),
        update: (args) => this.prisma.patient.update(args),
        delete: (args) => this.prisma.patient.delete(args),
        count: (args) => this.prisma.patient.count({ ...args, where: { ...args.where, tenant_id: tenantId } }),
      },

      // User operations
      user: {
        findMany: (args) => this.prisma.user.findMany({ ...args, where: { ...args.where, tenant_id: tenantId } }),
        findUnique: (args) => this.prisma.user.findUnique(args),
        create: (args) => this.prisma.user.create({ ...args, data: { ...args.data, tenant_id: tenantId } }),
        update: (args) => this.prisma.user.update(args),
        delete: (args) => this.prisma.user.delete(args),
      },

      // Appointment operations
      appointment: {
        findMany: (args) => this.prisma.appointment.findMany({ ...args, where: { ...args.where, tenant_id: tenantId } }),
        findUnique: (args) => this.prisma.appointment.findUnique(args),
        create: (args) => this.prisma.appointment.create({ ...args, data: { ...args.data, tenant_id: tenantId } }),
        update: (args) => this.prisma.appointment.update(args),
        delete: (args) => this.prisma.appointment.delete(args),
      },

      // Encounter operations
      encounter: {
        findMany: (args) => this.prisma.encounter.findMany({ ...args, where: { ...args.where, tenant_id: tenantId } }),
        findUnique: (args) => this.prisma.encounter.findUnique(args),
        create: (args) => this.prisma.encounter.create({ ...args, data: { ...args.data, tenant_id: tenantId } }),
        update: (args) => this.prisma.encounter.update(args),
        delete: (args) => this.prisma.encounter.delete(args),
      },

      // Medical History operations
      medicalHistory: {
        findMany: (args) => this.prisma.medicalHistory.findMany(args),
        create: (args) => this.prisma.medicalHistory.create(args),
        update: (args) => this.prisma.medicalHistory.update(args),
        delete: (args) => this.prisma.medicalHistory.delete(args),
      },

      // Medication operations
      medication: {
        findMany: (args) => this.prisma.medication.findMany(args),
        create: (args) => this.prisma.medication.create(args),
        update: (args) => this.prisma.medication.update(args),
        delete: (args) => this.prisma.medication.delete(args),
      },

      // Diagnostic operations
      diagnostic: {
        findMany: (args) => this.prisma.diagnostic.findMany(args),
        create: (args) => this.prisma.diagnostic.create(args),
        update: (args) => this.prisma.diagnostic.update(args),
        delete: (args) => this.prisma.diagnostic.delete(args),
      },

      // Vital operations
      vital: {
        findMany: (args) => this.prisma.vital.findMany(args),
        create: (args) => this.prisma.vital.create(args),
        update: (args) => this.prisma.vital.update(args),
        delete: (args) => this.prisma.vital.delete(args),
      },

      // Invoice operations
      invoice: {
        findMany: (args) => this.prisma.invoice.findMany({ ...args, where: { ...args.where, tenant_id: tenantId } }),
        findUnique: (args) => this.prisma.invoice.findUnique(args),
        create: (args) => this.prisma.invoice.create({ ...args, data: { ...args.data, tenant_id: tenantId } }),
        update: (args) => this.prisma.invoice.update(args),
        delete: (args) => this.prisma.invoice.delete(args),
      },

      // Inventory operations
      inventory: {
        findMany: (args) => this.prisma.inventory.findMany({ ...args, where: { ...args.where, tenant_id: tenantId } }),
        findUnique: (args) => this.prisma.inventory.findUnique(args),
        create: (args) => this.prisma.inventory.create({ ...args, data: { ...args.data, tenant_id: tenantId } }),
        update: (args) => this.prisma.inventory.update(args),
        delete: (args) => this.prisma.inventory.delete(args),
      },

      // Employee operations
      employee: {
        findMany: (args) => this.prisma.employee.findMany({ ...args, where: { ...args.where, tenant_id: tenantId } }),
        findUnique: (args) => this.prisma.employee.findUnique(args),
        create: (args) => this.prisma.employee.create({ ...args, data: { ...args.data, tenant_id: tenantId } }),
        update: (args) => this.prisma.employee.update(args),
        delete: (args) => this.prisma.employee.delete(args),
      },

      // Department operations
      department: {
        findMany: (args) => this.prisma.department.findMany({ ...args, where: { ...args.where, tenant_id: tenantId } }),
        findUnique: (args) => this.prisma.department.findUnique(args),
        create: (args) => this.prisma.department.create({ ...args, data: { ...args.data, tenant_id: tenantId } }),
        update: (args) => this.prisma.department.update(args),
        delete: (args) => this.prisma.department.delete(args),
      },

      // Tenant operations (no tenant scoping needed)
      tenant: this.prisma.tenant,
    };
  }

  // Raw query support for complex operations
  async queryRaw(query, parameters = []) {
    return this.prisma.$queryRaw(query, ...parameters);
  }

  // Transaction support
  async transaction(callback) {
    return this.prisma.$transaction(callback);
  }

  // Health check
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }

  // Get instance
  getInstance() {
    return this.prisma;
  }
}

// Singleton instance
const prismaService = new PrismaService();

export default prismaService;
