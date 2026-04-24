import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Target: Supabase Sydney
 */
const targetUrl = "postgresql://postgres.vfmnjnwcorlqwxqdklfi:hms-app%402020@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?schema=emr";

async function pushSchema() {
  console.log('🏗️ Pushing Prisma Schema to Supabase Sydney...');
  console.log('🔗 Target: aws-1-ap-southeast-2.pooler.supabase.com');
  
  try {
    // We use the Session Pooler (Port 5432) for Schema Push as it's more stable for DDL commands
    process.env.DATABASE_URL = targetUrl;
    
    console.log('⏳ Running "npx prisma db push"...');
    const output = execSync('npx prisma db push --accept-data-loss', { 
      env: { ...process.env, DATABASE_URL: targetUrl },
      stdio: 'inherit' 
    });
    
    console.log('\n✅ SCHEMA PUSH COMPLETED!');
    console.log('🚀 Your Supabase tables are now ready for data migration.');
    
  } catch (error) {
    console.error('\n❌ Schema Push Failed!');
    console.error(error.message);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Ensure you have an active internet connection.');
    console.log('2. Verify that the "emr" schema was created successfully by the previous sync run.');
  }
}

pushSchema();
