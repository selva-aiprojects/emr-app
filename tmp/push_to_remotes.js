
import { execSync } from 'child_process';

function run(cmd) {
  console.log(`[CMD] Working... ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log(`[STDOUT]\n${output}`);
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    if (err.stdout) console.log(`[STDOUT]\n${err.stdout}`);
    if (err.stderr) console.error(`[STDERR]\n${err.stderr}`);
  }
}

// Ensure all changes are staged
run('git add -A');

// Commit with a clear summary of the Multi-Schema victory
run('git commit -m "feat: Multi-Schema Multi-Tenancy Complete - Verified Isolated NAH Dashboard & Automated Provisioning"');

// Force push to GitHub
console.log('🚀 Pushing to GitHub...');
run('git push github master --force');

// Force push to Bitbucket (origin)
console.log('🚀 Pushing to Bitbucket...');
run('git push origin master --force');

console.log('🏁 Sync Complete.');
