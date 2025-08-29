#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the deployed URL from command line argument or use default
const deployedUrl = process.argv[2] || 'https://getdeacon.com';

try {
  // Set environment variable and run tests
  const command = `PLAYWRIGHT_BASE_URL=${deployedUrl} npx playwright test smoke.spec.js --project=chromium`;

  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
} 