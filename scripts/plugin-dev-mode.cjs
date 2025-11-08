#!/usr/bin/env node
/**
 * Plugin Development Mode
 * Hot reload system for plugin development
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const PLUGINS_DIR = path.join(__dirname, '..', 'server', 'plugins');
const API_PATH = path.join(__dirname, '..', 'server', 'api.cjs');
const PORT = process.env.PORT || 5000;

let apiServer = null;
let watchedFiles = new Map();

console.log('Plugin Development Mode Started');
console.log('='.repeat(50));
console.log(`Watching: ${PLUGINS_DIR}`);
console.log(`API: ${API_PATH}`);
console.log('='.repeat(50));
console.log();

/**
 * Start the API server
 */
function startApiServer() {
  if (apiServer) {
    console.log('Stopping existing server...');
    apiServer.kill();
    apiServer = null;
  }

  console.log('Starting API server...');
  apiServer = spawn('node', [`"${API_PATH}"`], {
    stdio: 'inherit',
    shell: true,
    windowsVerbatimArguments: true
  });

  apiServer.on('error', (err) => {
    console.error('Failed to start API server:', err);
  });

  apiServer.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.log(`API server exited with code ${code}`);
    }
  });

  console.log(`✓ API server started on port ${PORT}`);
  console.log();
}

/**
 * Watch a file for changes
 */
function watchFile(filePath, callback) {
  if (watchedFiles.has(filePath)) {
    return;
  }

  let timeout = null;
  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      // Debounce file changes (wait 500ms)
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        callback(filePath);
      }, 500);
    }
  });

  watchedFiles.set(filePath, watcher);
}

/**
 * Watch all plugin files recursively
 */
function watchPluginDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      watchPluginDirectory(fullPath);
    } else if (entry.isFile()) {
      // Watch .js, .cjs, .json files
      const ext = path.extname(entry.name);
      if (['.js', '.cjs', '.json'].includes(ext)) {
        watchFile(fullPath, (changedFile) => {
          console.log(`\n${'='.repeat(50)}`);
          console.log(`File changed: ${path.relative(PLUGINS_DIR, changedFile)}`);
          console.log(`Time: ${new Date().toLocaleTimeString()}`);
          console.log('='.repeat(50));
          console.log('Reloading server...\n');
          
          // Restart the server
          startApiServer();
        });
      }
    }
  }
}

/**
 * Clean up on exit
 */
function cleanup() {
  console.log('\n\nShutting down...');
  
  if (apiServer) {
    apiServer.kill();
  }

  for (const watcher of watchedFiles.values()) {
    watcher.close();
  }

  console.log('Development mode stopped.');
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start watching
console.log('Setting up file watchers...');
watchPluginDirectory(PLUGINS_DIR);
console.log(`✓ Watching ${watchedFiles.size} files\n`);

// Start the API server
startApiServer();

console.log('='.repeat(50));
console.log('Development mode active!');
console.log('='.repeat(50));
console.log('Edit your plugin files and they will auto-reload.');
console.log('Press Ctrl+C to stop.\n');
