/**
 * App Blocking Module
 *
 * Handles app blocking functionality for both iOS and Android.
 *
 * Android: Uses UsageStats API and overlay blocking
 * iOS: Uses Screen Time API / Family Controls (limited access)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as AppBlocker from '@/modules/app-blocker';

// Storage keys
const BLOCKED_APPS_KEY = '@blocked_apps';
const BLOCK_SCHEDULES_KEY = '@block_schedules';
const FOCUS_SESSION_KEY = '@focus_session';
const DAILY_LIMITS_KEY = '@daily_limits';
const DEFAULT_BLOCKED_APPS_KEY = '@default_blocked_apps';
const DEFAULT_BLOCKED_WEBSITES_KEY = '@default_blocked_websites';
const DEFAULT_APP_LIMIT_MINUTES_KEY = '@default_app_limit_minutes';
const APP_LIMITS_INITIALIZED_KEY = '@app_limits_initialized';

// Types
export interface BlockedApp {
  packageName: string;
  appName: string;
  iconUrl?: string;
  isBlocked: boolean;
  blockType: 'manual' | 'scheduled' | 'focus' | 'task' | 'limit';
  dailyLimitMinutes?: number;
  usedTodayMinutes?: number;
}

export interface BlockSchedule {
  id: string;
  name: string;
  apps: string[]; // Package names
  websites: string[]; // Domain names
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, Sunday = 0
  isActive: boolean;
  createdAt: number;
  type: 'block' | 'unlock'; // 'block' = apps blocked, 'unlock' = free usage period
}

export interface FocusSession {
  id: string;
  startTime: number;
  durationMinutes: number;
  blockedApps: string[];
  taskId?: string;
  isActive: boolean;
  requiresTaskCompletion: boolean;
  beforePhotoUri?: string;
  afterPhotoUri?: string;
  taskDescription?: string;
}

export interface DailyLimit {
  packageName: string;
  appName: string;
  limitMinutes: number;
  usedMinutes: number;
  lastResetDate: string; // YYYY-MM-DD
  iconUrl?: string; // Base64 icon from device or URL
}

// Popular apps list with package names (Android) and bundle IDs (iOS)
export const POPULAR_APPS = [
  {
    packageName: 'com.instagram.android',
    iosBundleId: 'com.instagram.burbn',
    appName: 'Instagram',
    iosId: 'instagram://',
  },
  {
    packageName: 'com.google.android.youtube',
    iosBundleId: 'com.google.ios.youtube',
    appName: 'YouTube',
    iosId: 'youtube://',
  },
  {
    packageName: 'com.zhiliaoapp.musically',
    iosBundleId: 'com.zhiliaoapp.musically',
    appName: 'TikTok',
    iosId: 'tiktok://',
  },
  {
    packageName: 'com.twitter.android',
    iosBundleId: 'com.atebits.Tweetie2',
    appName: 'Twitter/X',
    iosId: 'twitter://',
  },
  {
    packageName: 'com.facebook.katana',
    iosBundleId: 'com.facebook.Facebook',
    appName: 'Facebook',
    iosId: 'fb://',
  },
  {
    packageName: 'com.whatsapp',
    iosBundleId: 'net.whatsapp.WhatsApp',
    appName: 'WhatsApp',
    iosId: 'whatsapp://',
  },
  {
    packageName: 'com.snapchat.android',
    iosBundleId: 'com.toyopagroup.picaboo',
    appName: 'Snapchat',
    iosId: 'snapchat://',
  },
  {
    packageName: 'com.reddit.frontpage',
    iosBundleId: 'com.reddit.Reddit',
    appName: 'Reddit',
    iosId: 'reddit://',
  },
  {
    packageName: 'com.pinterest',
    iosBundleId: 'com.pinterest',
    appName: 'Pinterest',
    iosId: 'pinterest://',
  },
  {
    packageName: 'com.linkedin.android',
    iosBundleId: 'com.linkedin.LinkedIn',
    appName: 'LinkedIn',
    iosId: 'linkedin://',
  },
  {
    packageName: 'tv.twitch.android.app',
    iosBundleId: 'tv.twitch',
    appName: 'Twitch',
    iosId: 'twitch://',
  },
  {
    packageName: 'com.discord',
    iosBundleId: 'com.discord.Discord',
    appName: 'Discord',
    iosId: 'discord://',
  },
  {
    packageName: 'com.spotify.music',
    iosBundleId: 'com.spotify.client',
    appName: 'Spotify',
    iosId: 'spotify://',
  },
  {
    packageName: 'com.netflix.mediaclient',
    iosBundleId: 'com.netflix.Netflix',
    appName: 'Netflix',
    iosId: 'netflix://',
  },
  {
    packageName: 'com.amazon.avod.thirdpartyclient',
    iosBundleId: 'com.amazon.avod.thirdpartyclient',
    appName: 'Prime Video',
    iosId: 'primevideo://',
  },
];

/**
 * Get the appropriate app identifier for the current platform
 */
