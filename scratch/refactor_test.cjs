const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'tests', 'complete_e2e_journey.spec.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Create shared variables and beforeAll
const beforeAllStr = `
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAdmin(page);
  });
  test.afterAll(async () => {
    await page.close();
  });
`;

content = content.replace(
  /test\.describe\.serial\('Complete E2E Hospital Journey \(NHGL\)', \(\) => \{\n  test\.setTimeout\(600000\);\s*\/\/[^\n]+/m,
  `test.describe.serial('Complete E2E Hospital Journey (NHGL)', () => {\n  test.setTimeout(600000); // 10 minutes total\n${beforeAllStr}\n  // STEP 1`
);

// 2. Remove page from test signature
content = content.replace(/test\(([^,]+),\s*async\s*\(\{\s*page\s*\}\)\s*=>\s*\{/g, "test($1, async () => {");

// 3. Remove await loginAsAdmin(page); from all tests
content = content.replace(/^\s*await loginAsAdmin\(page\);\n/gm, "");

fs.writeFileSync(file, content);
console.log('Test file refactored to use a shared page context!');
