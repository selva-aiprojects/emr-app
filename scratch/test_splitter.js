import fs from 'fs';

function robustSqlSplit(sql) {
    return sql
        .split(/;(?=(?:[^$]*\$\$[^$]*\$\$)*[^$]*$)(?:\s*\n|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

const sql = fs.readFileSync('server/db/migrations/00_create_core_clinical_tables.sql', 'utf8');
const statements = robustSqlSplit(sql);

console.log(`Total statements: ${statements.length}`);
statements.forEach((s, i) => {
    console.log(`--- Statement ${i} ---`);
    console.log(s.slice(0, 100));
});