export const getAppIdentifier = (app: typeof POPULAR_APPS[0]): string => {
  return Platform.OS === 'ios' ? app.iosBundleId : app.packageName;
};

/**
 * Initialize app blocking system
 */
export const initializeBlocking = async (): Promise<void> => {
  try {
    // Initialize storage if needed
    const blockedApps = await AsyncStorage.getItem(BLOCKED_APPS_KEY);
    if (!blockedApps) {
      await AsyncStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify([]));
    }

    const schedules = await AsyncStorage.getItem(BLOCK_SCHEDULES_KEY);
    if (!schedules) {
      await AsyncStorage.setItem(BLOCK_SCHEDULES_KEY, JSON.stringify([]));
    }

    // Check and apply any active schedules
    await checkAndApplySchedules();

    // Reset daily limits if needed
    await resetDailyLimitsIfNeeded();
  } catch (error) {
    console.error('Error initializing blocking:', error);
  }
};

/**
 * Get all blocked apps
 */
export const getBlockedApps = async (): Promise<BlockedApp[]> => {
  try {
    const stored = await AsyncStorage.getItem(BLOCKED_APPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting blocked apps:', error);
    return [];
  }
};

/**
 * Add an app to blocked list
 */
export const blockApp = async (
  packageName: string,
  appName: string,
  blockType: BlockedApp['blockType'] = 'manual',
  dailyLimitMinutes?: number
): Promise<void> => {
  try {
    const blockedApps = await getBlockedApps();
    const existingIndex = blockedApps.findIndex((a) => a.packageName === packageName);

    const newBlockedApp: BlockedApp = {
      packageName,
      appName,
      isBlocked: true,
      blockType,
      dailyLimitMinutes,
      usedTodayMinutes: 0,
    };

    if (existingIndex >= 0) {
      blockedApps[existingIndex] = { ...blockedApps[existingIndex], ...newBlockedApp };
    } else {
      blockedApps.push(newBlockedApp);
    }

    await AsyncStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify(blockedApps));

    // Update native module's blocked apps list on Android
    if (Platform.OS === 'android') {
      const packageNames = blockedApps.filter(a => a.isBlocked).map(a => a.packageName);
      // Also include default blocked apps from profile
      const defaultApps = await getDefaultBlockedApps();
      const allBlockedApps = [...new Set([...packageNames, ...defaultApps])];
      AppBlocker.setBlockedApps(allBlockedApps);
    }
  } catch (error) {
    console.error('Error blocking app:', error);
  }
};

/**
 * Remove an app from blocked list
 */
export const unblockApp = async (packageName: string): Promise<void> => {
  try {
    // Remove from blocked apps list
    const blockedApps = await getBlockedApps();
    const filtered = blockedApps.filter((a) => a.packageName !== packageName);
    await AsyncStorage.setItem(BLOCKED_APPS_KEY, JSON.stringify(filtered));

    // Also remove from default blocked apps (profile) to prevent re-adding on sync
    const defaultApps = await getDefaultBlockedApps();
    const filteredDefault = defaultApps.filter((a) => a !== packageName);
    await AsyncStorage.setItem(DEFAULT_BLOCKED_APPS_KEY, JSON.stringify(filteredDefault));
    await SecureStore.setItemAsync('blockedApps', JSON.stringify(filteredDefault));

    // Update native module's blocked apps list on Android
    if (Platform.OS === 'android') {
      // Clear all blocking data for this specific app (removes from blocked_apps set + temp_unblock)
      AppBlocker.clearAppBlockData(packageName);

      // Sync the combined list minus this app
      const allRemainingApps = [...new Set([...filtered.map(a => a.packageName), ...filteredDefault])];
      AppBlocker.setBlockedApps(allRemainingApps);
    }

    console.log('[AppBlocking] Unblocked app:', packageName);
  } catch (error) {
    console.error('Error unblocking app:', error);
  }
};

/**
 * Check if an app is currently blocked
 */
