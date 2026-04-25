const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'client/src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace page-title-rich or similar variants inside page-header-premium
  content = content.replace(/className=[\"'](page-title-rich|text-xl font-black text-slate-900|text-2xl font-black text-slate-900|text-2xl font-bold|text-2xl font-bold text-slate-900)[\"']/g, 'className=\"text-3xl font-black text-white flex items-center gap-3\"');
  
  // Replace dim-label or similar subtitles
  content = content.replace(/className=[\"']dim-label( italic)?[\"']/g, 'className=\"premium-subtitle !text-white/80 mt-2\"');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    updatedCount++;
    console.log('Updated: ' + file);
  }
}
console.log('Total files updated: ' + updatedCount);
