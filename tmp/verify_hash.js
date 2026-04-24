import bcrypt from 'bcryptjs';

const hash = '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC';
const candidate = 'Admin@123';

async function verify() {
  const match = await bcrypt.compare(candidate, hash);
  console.log(`Hash Match [${candidate}]: ${match}`);
  
  if (!match) {
    const candidate2 = 'Test@123';
    const match2 = await bcrypt.compare(candidate2, hash);
    console.log(`Hash Match [${candidate2}]: ${match2}`);
  }
}

verify();