export const isAppBlocked = async (packageName: string): Promise<boolean> => {
  try {
    const blockedApps = await getBlockedApps();
    const app = blockedApps.find((a) => a.packageName === packageName);
    return app?.isBlocked ?? false;
  } catch (error) {
    console.error('Error checking if app is blocked:', error);
    return false;
  }
};

// ==================== SCHEDULES ====================

/**
 * Get all block schedules
 */
export const getBlockSchedules = async (): Promise<BlockSchedule[]> => {
  try {
    const stored = await AsyncStorage.getItem(BLOCK_SCHEDULES_KEY);
    if (!stored) return [];

    const schedules: BlockSchedule[] = JSON.parse(stored);
    // Handle backward compatibility: add empty websites array if missing
    return schedules.map(schedule => ({
      ...schedule,
      websites: schedule.websites || [],
    }));
  } catch (error) {
    console.error('Error getting block schedules:', error);
    return [];
  }
};

/**
 * Create a new block schedule
 */
export const createBlockSchedule = async (
  schedule: Omit<BlockSchedule, 'id' | 'createdAt'>
): Promise<BlockSchedule> => {
  try {
    const schedules = await getBlockSchedules();
    const newSchedule: BlockSchedule = {
      ...schedule,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    schedules.push(newSchedule);
    await AsyncStorage.setItem(BLOCK_SCHEDULES_KEY, JSON.stringify(schedules));

    // Schedule notifications for this schedule
    await scheduleBlockingNotifications(newSchedule);

    return newSchedule;
  } catch (error) {
    console.error('Error creating block schedule:', error);
    throw error;
  }
};

/**
 * Update an existing schedule
 */
export const updateBlockSchedule = async (
  id: string,
  updates: Partial<BlockSchedule>
): Promise<void> => {
  try {
    const schedules = await getBlockSchedules();
    const index = schedules.findIndex((s) => s.id === id);

    if (index >= 0) {
      schedules[index] = { ...schedules[index], ...updates };
      await AsyncStorage.setItem(BLOCK_SCHEDULES_KEY, JSON.stringify(schedules));
    }
  } catch (error) {
    console.error('Error updating block schedule:', error);
  }
};

/**
 * Delete a schedule
 */
export const deleteBlockSchedule = async (id: string): Promise<void> => {
  try {
    const schedules = await getBlockSchedules();
    const filtered = schedules.filter((s) => s.id !== id);
    await AsyncStorage.setItem(BLOCK_SCHEDULES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting block schedule:', error);
  }
};

/**
 * Check and apply active schedules
 */
export const checkAndApplySchedules = async (): Promise<void> => {
  try {
    const schedules = await getBlockSchedules();
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const schedule of schedules) {
      if (!schedule.isActive) continue;
      if (!schedule.daysOfWeek.includes(currentDay)) continue;

      const isInTimeRange = currentTime >= schedule.startTime && currentTime <= schedule.endTime;

      if (isInTimeRange) {
        // Block all apps in this schedule
        for (const packageName of schedule.apps) {
          const appInfo = POPULAR_APPS.find((a) => a.packageName === packageName);
          if (appInfo) {
            await blockApp(packageName, appInfo.appName, 'scheduled');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking schedules:', error);
  }
};

/**
 * Schedule notifications for a block schedule
 */
const scheduleBlockingNotifications = async (schedule: BlockSchedule): Promise<void> => {
  try {
    const [hours, minutes] = schedule.startTime.split(':').map(Number);

    for (const day of schedule.daysOfWeek) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${schedule.name} Starting`,
          body: `Your scheduled blocking "${schedule.name}" is now active.`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // Expo uses 1-7
          hour: hours,
          minute: minutes,
        },
      });
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

// ==================== FOCUS SESSION ====================

/**
 * Get current focus session
 */
export const getCurrentFocusSession = async (): Promise<FocusSession | null> => {
  try {
    const stored = await AsyncStorage.getItem(FOCUS_SESSION_KEY);
    if (!stored) return null;

    const session: FocusSession = JSON.parse(stored);

    // Check if session is still active
    const endTime = session.startTime + session.durationMinutes * 60 * 1000;
    if (Date.now() > endTime && !session.requiresTaskCompletion) {
      // Session expired
      await endFocusSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting focus session:', error);
    return null;
  }
};

/**
 * Start a new focus session
 */
export const startFocusSession = async (
  durationMinutes: number,
  blockedApps: string[],
  requiresTaskCompletion: boolean = false,
  beforePhotoUri?: string,
  taskDescription?: string
): Promise<FocusSession> => {
  try {
    const session: FocusSession = {
      id: Date.now().toString(),
      startTime: Date.now(),
      durationMinutes,
      blockedApps,
      isActive: true,
      requiresTaskCompletion,
      beforePhotoUri,
      taskDescription,
    };

    await AsyncStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));

    // Block all specified apps
    for (const packageName of blockedApps) {
      const appInfo = POPULAR_APPS.find((a) => a.packageName === packageName);
      if (appInfo) {
        await blockApp(packageName, appInfo.appName, requiresTaskCompletion ? 'task' : 'focus');
      }
    }

    // Schedule end notification
    if (!requiresTaskCompletion) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Focus Session Complete!',
          body: 'Great job! Your focus session has ended.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: durationMinutes * 60,
        },
      });
    }

    return session;
  } catch (error) {
    console.error('Error starting focus session:', error);
    throw error;
  }
};

/**
 * End the current focus session
 */
export const endFocusSession = async (afterPhotoUri?: string): Promise<void> => {
  try {
    const session = await getCurrentFocusSession();
    if (!session) return;

    // Unblock all apps from this session
    for (const packageName of session.blockedApps) {
      await unblockApp(packageName);
    }

    // Clear the session
    await AsyncStorage.removeItem(FOCUS_SESSION_KEY);
  } catch (error) {
    console.error('Error ending focus session:', error);
  }
};

/**
 * Update focus session with task completion data
 */
export const updateFocusSessionTask = async (afterPhotoUri: string): Promise<void> => {
  try {
    const session = await getCurrentFocusSession();
    if (!session) return;

    session.afterPhotoUri = afterPhotoUri;
    await AsyncStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error updating focus session:', error);
  }
};

// ==================== DAILY LIMITS ====================

/**
 * Get daily limits
 */
export const getDailyLimits = async (): Promise<DailyLimit[]> => {
  try {
    const stored = await AsyncStorage.getItem(DAILY_LIMITS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting daily limits:', error);
    return [];
  }
};

/**
 * Set daily limit for an app
 */
export const setDailyLimit = async (
  packageName: string,
  appName: string,
  limitMinutes: number,
  iconUrl?: string
): Promise<void> => {
  try {
    const limits = await getDailyLimits();
    const today = new Date().toISOString().split('T')[0];

    const existingIndex = limits.findIndex((l) => l.packageName === packageName);

    const newLimit: DailyLimit = {
      packageName,
      appName,
      limitMinutes,
      usedMinutes: 0,
      lastResetDate: today,
      iconUrl,
    };

    if (existingIndex >= 0) {
      // Preserve existing iconUrl if not provided
      limits[existingIndex] = {
        ...limits[existingIndex],
        limitMinutes,
        iconUrl: iconUrl || limits[existingIndex].iconUrl,
      };
    } else {
      limits.push(newLimit);
    }

    await AsyncStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(limits));
  } catch (error) {
    console.error('Error setting daily limit:', error);
  }
};

/**
 * Update usage for daily limit
 */
export const updateDailyLimitUsage = async (
  packageName: string,
  usedMinutes: number
): Promise<boolean> => {
  try {
    const limits = await getDailyLimits();
    const limit = limits.find((l) => l.packageName === packageName);

    if (!limit) return false;

    limit.usedMinutes = usedMinutes;

    // Check if limit exceeded
    if (usedMinutes >= limit.limitMinutes) {
      // Block the app
      await blockApp(packageName, limit.appName, 'limit');
      await AsyncStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(limits));
      return true; // Limit exceeded
    }

    await AsyncStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(limits));
    return false;
  } catch (error) {
    console.error('Error updating daily limit usage:', error);
    return false;
  }
};

/**
 * Reset daily limits at midnight
 * Only resets usage counters - apps remain in the blocked list
 */
export const resetDailyLimitsIfNeeded = async (): Promise<void> => {
  try {
    const limits = await getDailyLimits();
    const today = new Date().toISOString().split('T')[0];

    let needsUpdate = false;

    for (const limit of limits) {
      if (limit.lastResetDate !== today) {
        limit.usedMinutes = 0;
        limit.lastResetDate = today;
        needsUpdate = true;
        // Note: Apps stay blocked, only usage counter resets
        // Do NOT call unblockApp() here as it removes apps from defaults
      }
    }

    if (needsUpdate) {
      await AsyncStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(limits));
    }
  } catch (error) {
    console.error('Error resetting daily limits:', error);
  }
};

/**
 * Remove daily limit for an app
 */
export const removeDailyLimit = async (packageName: string): Promise<void> => {
  try {
    const limits = await getDailyLimits();
    const filtered = limits.filter((l) => l.packageName !== packageName);
    await AsyncStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(filtered));

    // Also unblock the app if it was blocked due to limit
    const blockedApps = await getBlockedApps();
    const app = blockedApps.find((a) => a.packageName === packageName && a.blockType === 'limit');
    if (app) {
      await unblockApp(packageName);
    }
  } catch (error) {
    console.error('Error removing daily limit:', error);
  }
};

/**
 * Get default app limit minutes (default: 30 minutes)
 */
export const getDefaultAppLimitMinutes = async (): Promise<number> => {
  try {
    const stored = await AsyncStorage.getItem(DEFAULT_APP_LIMIT_MINUTES_KEY);
    return stored ? parseInt(stored, 10) : 30; // Default 30 minutes
  } catch (error) {
    console.error('Error getting default app limit:', error);
    return 30;
  }
};

/**
 * Set default app limit minutes
 */
export const setDefaultAppLimitMinutes = async (minutes: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(DEFAULT_APP_LIMIT_MINUTES_KEY, minutes.toString());
  } catch (error) {
    console.error('Error setting default app limit:', error);
  }
};

/**
 * Initialize app limits from onboarding selections
 * Called once after first app launch with completed onboarding
 */
export const initializeAppLimitsFromOnboarding = async (): Promise<void> => {
  try {
    // Check if already initialized
    const initialized = await AsyncStorage.getItem(APP_LIMITS_INITIALIZED_KEY);
    if (initialized === 'true') return;

    // Get default apps from onboarding
    const defaultApps = await getDefaultBlockedApps();
    if (defaultApps.length === 0) return;

    // Get default limit (30 minutes)
    const defaultLimit = await getDefaultAppLimitMinutes();

    // Get app names from POPULAR_APPS
    const today = new Date().toISOString().split('T')[0];
    const limits: DailyLimit[] = [];

    for (const packageName of defaultApps) {
      const appInfo = POPULAR_APPS.find((a) => a.packageName === packageName);
      const appName = appInfo?.appName || packageName.split('.').pop() || packageName;

      limits.push({
        packageName,
        appName,
        limitMinutes: defaultLimit,
        usedMinutes: 0,
        lastResetDate: today,
      });
    }

    await AsyncStorage.setItem(DAILY_LIMITS_KEY, JSON.stringify(limits));
    await AsyncStorage.setItem(APP_LIMITS_INITIALIZED_KEY, 'true');
  } catch (error) {
    console.error('Error initializing app limits:', error);
  }
};

// ==================== PERMISSIONS AND SETUP ====================

/**
 * Check if app blocking permission is enabled
 * Android: Accessibility service
 * iOS: Family Controls authorization
 */
export const isAccessibilityServiceEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // On iOS, check if Family Controls is authorized
    try {
      return await AppBlocker.isAccessibilityServiceEnabled();
    } catch (error) {
      console.error('Error checking iOS authorization:', error);
      return false;
    }
  }
  // Android
  return await AppBlocker.isAccessibilityServiceEnabled();
};

/**
 * Request authorization for app blocking
 * iOS only: Request Family Controls permission
 */
export const requestBlockingAuthorization = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    // On Android, user needs to manually enable accessibility service
    return false;
  }

  try {
    return await AppBlocker.requestAuthorization();
  } catch (error) {
    console.error('Error requesting iOS authorization:', error);
    return false;
  }
};

/**
 * Open settings to enable app blocking
 * Android: Accessibility settings
 * iOS: App settings (will show Family Controls permission)
 */
export const openAccessibilitySettings = (): void => {
  AppBlocker.openAccessibilitySettings();
};

/**
 * Check if overlay permission is granted (Android only)
 * iOS: Always returns true as overlay is not needed
 */
export const hasOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') return true;
  return await AppBlocker.hasOverlayPermission();
};

/**
 * Open overlay permission settings (Android only)
 */
export const openOverlaySettings = (): void => {
  if (Platform.OS === 'android') {
    AppBlocker.openOverlaySettings();
  }
};

/**
 * Check if all required permissions are granted
 */
export const hasAllRequiredPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS only needs Family Controls authorization
    return await isAccessibilityServiceEnabled();
  }

  // Android needs both accessibility and overlay
  const [accessibility, overlay] = await Promise.all([
    isAccessibilityServiceEnabled(),
    hasOverlayPermission(),
  ]);

  return accessibility && overlay;
};

// ==================== DEFAULT BLOCKED ITEMS ====================

import * as SecureStore from 'expo-secure-store';

/**
 * Get default blocked apps (from onboarding or user-edited)
 * First tries AsyncStorage (user-edited), then falls back to SecureStore (onboarding)
 */
export const getDefaultBlockedApps = async (): Promise<string[]> => {
  try {
    // First try AsyncStorage (user-edited defaults)
    const asyncStored = await AsyncStorage.getItem(DEFAULT_BLOCKED_APPS_KEY);
    if (asyncStored) {
      return JSON.parse(asyncStored);
    }

    // Fall back to SecureStore (onboarding data)
    const secureStored = await SecureStore.getItemAsync('blockedApps');
    if (secureStored) {
      const apps = JSON.parse(secureStored);
      // Migrate to AsyncStorage for future use
      await AsyncStorage.setItem(DEFAULT_BLOCKED_APPS_KEY, JSON.stringify(apps));
      return apps;
    }

    return [];
  } catch (error) {
    console.error('Error getting default blocked apps:', error);
    return [];
  }
};

/**
 * Get default blocked websites (from onboarding or user-edited)
 * First tries AsyncStorage (user-edited), then falls back to SecureStore (onboarding)
 */
export const getDefaultBlockedWebsites = async (): Promise<string[]> => {
  try {
    // First try AsyncStorage (user-edited defaults)
    const asyncStored = await AsyncStorage.getItem(DEFAULT_BLOCKED_WEBSITES_KEY);
    if (asyncStored) {
      return JSON.parse(asyncStored);
    }

    // Fall back to SecureStore (onboarding data)
    const secureStored = await SecureStore.getItemAsync('blockedWebsites');
    if (secureStored) {
      const websites = JSON.parse(secureStored);
      // Migrate to AsyncStorage for future use
      await AsyncStorage.setItem(DEFAULT_BLOCKED_WEBSITES_KEY, JSON.stringify(websites));
      return websites;
    }

    return [];
  } catch (error) {
    console.error('Error getting default blocked websites:', error);
    return [];
  }
};

/**
 * Set default blocked apps (user-edited)
 */
export const setDefaultBlockedApps = async (apps: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(DEFAULT_BLOCKED_APPS_KEY, JSON.stringify(apps));
    // Also update SecureStore for consistency
    await SecureStore.setItemAsync('blockedApps', JSON.stringify(apps));
    // Update native module so blocking actually works
    if (Platform.OS === 'android') {
      AppBlocker.setBlockedApps(apps);
    }
  } catch (error) {
    console.error('Error setting default blocked apps:', error);
  }
};

/**
 * Set default blocked websites (user-edited)
 */
export const setDefaultBlockedWebsites = async (websites: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(DEFAULT_BLOCKED_WEBSITES_KEY, JSON.stringify(websites));
    // Also update SecureStore for consistency
    await SecureStore.setItemAsync('blockedWebsites', JSON.stringify(websites));
    // Update native module
    if (Platform.OS === 'android') {
      AppBlocker.setBlockedWebsites(websites);
    }
  } catch (error) {
    console.error('Error setting default blocked websites:', error);
  }
};

/**
 * Sync blocked websites to native module
 * Should be called on app startup and when websites change
 */
export const syncBlockedWebsitesToNative = async (): Promise<void> => {
  try {
    if (Platform.OS !== 'android') return;

    const websites = await getDefaultBlockedWebsites();
    AppBlocker.setBlockedWebsites(websites);
  } catch (error) {
    console.error('Error syncing blocked websites to native:', error);
  }
};

/**
 * Sync blocked apps to native module
 * Should be called on app startup and when apps change
 */
export const syncBlockedAppsToNative = async (): Promise<void> => {
  try {
    if (Platform.OS !== 'android') return;

    // Get apps from the actual blocked apps list (managed by BlockingContext)
    const blockedApps = await getBlockedApps();
    const packageNames = blockedApps.map(a => a.packageName);

    // Also merge with default blocked apps from profile
    const defaultApps = await getDefaultBlockedApps();

    // Combine both lists (unique values)
    const allBlockedApps = [...new Set([...packageNames, ...defaultApps])];

    console.log('[AppBlocking] Syncing to native:', allBlockedApps.length, 'apps');
    AppBlocker.setBlockedApps(allBlockedApps);
  } catch (error) {
    console.error('Error syncing blocked apps to native:', error);
  }
};
