const fs = require('fs');
const content = fs.readFileSync('d:/Training/working/emr-app/client/src/pages/EmrOnlyPage.jsx', 'utf8');

let openBrackets = 0;
let openBraces = 0;
let openParens = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
}

console.log('Brackets:', openBrackets);
console.log('Braces:', openBraces);
console.log('Parens:', openParens);
