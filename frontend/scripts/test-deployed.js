#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Get the deployed URL from command line argument or use default
const deployedUrl = process.argv[2] || 'https://your-app.vercel.app';

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