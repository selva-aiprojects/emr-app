import prismaService from '../server/lib/prisma.js';

async function seedServices() {
  try {
    console.log('🌱 Seeding services...');
    
    // Get first tenant
    const tenant = await prismaService.getInstance().tenant.findFirst();
    if (!tenant) {
      console.error('❌ No tenant found. Please seed tenants first.');
      return;
    }
    
    const db = prismaService.getTenantScopedPrisma(tenant.id);
    
    // Check if services already exist
    const existingServices = await db.service.count();
    if (existingServices > 0) {
      console.log('✅ Services already exist. Skipping seeding.');
      return;
    }
    
    // Seed services
    const services = [
      {
        name: 'General Consultation',
        code: 'GC001',
        category: 'Consultation',
        baseRate: 50.00,
        taxPercent: 5.00,
        description: 'General physician consultation'
      },
      {
        name: 'Specialist Consultation',
        code: 'SC001',
        category: 'Consultation',
        baseRate: 100.00,
        taxPercent: 5.00,
        description: 'Specialist doctor consultation'
      },
      {
        name: 'Complete Blood Count',
        code: 'LAB001',
        category: 'Laboratory',
        baseRate: 25.00,
        taxPercent: 5.00,
        description: 'Complete blood count test'
      },
      {
        name: 'X-Ray Chest',
        code: 'RAD001',
        category: 'Radiology',
        baseRate: 75.00,
        taxPercent: 5.00,
        description: 'Chest X-ray examination'
      },
      {
        name: 'ECG',
        code: 'CARD001',
        category: 'Cardiology',
        baseRate: 40.00,
        taxPercent: 5.00,
        description: 'Electrocardiogram'
      },
      {
        name: 'Vaccination',
        code: 'IMM001',
        category: 'Immunization',
        baseRate: 30.00,
        taxPercent: 5.00,
        description: 'Routine vaccination'
      },
      {
        name: 'Physical Therapy',
        code: 'PHY001',
        category: 'Therapy',
        baseRate: 60.00,
        taxPercent: 5.00,
        description: 'Physical therapy session'
      },
      {
        name: 'Dental Checkup',
        code: 'DEN001',
        category: 'Dental',
        baseRate: 45.00,
        taxPercent: 5.00,
        description: 'Dental examination'
      }
    ];
    
    for (const serviceData of services) {
      await db.service.create({
        data: serviceData
      });
    }
    
    console.log(`✅ Created ${services.length} services for tenant: ${tenant.name}`);
    
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    await prismaService.disconnect();
  }
}

seedServices();
