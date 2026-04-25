import fs from 'fs';
const files = ['output.txt', 'error.log', 'server-dev.out.log', 'server-dev.err.log'];
for (const file of files) {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf16le');
      fs.writeFileSync(file + '.utf8', content, 'utf8');
      console.log(`Converted ${file} to ${file}.utf8`);
    } catch (e) {
      console.error(`Failed to convert ${file}:`, e.message);
    }
  }
}
