import prismaService from './server/lib/prisma.js';

async function testPrismaConnection() {
  try {
    console.log('🔍 Testing Prisma connection...');
    
    // Test health check
    const health = await prismaService.healthCheck();
    console.log('💚 Database Health:', health);
    
    // Test creating a tenant
    const tenant = await prismaService.getInstance().tenant.create({
      data: {
        name: 'Test Hospital',
        email: 'test@hospital.com',
        subscriptionTier: 'Enterprise'
      }
    });
    console.log('📋 Created tenant:', tenant);
    
    // Test creating a patient
    const patient = await prismaService.getTenantScopedPrisma(tenant.id).patient.create({
      data: {
        mrn: 'MRN-0001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        gender: 'Male',
        phone: '+1-555-0123',
        email: 'john.doe@example.com'
      }
    });
    console.log('👤 Created patient:', patient);
    
    // Test querying with relations
    const patientWithRelations = await prismaService.getTenantScopedPrisma(tenant.id).patient.findUnique({
      where: { id: patient.id },
      include: {
        _count: {
          select: {
            appointments: true,
            encounters: true
          }
        }
      }
    });
    console.log('🔗 Patient with relations:', patientWithRelations);
    
    console.log('✅ Prisma ORM is working perfectly!');
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
  } finally {
    await prismaService.disconnect();
  }
}

testPrismaConnection();
