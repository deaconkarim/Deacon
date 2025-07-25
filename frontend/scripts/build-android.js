#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building Church App for Android...\n');

try {
  // Step 1: Build the web app
  console.log('📦 Building web assets...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Sync with Capacitor (Android only)
  console.log('📱 Syncing with Capacitor (Android)...');
  execSync('npx cap sync android', { stdio: 'inherit' });
  
  // Step 3: Copy web assets to Android
  console.log('🔄 Copying web assets to Android...');
  execSync('npx cap copy android', { stdio: 'inherit' });
  
  console.log('\n✅ Android build completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('• Open Android Studio: npx cap open android');
  console.log('• Live reload: npx cap run android -l --external');
  console.log('• Build APK: cd android && ./gradlew assembleDebug');
  console.log('• Install on device: npx cap run android');
  
} catch (error) {
  console.error('\n❌ Android build failed:', error.message);
  process.exit(1);
} 