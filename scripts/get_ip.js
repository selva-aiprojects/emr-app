import dns from 'node:dns/promises';

async function getIP() {
  const host = 'db.vfmnjnwcorlqwxqdklfi.supabase.co';
  console.log(`🔍 Resolving IP for ${host}...`);
  
  try {
    // Force IPv4 lookup
    const addresses = await dns.resolve4(host);
    console.log(`✅ IPv4: ${addresses[0]}`);
    process.exit(0);
  } catch (err) {
    console.log(`❌ IPv4 Resolution Failed: ${err.message}`);
    
    try {
      console.log('🔍 Attempting IPv6 resolution...');
      const addresses = await dns.resolve6(host);
      console.log(`✅ IPv6: ${addresses[0]}`);
      process.exit(0);
    } catch (err2) {
      console.log(`❌ IPv6 Resolution Failed: ${err2.message}`);
      
      // Try generic lookup
      try {
        const address = await dns.lookup(host);
        console.log(`✅ Lookup: ${address.address}`);
      } catch (err3) {
        console.log(`❌ All DNS resolutions failed: ${err3.message}`);
      }
    }
  }
}

getIP();
