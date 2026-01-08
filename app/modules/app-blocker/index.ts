import { NativeModule, requireNativeModule, Platform } from 'expo-modules-core';

// Result from iOS app picker
interface AppPickerResult {
  appsCount: number;
  categoriesCount: number;
}

interface AppBlockerModule extends NativeModule {
  // Common methods (both platforms)
  isAccessibilityServiceEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
  hasOverlayPermission(): Promise<boolean>;
  openOverlaySettings(): void;
  showBlockInterstitial(packageName: string, appName: string): void;

  // Android-specific methods
  hasNotificationAccess?(): Promise<boolean>;
  openNotificationSettings?(): void;
  setBlockedApps?(apps: string[]): void;
  getBlockedApps?(): string[];
  setBlockedWebsites?(websites: string[]): void;
  getBlockedWebsites?(): string[];
  setTempUnblock?(packageName: string, minutes: number): void;
  setTempUnblockWebsite?(website: string, minutes: number): void;
  isTempUnblocked?(packageName: string): Promise<boolean>;
  launchApp?(packageName: string): boolean;
  goToHomeScreen?(): void;
  getPendingBlockedApp?(): Promise<{ packageName: string; appName: string; timestamp: number } | null>;
  clearPendingBlockedApp?(): void;
  getNavigationFlags?(): Promise<{ navigateToLockin: boolean; showCoachChat: boolean; packageName: string | null; appName: string | null }>;
  clearNavigationFlags?(): void;
  setDailyLimits?(limitsJson: string): void;
  setTotalDailyLimit?(minutes: number): void;

  // iOS-specific methods (Family Controls)
  requestAuthorization?(): Promise<boolean>;
  isAuthorized?(): boolean;
  showAppPicker?(): Promise<AppPickerResult | null>;
  applyBlocking?(): void;
  clearBlocking?(): void;
  getBlockedAppsCount?(): Promise<number>;
  hasBlockedApps?(): Promise<boolean>;
  scheduleBlocking?(startHour: number, startMinute: number, endHour: number, endMinute: number): void;
  stopScheduledBlocking?(): void;
  endTempUnblock?(): void;
}

let AppBlocker: AppBlockerModule | null = null;

try {
  AppBlocker = requireNativeModule<AppBlockerModule>('AppBlocker');
} catch (e) {
  console.warn('AppBlocker native module not available:', e);
}

// ==================== Common Methods ====================

export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  if (!AppBlocker) return false;
  try {
    return await AppBlocker.isAccessibilityServiceEnabled();
  } catch (error) {
    console.error('Error checking accessibility service:', error);
    return false;
  }
}

export function openAccessibilitySettings(): void {
  if (!AppBlocker) return;
  try {
    AppBlocker.openAccessibilitySettings();
  } catch (error) {
    console.error('Error opening accessibility settings:', error);
  }
}

export async function hasOverlayPermission(): Promise<boolean> {
  if (!AppBlocker) return false;
  try {
    return await AppBlocker.hasOverlayPermission();
  } catch (error) {
    console.error('Error checking overlay permission:', error);
    return false;
  }
}

export function openOverlaySettings(): void {
  if (!AppBlocker) return;
  try {
    AppBlocker.openOverlaySettings();
  } catch (error) {
    console.error('Error opening overlay settings:', error);
  }
}

export function showBlockInterstitial(packageName: string, appName: string): void {
  if (!AppBlocker) return;
  try {
    AppBlocker.showBlockInterstitial(packageName, appName);
  } catch (error) {
    console.error('Error showing block interstitial:', error);
  }
}

// ==================== Android-Specific Methods ====================

export async function hasNotificationAccess(): Promise<boolean> {
  if (!AppBlocker || Platform.OS !== 'android') return true; // iOS handles differently
  try {
    if (AppBlocker.hasNotificationAccess) {
      return await AppBlocker.hasNotificationAccess();
    }
    return false;
  } catch (error) {
    console.error('Error checking notification access:', error);
    return false;
  }
}

export function openNotificationSettings(): void {
  if (!AppBlocker || Platform.OS !== 'android') return;
  try {
    if (AppBlocker.openNotificationSettings) {
      AppBlocker.openNotificationSettings();
    }
  } catch (error) {
    console.error('Error opening notification settings:', error);
  }
}

