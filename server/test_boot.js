import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

console.log('Testing imports...');
try {
  const { default: express } = await import('express');
  const { default: cors } = await import('cors');
  console.log('Basic imports OK');
  
  const repo = await import('./db/repository.js');
  console.log('Repo imports OK');
  
  fs.writeFileSync('BOOT_SUCCESS.txt', 'OK');
} catch (err) {
  fs.writeFileSync('BOOT_FAIL.txt', err.stack);
  console.error(err);
}
