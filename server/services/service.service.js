import prismaService from '../lib/prisma.js';

/**
 * Service Service Layer
 * Business logic for service catalog management
 */

export async function getServices(tenantId) {
  try {
    const db = prismaService.getTenantScopedPrisma(tenantId);
    const services = await db.service.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}

export async function getService(tenantId, serviceId) {
  try {
    const db = prismaService.getTenantScopedPrisma(tenantId);
    const service = await db.service.findUnique({
      where: {
        id: serviceId
      }
    });
    return service;
  } catch (error) {
    console.error('Error fetching service:', error);
    throw error;
  }
}

export async function createService(tenantId, serviceData) {
  try {
    const db = prismaService.getTenantScopedPrisma(tenantId);
    const service = await db.service.create({
      data: {
        ...serviceData,
        tenantId
      }
    });
    return service;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
}

export async function updateService(tenantId, serviceId, serviceData) {
  try {
    const db = prismaService.getTenantScopedPrisma(tenantId);
    const service = await db.service.update({
      where: {
        id: serviceId
      },
      data: serviceData
    });
    return service;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
}

export async function deleteService(tenantId, serviceId) {
  try {
    const db = prismaService.getTenantScopedPrisma(tenantId);
    const service = await db.service.update({
      where: {
        id: serviceId
      },
      data: {
        isActive: false
      }
    });
    return service;
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
}

export async function getServicesByCategory(tenantId, category) {
  try {
    const db = prismaService.getTenantScopedPrisma(tenantId);
    const services = await db.service.findMany({
      where: {
        isActive: true,
        category: category
      },
      orderBy: {
        name: 'asc'
      }
    });
    return services;
  } catch (error) {
    console.error('Error fetching services by category:', error);
    throw error;
  }
}

export async function searchServices(tenantId, searchTerm) {
  try {
    const db = prismaService.getTenantScopedPrisma(tenantId);
    const services = await db.service.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            code: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            category: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    return services;
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
}