export function setBlockedApps(apps: string[]): void {
  if (!AppBlocker) return;

  if (Platform.OS === 'ios') {
    // On iOS, apps must be selected through FamilyActivityPicker
    console.warn('setBlockedApps: On iOS, use showAppPicker() instead');
    return;
  }

  try {
    if (AppBlocker.setBlockedApps) {
      AppBlocker.setBlockedApps(apps);
    }
  } catch (error) {
    console.error('Error setting blocked apps:', error);
  }
}

export function getBlockedApps(): string[] {
  if (!AppBlocker || Platform.OS === 'ios') return [];
  try {
    if (AppBlocker.getBlockedApps) {
      return AppBlocker.getBlockedApps();
    }
    return [];
  } catch (error) {
    console.error('Error getting blocked apps:', error);
    return [];
  }
}

export function setBlockedWebsites(websites: string[]): void {
  if (!AppBlocker || Platform.OS === 'ios') return; // Not supported on iOS
  try {
    if (AppBlocker.setBlockedWebsites) {
      AppBlocker.setBlockedWebsites(websites);
    }
  } catch (error) {
    console.error('Error setting blocked websites:', error);
  }
}

export function getBlockedWebsites(): string[] {
  if (!AppBlocker || Platform.OS === 'ios') return [];
  try {
    if (AppBlocker.getBlockedWebsites) {
      return AppBlocker.getBlockedWebsites();
    }
    return [];
  } catch (error) {
    console.error('Error getting blocked websites:', error);
    return [];
  }
}

export function setTempUnblockWebsite(website: string, minutes: number): void {
  if (!AppBlocker || Platform.OS === 'ios') return; // Not supported on iOS
  try {
    if (AppBlocker.setTempUnblockWebsite) {
      AppBlocker.setTempUnblockWebsite(website, minutes);
    }
  } catch (error) {
    console.error('Error setting temp unblock website:', error);
  }
}

export function launchApp(packageName: string): boolean {
  if (!AppBlocker || Platform.OS === 'ios') return false;
  try {
    if (AppBlocker.launchApp) {
      return AppBlocker.launchApp(packageName);
    }
    return false;
  } catch (error) {
    console.error('Error launching app:', error);
    return false;
  }
}

export function goToHomeScreen(): void {
  if (!AppBlocker || Platform.OS === 'ios') return;
  try {
    if (AppBlocker.goToHomeScreen) {
      AppBlocker.goToHomeScreen();
    }
  } catch (error) {
    console.error('Error going to home screen:', error);
  }
}

/**
 * Get pending blocked app info (Android only)
 * Called by native BlockInterstitialActivity to pass blocked app info
 */
export async function getPendingBlockedApp(): Promise<{ packageName: string; appName: string; timestamp: number } | null> {
  if (!AppBlocker || Platform.OS === 'ios') return null;
  try {
    if (AppBlocker.getPendingBlockedApp) {
      return await AppBlocker.getPendingBlockedApp();
    }
    return null;
  } catch (error) {
    console.error('Error getting pending blocked app:', error);
    return null;
  }
}

/**
 * Clear pending blocked app info (Android only)
 */
export function clearPendingBlockedApp(): void {
  if (!AppBlocker || Platform.OS === 'ios') return;
  try {
    if (AppBlocker.clearPendingBlockedApp) {
      AppBlocker.clearPendingBlockedApp();
    }
  } catch (error) {
    console.error('Error clearing pending blocked app:', error);
  }
}

/**
 * Get navigation flags set by native BlockInterstitialActivity (Android only)
 * Used to navigate to LockIn tab or show coach chat
 */
export async function getNavigationFlags(): Promise<{
  navigateToLockin: boolean;
  showCoachChat: boolean;
  packageName: string | null;
  appName: string | null;
} | null> {
  if (!AppBlocker || Platform.OS === 'ios') return null;
  try {
    if (AppBlocker.getNavigationFlags) {
      return await AppBlocker.getNavigationFlags();
    }
    return null;
  } catch (error) {
    console.error('Error getting navigation flags:', error);
    return null;
  }
}

/**
 * Clear navigation flags (Android only)
 */
export function clearNavigationFlags(): void {
  if (!AppBlocker || Platform.OS === 'ios') return;
  try {
    if (AppBlocker.clearNavigationFlags) {
      AppBlocker.clearNavigationFlags();
    }
  } catch (error) {
    console.error('Error clearing navigation flags:', error);
  }
}

