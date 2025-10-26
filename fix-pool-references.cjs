const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'api.cjs');
let content = fs.readFileSync(filePath, 'utf8');

// Count initial occurrences
const initialCount = (content.match(/(?<!req\.)pool\.request\(\)/g) || []).length;
console.log(`Found ${initialCount} occurrences of 'pool.request()' to replace\n`);

// Replace all remaining 'pool.request()' with 'req.pool.request()'
// But NOT 'req.pool.request()' or 'tenantPool.request()'
content = content.replace(/(?<!req\.)(?<!tenant)pool\.request\(\)/g, 'req.pool.request()');

// Count after replacement
const remainingCount = (content.match(/(?<!req\.)(?<!tenant)pool\.request\(\)/g) || []).length;

fs.writeFileSync(filePath, content, 'utf8');

console.log(`✅ Replaced pool.request() with req.pool.request()`);
console.log(`   Remaining occurrences: ${remainingCount}`);
console.log(`   File saved: ${filePath}`);
