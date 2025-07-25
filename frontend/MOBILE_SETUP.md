# Church App Mobile Setup Guide

This guide will help you set up and build native mobile apps for the Church App using Capacitor.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Android Studio** (for Android development)
3. **Xcode** (for iOS development - macOS only)

### Installation

1. **Install Capacitor dependencies:**
   ```bash
   npm install
   ```

2. **Build for Android:**
   ```bash
   npm run mobile:build:android
   ```

3. **Open in Android Studio:**
   ```bash
   npm run mobile:open:android
   ```

## 📱 Available Scripts

### Build Scripts
- `npm run mobile:build` - Build for all platforms (may fail on iOS without Xcode)
- `npm run mobile:build:android` - Build for Android only
- `npm run mobile:sync` - Sync all platforms
- `npm run mobile:sync:android` - Sync Android only
- `npm run mobile:copy` - Copy web assets to all platforms
- `npm run mobile:copy:android` - Copy web assets to Android only

### Development Scripts
- `npm run mobile:open:android` - Open Android Studio
- `npm run mobile:open:ios` - Open Xcode (requires Xcode)
- `npm run mobile:run:android` - Run on Android with live reload
- `npm run mobile:run:ios` - Run on iOS with live reload

## 🔧 Platform Setup

### Android Setup

1. **Install Android Studio:**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK
   - Set up Android Virtual Device (AVD) or connect physical device

2. **Build and run:**
   ```bash
   npm run mobile:build:android
   npm run mobile:open:android
   ```

3. **Live development:**
   ```bash
   npm run mobile:run:android
   ```

### iOS Setup (macOS only)

1. **Install Xcode:**
   - Download from Mac App Store
   - Install Command Line Tools: `xcode-select --install`
   - Accept license: `sudo xcodebuild -license`

2. **Install CocoaPods:**
   ```bash
   sudo gem install cocoapods
   ```

3. **Build and run:**
   ```bash
   npm run mobile:build
   npm run mobile:open:ios
   ```

## 📱 Native Features

The Church App includes several native features:

### Camera Integration
- Take photos of members
- Upload profile pictures
- Document scanning

### Notifications
- Event reminders
- Prayer request alerts
- Attendance reminders
- Giving reminders

### Haptic Feedback
- Button presses
- Navigation
- Success/error states

### Network Status
- Offline detection
- Connection monitoring
- Sync status

### Device Integration
- Status bar customization
- Splash screen
- Keyboard handling
- App lifecycle management

## 🏗️ Project Structure

```
frontend/
├── android/                 # Android native project
├── ios/                    # iOS native project (if Xcode available)
├── src/
│   ├── lib/
│   │   ├── capacitorService.js      # Capacitor API wrapper
│   │   └── mobileNotificationService.js  # Notification handling
│   └── components/
│       ├── MobileLayout.jsx         # Mobile-optimized layout
│       └── MobilePhotoCapture.jsx   # Camera integration
├── capacitor.config.ts     # Capacitor configuration
└── scripts/
    ├── build-mobile.js     # Full mobile build script
    └── build-android.js    # Android-only build script
```

## 🔧 Configuration

### Capacitor Config (`capacitor.config.ts`)
- App ID: `com.churchapp.deacon`
- App Name: `Church App`
- Splash screen configuration
- Status bar styling
- Plugin settings

### Native Features
- **Camera:** Photo capture and editing
- **Notifications:** Local push notifications
- **Haptics:** Tactile feedback
- **Network:** Connection monitoring
- **Storage:** Local data persistence
- **Status Bar:** Custom styling
- **Splash Screen:** Branded loading screen

## 🚀 Development Workflow

### 1. Web Development
```bash
npm run dev
```
- Develop your app in the browser
- Test responsive design
- Debug with browser tools

### 2. Mobile Testing
```bash
npm run mobile:build:android
npm run mobile:run:android
```
- Test on Android device/emulator
- Live reload for development
- Native feature testing

### 3. Production Build
```bash
npm run mobile:build:android
cd android
./gradlew assembleRelease
```

## 📱 Native Features Usage

### Camera
```javascript
import CapacitorService from '@/lib/capacitorService';

// Take a photo
const photoPath = await CapacitorService.takePhoto();
```

### Notifications
```javascript
import MobileNotificationService from '@/lib/mobileNotificationService';

// Show event reminder
await MobileNotificationService.showEventReminder(
  'Sunday Service',
  '9:00 AM',
  'event_123'
);
```

### Haptic Feedback
```javascript
import CapacitorService from '@/lib/capacitorService';

// Trigger haptic feedback
await CapacitorService.triggerHaptic();
```

## 🔍 Troubleshooting

### Common Issues

1. **Android Studio not found:**
   - Install Android Studio
   - Set ANDROID_HOME environment variable
   - Add platform-tools to PATH

2. **iOS build fails:**
   - Install Xcode
   - Accept license agreements
   - Install CocoaPods

3. **Plugin sync issues:**
   ```bash
   npm run mobile:sync:android
   ```

4. **Live reload not working:**
   - Check device/emulator connection
   - Ensure same network
   - Try `--external` flag

### Debug Commands

```bash
# Check Capacitor status
npx cap doctor

# List installed plugins
npx cap ls

# Update plugins
npx cap update

# Check Android setup
npx cap doctor android

# Check iOS setup
npx cap doctor ios
```

## 📦 Distribution

### Android APK
```bash
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

### iOS App Store
1. Open project in Xcode
2. Configure signing and capabilities
3. Archive and upload to App Store Connect

## 🔄 Updates

### Adding New Plugins
```bash
npm install @capacitor/plugin-name
npx cap sync
```

### Updating Capacitor
```bash
npm update @capacitor/core @capacitor/cli
npx cap update
```

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Development](https://developer.android.com/)
- [iOS Development](https://developer.apple.com/)
- [React Native Web](https://necolas.github.io/react-native-web/)

## 🤝 Support

For issues specific to the Church App mobile setup:
1. Check this guide
2. Review Capacitor documentation
3. Check platform-specific setup guides
4. Test with minimal example first 