/**
 * Set daily limits for apps (Android only)
 * Native reads this to determine if limit reached
 * @param limits - Map of packageName -> limitMinutes
 */
export function setDailyLimits(limits: Record<string, number>): void {
  if (!AppBlocker || Platform.OS === 'ios') return;
  try {
    if (AppBlocker.setDailyLimits) {
      AppBlocker.setDailyLimits(JSON.stringify(limits));
    }
  } catch (error) {
    console.error('Error setting daily limits:', error);
  }
}

/**
 * Set total daily limit (Android only)
 * @param minutes - Total daily screen time limit in minutes
 */
export function setTotalDailyLimit(minutes: number): void {
  if (!AppBlocker || Platform.OS === 'ios') return;
  try {
    if (AppBlocker.setTotalDailyLimit) {
      AppBlocker.setTotalDailyLimit(minutes);
    }
  } catch (error) {
    console.error('Error setting total daily limit:', error);
  }
}

// ==================== Temp Unblock (Platform-aware) ====================

/**
 * Temporarily unblock apps
 * @param packageNameOrMinutes - On Android: package name. On iOS: not used (pass empty string)
 * @param minutes - Duration in minutes
 */
export function setTempUnblock(packageNameOrMinutes: string | number, minutes?: number): void {
  if (!AppBlocker) return;

  try {
    if (Platform.OS === 'ios') {
      // iOS: setTempUnblock(minutes) - affects all blocked apps
      const mins = typeof packageNameOrMinutes === 'number' ? packageNameOrMinutes : minutes || 15;
      if (AppBlocker.setTempUnblock) {
        (AppBlocker as any).setTempUnblock(mins);
      }
    } else {
      // Android: setTempUnblock(packageName, minutes)
      if (AppBlocker.setTempUnblock && typeof packageNameOrMinutes === 'string' && minutes) {
        AppBlocker.setTempUnblock(packageNameOrMinutes, minutes);
      }
    }
  } catch (error) {
    console.error('Error setting temp unblock:', error);
  }
}

/**
 * Check if temporarily unblocked
 * @param packageName - On Android: package name. On iOS: not used
 */
export async function isTempUnblocked(packageName?: string): Promise<boolean> {
  if (!AppBlocker) return false;

  try {
    if (Platform.OS === 'ios') {
      // iOS: global temp unblock state
      if ((AppBlocker as any).isTempUnblocked) {
        return (AppBlocker as any).isTempUnblocked();
      }
      return false;
    } else {
      // Android: per-app temp unblock
      if (AppBlocker.isTempUnblocked && packageName) {
        return await AppBlocker.isTempUnblocked(packageName);
      }
      return false;
    }
  } catch (error) {
    console.error('Error checking temp unblock status:', error);
    return false;
  }
}

// ==================== iOS-Specific Methods (Family Controls) ====================

/**
 * Request Family Controls authorization (iOS only)
 */
export async function requestAuthorization(): Promise<boolean> {
  if (!AppBlocker || Platform.OS !== 'ios') {
    return Platform.OS === 'android'; // On Android, return true (uses different permission system)
  }
  try {
    if (AppBlocker.requestAuthorization) {
      return await AppBlocker.requestAuthorization();
    }
    return false;
  } catch (error) {
    console.error('Error requesting authorization:', error);
    return false;
  }
}

/**
 * Check if Family Controls is authorized (iOS only)
 */
export function isAuthorized(): boolean {
  if (!AppBlocker || Platform.OS !== 'ios') {
    return false;
  }
  try {
    if (AppBlocker.isAuthorized) {
      return AppBlocker.isAuthorized();
    }
    return false;
  } catch (error) {
    console.error('Error checking authorization:', error);
    return false;
  }
}

/**
 * Show native app picker (iOS only)
 * Opens FamilyActivityPicker to let user select apps to block
 * @returns Selected apps count or null if cancelled
 */
export async function showAppPicker(): Promise<AppPickerResult | null> {
  if (!AppBlocker || Platform.OS !== 'ios') {
    console.warn('showAppPicker is only available on iOS');
    return null;
  }
  try {
    if (AppBlocker.showAppPicker) {
      return await AppBlocker.showAppPicker();
    }
    return null;
  } catch (error) {
    console.error('Error showing app picker:', error);
    return null;
  }
}

/**
 * Apply blocking to selected apps (iOS only)
 * Call after showAppPicker() to activate blocking
 */
