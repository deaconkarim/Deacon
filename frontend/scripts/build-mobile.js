#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building Deacon for mobile...\n');

try {
  // Step 1: Build the web app
  console.log('📦 Building web assets...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Sync with Capacitor
  console.log('📱 Syncing with Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  // Step 3: Copy web assets to platforms
  console.log('🔄 Copying web assets to native platforms...');
  execSync('npx cap copy', { stdio: 'inherit' });
  
  console.log('\n✅ Mobile build completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('• Android: npx cap open android');
  console.log('• iOS: npx cap open ios (requires Xcode)');
  console.log('• Live reload: npx cap run android -l --external');
  console.log('• Build APK: cd android && ./gradlew assembleDebug');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
} 