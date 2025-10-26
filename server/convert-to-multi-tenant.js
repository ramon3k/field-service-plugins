// Script to automatically update api.js for multi-tenant support
// This replaces all `pool` references with `req.tenantPool`

const fs = require('fs');
const path = require('path');

const apiFilePath = path.join(__dirname, 'api.js');

console.log('🔄 Updating api.js for multi-tenant support...\n');

// Read the current api.js
let content = fs.readFileSync(apiFilePath, 'utf8');

// Backup original file
const backupPath = path.join(__dirname, 'api.js.backup');
fs.writeFileSync(backupPath, content);
console.log(`✅ Created backup: ${backupPath}`);

// 1. Add require statement after other requires (after const upload = multer...)
const requireStatement = `
// Multi-tenant support
const { tenantMiddleware, getTenantHealthCheck, connectionManager } = require('./tenant-middleware');
`;

// Find the line after multer setup
const insertAfter = 'const upload = multer({ storage });';
const insertIndex = content.indexOf(insertAfter) + insertAfter.length;
content = content.slice(0, insertIndex) + requireStatement + content.slice(insertIndex);

console.log('✅ Added tenant middleware require');

// 2. Add middleware after CORS (before routes)
const middlewareStatement = `
// Apply tenant middleware to all routes
app.use(tenantMiddleware);
console.log('🔄 Multi-tenant middleware enabled');
`;

// Find after app.use(express.json())
const jsonMiddleware = 'app.use(express.json());';
const middlewareIndex = content.indexOf(jsonMiddleware) + jsonMiddleware.length;
content = content.slice(0, middlewareIndex) + middlewareStatement + content.slice(middlewareIndex);

console.log('✅ Added tenant middleware to app');

// 3. Replace `pool.request()` with `req.tenantPool.request()`
// This is the main change - use tenant-specific pool instead of global pool
const poolPattern = /\bpool\.request\(\)/g;
const matches = content.match(poolPattern);
console.log(`📝 Found ${matches ? matches.length : 0} instances of pool.request()`);

content = content.replace(poolPattern, 'req.tenantPool.request()');

console.log('✅ Replaced pool.request() with req.tenantPool.request()');

// 4. Comment out or remove the old pool connection code
// Find and comment the old connectDB and pool initialization
content = content.replace(
  /\/\/ Create connection pool\s+let pool;/g,
  '// Create connection pool (now handled by tenant middleware)\n// let pool;'
);

content = content.replace(
  /\/\/ Connect to SQL Server\s+async function connectDB\(\) {[\s\S]*?}\s+\/\/ Initialize database connection\s+connectDB\(\);/g,
  `// Connect to SQL Server (now handled by tenant middleware)
// Connection is established per-tenant via tenantMiddleware
// async function connectDB() { ... }
// connectDB();
console.log('ℹ️  Multi-tenant mode: Database connections managed by tenant middleware');
`
);

console.log('✅ Disabled old single-database connection code');

// 5. Add health check endpoint
const healthCheckEndpoint = `
// Multi-tenant health check endpoint
app.get('/api/health/tenants', getTenantHealthCheck);
`;

// Add before the first app.get route
const firstRoute = content.indexOf('app.get(');
if (firstRoute > 0) {
  content = content.slice(0, firstRoute) + healthCheckEndpoint + '\n' + content.slice(firstRoute);
  console.log('✅ Added tenant health check endpoint');
}

// 6. Add graceful shutdown at the end
const shutdownCode = `
// Graceful shutdown - close all tenant connections
process.on('SIGTERM', async () => {
  console.log('📤 SIGTERM received, closing tenant connections...');
  await connectionManager.closeAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📤 SIGINT received, closing tenant connections...');
  await connectionManager.closeAll();
  process.exit(0);
});
`;

// Add before the final app.listen if it exists, otherwise at the end
const listenIndex = content.lastIndexOf('app.listen(');
if (listenIndex > 0) {
  content = content.slice(0, listenIndex) + shutdownCode + '\n' + content.slice(listenIndex);
  console.log('✅ Added graceful shutdown handlers');
} else {
  content += '\n' + shutdownCode;
  console.log('✅ Added graceful shutdown handlers');
}

// Write updated content
fs.writeFileSync(apiFilePath, content);

console.log('\n✅ Successfully updated api.js for multi-tenant support!');
console.log('\n📋 Next steps:');
console.log('1. Review the changes in api.js');
console.log('2. Run the database setup scripts');
console.log('3. Test with: curl http://localhost:5000/api/tickets?company=DEMO');
console.log('4. If something breaks, restore from: api.js.backup');
console.log('\n🎉 Your API is now multi-tenant ready!');
