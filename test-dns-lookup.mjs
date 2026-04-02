// DNS Lookup Test for Supabase
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

async function testDNSLookup() {
  const hostname = 'db.vfmnjnwcorlqwxqdklfi.supabase.co';
  
  try {
    console.log('🔍 Testing DNS lookup...');
    console.log(`📋 Hostname: ${hostname}`);
    console.log('');
    
    const result = await dnsLookup(hostname);
    console.log('✅ DNS lookup successful!');
    console.log(`📊 IP Address: ${result.address}`);
    console.log(`📊 Family: ${result.family === 4 ? 'IPv4' : 'IPv6'}`);
    
    return result.address;
    
  } catch (error) {
    console.log('❌ DNS lookup failed:', error.message);
    console.log('💡 This confirms the hostname does not exist');
    console.log('');
    console.log('🔧 Possible issues:');
    console.log('1. Project reference is incorrect');
    console.log('2. Project is not active');
    console.log('3. Database is not enabled');
    console.log('4. DNS propagation issue');
    
    return null;
  }
}

async function testAlternativeHosts() {
  const projectRef = 'vfmnjnwcorlqwxqdklfi';
  const alternatives = [
    `${projectRef}.supabase.co`,
    `db.${projectRef}.supabase.co`,
    `postgres.${projectRef}.supabase.co`,
  ];
  
  console.log('🧪 Testing alternative hostnames...');
  console.log('');
  
  for (const host of alternatives) {
    try {
      console.log(`🔍 Testing: ${host}`);
      const result = await dnsLookup(host);
      console.log(`✅ Found: ${result.address}`);
      return { host, ip: result.address };
    } catch (error) {
      console.log(`❌ Not found: ${host}`);
    }
  }
  
  return null;
}

async function main() {
  console.log('🔍 DNS Resolution Test for Supabase');
  console.log('=====================================');
  console.log('');
  
  // Test main host
  const mainResult = await testDNSLookup();
  
  if (!mainResult) {
    console.log('');
    // Test alternatives
    const altResult = await testAlternativeHosts();
    
    if (altResult) {
      console.log('');
      console.log(`🎉 Alternative host found: ${altResult.host} -> ${altResult.ip}`);
      console.log('📋 You can use this host instead!');
    } else {
      console.log('');
      console.log('❌ No working host found');
      console.log('');
      console.log('🎯 Next steps:');
      console.log('1. Check your Supabase dashboard');
      console.log('2. Verify the project reference is correct');
      console.log('3. Ensure the project is active');
      console.log('4. Get the correct connection string from database settings');
    }
  }
}

main().catch(console.error);
