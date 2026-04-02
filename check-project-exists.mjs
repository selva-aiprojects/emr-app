// Check if Supabase project exists
import https from 'https';

const projectRef = 'vfmnjnwcorlqwxqdklfi';

function checkProjectExists() {
  return new Promise((resolve) => {
    console.log('🔍 Checking if Supabase project exists...');
    console.log(`📋 Project reference: ${projectRef}`);
    console.log('');
    
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Project exists! Status: ${res.statusCode}`);
      console.log(`🌐 Project URL: https://${projectRef}.supabase.co`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ Project check failed: ${error.message}`);
      console.log('💡 This means the project reference is likely incorrect');
      console.log('');
      console.log('🔧 Possible solutions:');
      console.log('1. Check your Supabase dashboard for the correct project reference');
      console.log('2. The project might not be active');
      console.log('3. There might be a typo in the project reference');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Request timed out');
      console.log('💡 Project might not exist or be accessible');
      resolve(false);
    });

    req.end();
  });
}

checkProjectExists().then((exists) => {
  if (!exists) {
    console.log('');
    console.log('🎯 Next steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Find your correct project reference');
    console.log('3. Get the actual connection string from database settings');
    console.log('4. Share the correct details with me');
  }
}).catch(console.error);
