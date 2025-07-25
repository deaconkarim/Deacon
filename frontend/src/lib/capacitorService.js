import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Camera, CameraResultType } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Capacitor Service for Deacon
 * Handles native device features and provides a unified API
 */
export class CapacitorService {
  
  /**
   * Initialize Capacitor features
   */
  static async initialize() {
    try {
      // Set up status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#6366f1' });
      
      // Hide splash screen after a delay
      setTimeout(async () => {
        await SplashScreen.hide();
      }, 2000);
      
      // Set up keyboard behavior
      await Keyboard.setAccessoryBarVisible({ isVisible: false });
      
      console.log('Capacitor initialized successfully');
    } catch (error) {
      console.warn('Capacitor initialization error:', error);
    }
  }
  
  /**
   * Check if running on native platform
   */
  static isNative() {
    return Capacitor.isNativePlatform();
  }
  
  /**
   * Get platform info
   */
  static getPlatform() {
    return Capacitor.getPlatform();
  }
  
  /**
   * Trigger haptic feedback
   */
  static async triggerHaptic(style = ImpactStyle.Medium) {
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
  
  /**
   * Get network status
   */
  static async getNetworkStatus() {
    try {
      const status = await Network.getStatus();
      return status;
    } catch (error) {
      console.warn('Network status not available:', error);
      return { connected: true, connectionType: 'unknown' };
    }
  }
  
  /**
   * Listen for network changes
   */
  static async onNetworkChange(callback) {
    try {
      await Network.addListener('networkStatusChange', callback);
    } catch (error) {
      console.warn('Network listener not available:', error);
    }
  }
  
  /**
   * Take a photo using device camera
   */
  static async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri
      });
      return image.webPath;
    } catch (error) {
      console.warn('Camera not available:', error);
      return null;
    }
  }
  
  /**
   * Show local notification
   */
  static async showNotification(title, body, id = Date.now()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            sound: 'default',
            schedule: { at: new Date(Date.now() + 1000) }
          }
        ]
      });
    } catch (error) {
      console.warn('Notifications not available:', error);
    }
  }
  
  /**
   * Request notification permissions
   */
  static async requestNotificationPermissions() {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.warn('Notification permissions not available:', error);
      return false;
    }
  }
  
  /**
   * Get app info
   */
  static async getAppInfo() {
    try {
      const info = await App.getInfo();
      return info;
    } catch (error) {
      console.warn('App info not available:', error);
      return { name: 'Deacon', version: '1.0.0' };
    }
  }
  
  /**
   * Listen for app state changes
   */
  static async onAppStateChange(callback) {
    try {
      await App.addListener('appStateChange', callback);
    } catch (error) {
      console.warn('App state listener not available:', error);
    }
  }
  
  /**
   * Exit app (Android only)
   */
  static async exitApp() {
    try {
      await App.exitApp();
    } catch (error) {
      console.warn('Exit app not available:', error);
    }
  }
  
  /**
   * Minimize app
   */
  static async minimizeApp() {
    try {
      await App.minimizeApp();
    } catch (error) {
      console.warn('Minimize app not available:', error);
    }
  }
}

export default CapacitorService; 