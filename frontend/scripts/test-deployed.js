#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the deployed URL from command line argument or use default
const deployedUrl = process.argv[2] || 'https://getdeacon.com';

console.log(`🚀 Running E2E tests against: ${deployedUrl}`);

try {
  // Set environment variable and run tests
  const command = `PLAYWRIGHT_BASE_URL=${deployedUrl} npx playwright test smoke.spec.js --project=chromium`;
  
  console.log(`Running: ${command}`);
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Tests completed successfully!');
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
} 