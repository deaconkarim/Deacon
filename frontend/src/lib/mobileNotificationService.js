import CapacitorService from './capacitorService';

/**
 * Mobile Notification Service for Deacon
 * Handles local notifications for church events, reminders, and alerts
 */
export class MobileNotificationService {
  
  /**
   * Initialize notifications
   */
  static async initialize() {
    try {
      const hasPermission = await CapacitorService.requestNotificationPermissions();
      if (hasPermission) {
        console.log('Notification permissions granted');
      } else {
        console.warn('Notification permissions denied');
      }
      return hasPermission;
    } catch (error) {
      console.warn('Notification initialization failed:', error);
      return false;
    }
  }
  
  /**
   * Show event reminder notification
   */
  static async showEventReminder(eventTitle, eventTime, eventId) {
    try {
      await CapacitorService.showNotification(
        'Event Reminder',
        `${eventTitle} starts in 30 minutes`,
        `event_${eventId}`
      );
    } catch (error) {
      console.warn('Failed to show event reminder:', error);
    }
  }
  
  /**
   * Show prayer request notification
   */
  static async showPrayerRequest(memberName, requestTitle) {
    try {
      await CapacitorService.showNotification(
        'Prayer Request',
        `${memberName} has a new prayer request: ${requestTitle}`,
        `prayer_${Date.now()}`
      );
    } catch (error) {
      console.warn('Failed to show prayer request notification:', error);
    }
  }
  
  /**
   * Show attendance reminder
   */
  static async showAttendanceReminder() {
    try {
      await CapacitorService.showNotification(
        'Attendance Reminder',
        'Don\'t forget to check in for today\'s service!',
        'attendance_reminder'
      );
    } catch (error) {
      console.warn('Failed to show attendance reminder:', error);
    }
  }
  
  /**
   * Show giving reminder
   */
  static async showGivingReminder() {
    try {
      await CapacitorService.showNotification(
        'Giving Reminder',
        'Consider making a donation to support our ministry',
        'giving_reminder'
      );
    } catch (error) {
      console.warn('Failed to show giving reminder:', error);
    }
  }
  
  /**
   * Show volunteer reminder
   */
  static async showVolunteerReminder(role, eventTitle) {
    try {
      await CapacitorService.showNotification(
        'Volunteer Reminder',
        `You're scheduled to serve as ${role} for ${eventTitle}`,
        `volunteer_${Date.now()}`
      );
    } catch (error) {
      console.warn('Failed to show volunteer reminder:', error);
    }
  }
  
  /**
   * Show new member notification
   */
  static async showNewMemberNotification(memberName) {
    try {
      await CapacitorService.showNotification(
        'New Member',
        `Welcome ${memberName} to our church family!`,
        `new_member_${Date.now()}`
      );
    } catch (error) {
      console.warn('Failed to show new member notification:', error);
    }
  }
  
  /**
   * Show birthday notification
   */
  static async showBirthdayNotification(memberName) {
    try {
      await CapacitorService.showNotification(
        'Birthday Today',
        `Happy Birthday to ${memberName}! 🎉`,
        `birthday_${Date.now()}`
      );
    } catch (error) {
      console.warn('Failed to show birthday notification:', error);
    }
  }
  
  /**
   * Show general church announcement
   */
  static async showAnnouncement(title, message) {
    try {
      await CapacitorService.showNotification(
        title,
        message,
        `announcement_${Date.now()}`
      );
    } catch (error) {
      console.warn('Failed to show announcement:', error);
    }
  }
  
  /**
   * Show offline mode notification
   */
  static async showOfflineNotification() {
    try {
      await CapacitorService.showNotification(
        'Offline Mode',
        'You\'re currently offline. Some features may be limited.',
        'offline_mode'
      );
    } catch (error) {
      console.warn('Failed to show offline notification:', error);
    }
  }
  
  /**
   * Show sync completed notification
   */
  static async showSyncCompletedNotification() {
    try {
      await CapacitorService.showNotification(
        'Sync Complete',
        'Your data has been synchronized successfully',
        'sync_complete'
      );
    } catch (error) {
      console.warn('Failed to show sync notification:', error);
    }
  }
}

export default MobileNotificationService; 