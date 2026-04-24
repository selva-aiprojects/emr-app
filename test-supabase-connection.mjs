// Test Supabase Connection
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DATABASE_URL = "postgresql://postgres:'hms-app@2020'@db.vfmnjnwcorlqwxqdklfi.supabase.co:5432/postgres";

async function testSupabaseConnection() {
  let prisma;
  
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Initialize Prisma with Supabase (Prisma 7.x syntax)
    const adapter = new PrismaPg();
    prisma = new PrismaClient({
      adapter,
      log: ['info', 'warn', 'error'],
    });
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Database version:', result[0]);
    
    // Test if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 Existing tables:');
    if (tables.length === 0) {
      console.log('   No tables found - ready for fresh migration');
    } else {
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
    // Test tenant creation (if table exists)
    try {
      const tenantCount = await prisma.tenant.count();
      console.log(`👥 Existing tenants: ${tenantCount}`);
    } catch (error) {
      console.log('📝 Tenant table not found - will be created by migration');
    }
    
    console.log('✅ Supabase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Check: Is your Supabase project active?');
      console.log('💡 Check: Is the connection URL correct?');
    } else if (error.code === '28000') {
      console.log('💡 Check: Is the password correct?');
    } else if (error.code === '3D000') {
      console.log('💡 Check: Does the database exist?');
    }
    
    throw error;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔌 Disconnected from Supabase');
    }
  }
}

// Run the test
testSupabaseConnection().catch(console.error);