export function applyBlocking(): void {
  if (!AppBlocker || Platform.OS !== 'ios') return;
  try {
    if (AppBlocker.applyBlocking) {
      AppBlocker.applyBlocking();
    }
  } catch (error) {
    console.error('Error applying blocking:', error);
  }
}

/**
 * Clear all blocking (iOS only)
 */
export function clearBlocking(): void {
  if (!AppBlocker || Platform.OS !== 'ios') return;
  try {
    if (AppBlocker.clearBlocking) {
      AppBlocker.clearBlocking();
    }
  } catch (error) {
    console.error('Error clearing blocking:', error);
  }
}

/**
 * Get count of blocked apps (iOS only)
 */
export async function getBlockedAppsCount(): Promise<number> {
  if (!AppBlocker || Platform.OS !== 'ios') {
    // On Android, get from getBlockedApps()
    if (Platform.OS === 'android' && AppBlocker?.getBlockedApps) {
      try {
        return AppBlocker.getBlockedApps().length;
      } catch (error) {
        console.error('Error getting blocked apps count:', error);
        return 0;
      }
    }
    return 0;
  }
  try {
    if (AppBlocker.getBlockedAppsCount) {
      return await AppBlocker.getBlockedAppsCount();
    }
    return 0;
  } catch (error) {
    console.error('Error getting blocked apps count:', error);
    return 0;
  }
}

/**
 * Check if any apps are blocked (iOS only)
 */
export async function hasBlockedApps(): Promise<boolean> {
  if (!AppBlocker || Platform.OS !== 'ios') {
    // On Android, check from getBlockedApps()
    if (Platform.OS === 'android' && AppBlocker?.getBlockedApps) {
      try {
        return AppBlocker.getBlockedApps().length > 0;
      } catch (error) {
        console.error('Error checking blocked apps:', error);
        return false;
      }
    }
    return false;
  }
  try {
    if (AppBlocker.hasBlockedApps) {
      return await AppBlocker.hasBlockedApps();
    }
    return false;
  } catch (error) {
    console.error('Error checking blocked apps:', error);
    return false;
  }
}

/**
 * Schedule blocking for specific hours (iOS only)
 * @param startHour - Start hour (0-23)
 * @param startMinute - Start minute (0-59)
 * @param endHour - End hour (0-23)
 * @param endMinute - End minute (0-59)
 */
export function scheduleBlocking(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): void {
  if (!AppBlocker || Platform.OS !== 'ios') return;
  try {
    if (AppBlocker.scheduleBlocking) {
      AppBlocker.scheduleBlocking(startHour, startMinute, endHour, endMinute);
    }
  } catch (error) {
    console.error('Error scheduling blocking:', error);
  }
}

/**
 * Stop scheduled blocking (iOS only)
 */
export function stopScheduledBlocking(): void {
  if (!AppBlocker || Platform.OS !== 'ios') return;
  try {
    if (AppBlocker.stopScheduledBlocking) {
      AppBlocker.stopScheduledBlocking();
    }
  } catch (error) {
    console.error('Error stopping scheduled blocking:', error);
  }
}

/**
 * End temporary unblock immediately (iOS only)
 */
export function endTempUnblock(): void {
  if (!AppBlocker || Platform.OS !== 'ios') return;
  try {
    if (AppBlocker.endTempUnblock) {
      AppBlocker.endTempUnblock();
    }
  } catch (error) {
    console.error('Error ending temp unblock:', error);
  }
}

// ==================== Default Export ====================

export default {
  // Common
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
  hasOverlayPermission,
  openOverlaySettings,
  showBlockInterstitial,

  // Android
  hasNotificationAccess,
  openNotificationSettings,
  setBlockedApps,
  getBlockedApps,
  setBlockedWebsites,
  getBlockedWebsites,
  setTempUnblockWebsite,
  launchApp,
  goToHomeScreen,
  getPendingBlockedApp,
  clearPendingBlockedApp,
  getNavigationFlags,
  clearNavigationFlags,
  setDailyLimits,
  setTotalDailyLimit,

  // Platform-aware
  setTempUnblock,
  isTempUnblocked,

  // iOS
  requestAuthorization,
  isAuthorized,
  showAppPicker,
  applyBlocking,
  clearBlocking,
  getBlockedAppsCount,
  hasBlockedApps,
  scheduleBlocking,
  stopScheduledBlocking,
  endTempUnblock,
};
