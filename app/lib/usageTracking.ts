/**
 * Expo-Compatible Usage Tracking
 *
 * NOTE: Due to iOS privacy restrictions and Expo limitations:
 * - Cannot access other apps' usage data
 * - Cannot get system-wide screen time
 * - Can only track pickups using device sensors
 *
 * This module provides mock/simulated data for demonstration purposes.
 * In production, you would:
 * 1. Use Screen Time API (iOS, very limited access)
 * 2. Ask users to manually enable iOS Screen Time sharing
 * 3. Use a separate companion app with appropriate permissions
 * 4. Track only within your app's ecosystem
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AppUsageData {
  packageName: string;
  appName: string;
  timeInForeground: number; // milliseconds
  lastTimeUsed: number;
  iconUrl?: string;
}

export interface UsageStatsData {
  apps: AppUsageData[];
  totalScreenTime: number;
  pickups: number;
}

const STORAGE_KEY = '@usage_tracking';

/**
 * Initialize tracking (call on app start)
 */
export const initializeTracking = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessions: [],
        pickups: 0,
        lastReset: Date.now(),
      }));
    }
  } catch (error) {
    console.error('Error initializing tracking:', error);
  }
};

/**
 * Log a phone pickup/unlock event
 */
export const logPickup = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      data.pickups = (data.pickups || 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error logging pickup:', error);
  }
};

/**
 * Get today's pickup count
 */
export const getTodayPickups = async (): Promise<number> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const lastReset = data.lastReset || 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (lastReset < today.getTime()) {
        // Reset daily counter
        data.pickups = 0;
        data.lastReset = Date.now();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return 0;
      }

      return data.pickups || 0;
    }
  } catch (error) {
    console.error('Error getting pickups:', error);
  }
  return 0;
};

/**
 * Get simulated/mock usage data
 *
 * In a real implementation, this would:
 * - On Android: Use UsageStatsManager (requires native module)
 * - On iOS: Use ScreenTime API with user permission (very limited)
 * - Or integrate with external tracking service
 */
export const getTodayUsageStats = async (): Promise<UsageStatsData> => {
  // Get real pickup count
  const pickups = await getTodayPickups();

  // Return simulated data for popular apps
  // In production, replace this with actual data source
  return getSimulatedUsageData(pickups);
};

/**
 * Get usage stats for the current week
 */
export const getWeekUsageStats = async (): Promise<UsageStatsData> => {
  const pickups = await getTodayPickups();
  return getSimulatedWeekUsageData(pickups * 7); // Estimate weekly pickups
};

/**
 * Get usage stats for a specific week offset
 */
export const getWeekUsageStatsWithOffset = async (weekOffset: number): Promise<UsageStatsData> => {
  const pickups = await getTodayPickups();
  return getSimulatedWeekUsageData(pickups * 7);
};

/**
 * Get daily usage stats for the week
 */
export const getDailyUsageForWeek = async (weekOffset: number = 0): Promise<{ day: string; hours: number }[]> => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate varied usage patterns
  return dayNames.map((day, index) => ({
    day,
    hours: Math.round((2 + Math.random() * 4) * 10) / 10,
  }));
};

/**
 * Simulated data for today
 */
const getSimulatedUsageData = (pickups: number): UsageStatsData => {
  const apps: AppUsageData[] = [
    {
      packageName: 'com.instagram.android',
      appName: 'Instagram',
      timeInForeground: Math.floor(Math.random() * 10800000 + 7200000), // 2-5h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 3600000),
    },
    {
      packageName: 'com.google.android.youtube',
      appName: 'YouTube',
      timeInForeground: Math.floor(Math.random() * 9000000 + 5400000), // 1.5-4h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 7200000),
    },
    {
      packageName: 'com.zhiliaoapp.musically',
      appName: 'TikTok',
      timeInForeground: Math.floor(Math.random() * 7200000 + 3600000), // 1-3h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 10800000),
    },
    {
      packageName: 'com.twitter.android',
      appName: 'Twitter',
      timeInForeground: Math.floor(Math.random() * 5400000 + 1800000), // 0.5-2h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 14400000),
    },
    {
      packageName: 'com.facebook.katana',
      appName: 'Facebook',
      timeInForeground: Math.floor(Math.random() * 3600000 + 1800000), // 0.5-1.5h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 18000000),
    },
    {
      packageName: 'com.whatsapp',
      appName: 'WhatsApp',
      timeInForeground: Math.floor(Math.random() * 5400000 + 900000), // 15m-1.5h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 900000),
    },
    {
      packageName: 'com.snapchat.android',
      appName: 'Snapchat',
      timeInForeground: Math.floor(Math.random() * 3600000 + 1800000), // 0.5-1.5h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 7200000),
    },
  ];

  // Sort by usage time
  apps.sort((a, b) => b.timeInForeground - a.timeInForeground);

  const totalScreenTime = apps.reduce((sum, app) => sum + app.timeInForeground, 0);

  return {
    apps: apps.slice(0, 7), // Top 7 apps
    totalScreenTime,
    pickups: pickups > 0 ? pickups : Math.floor(Math.random() * 50 + 80), // 80-130
  };
};

/**
 * Simulated data for the week
 */
const getSimulatedWeekUsageData = (weeklyPickups: number): UsageStatsData => {
  const apps: AppUsageData[] = [
    {
      packageName: 'com.instagram.android',
      appName: 'Instagram',
      timeInForeground: Math.floor(Math.random() * 21600000 + 28800000), // 8-16h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 3600000),
    },
    {
      packageName: 'com.google.android.youtube',
      appName: 'YouTube',
      timeInForeground: Math.floor(Math.random() * 18000000 + 21600000), // 6-14h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 7200000),
    },
    {
      packageName: 'com.zhiliaoapp.musically',
      appName: 'TikTok',
      timeInForeground: Math.floor(Math.random() * 14400000 + 14400000), // 4-12h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 10800000),
    },
    {
      packageName: 'com.twitter.android',
      appName: 'Twitter',
      timeInForeground: Math.floor(Math.random() * 10800000 + 10800000), // 3-9h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 14400000),
    },
    {
      packageName: 'com.facebook.katana',
      appName: 'Facebook',
      timeInForeground: Math.floor(Math.random() * 7200000 + 7200000), // 2-6h
      lastTimeUsed: Date.now() - Math.floor(Math.random() * 18000000),
    },
  ];

  apps.sort((a, b) => b.timeInForeground - a.timeInForeground);

  const totalScreenTime = apps.reduce((sum, app) => sum + app.timeInForeground, 0);

  return {
    apps,
    totalScreenTime,
    pickups: weeklyPickups > 0 ? weeklyPickups : Math.floor(Math.random() * 200 + 600), // 600-800
  };
};

/**
 * Format milliseconds to human readable duration
 */
export const formatDuration = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate health score based on usage
 * Lower usage = higher health score
 */
export const calculateHealthScore = (totalScreenTimeMs: number, pickups: number): number => {
  // Target: < 3 hours screen time per day, < 80 pickups per day
  const targetScreenTime = 3 * 60 * 60 * 1000; // 3 hours in ms
  const targetPickups = 80;

  const screenTimeScore = Math.max(0, 100 - ((totalScreenTimeMs / targetScreenTime) * 50));
  const pickupsScore = Math.max(0, 100 - ((pickups / targetPickups) * 50));

  return Math.round((screenTimeScore + pickupsScore) / 2);
};

/**
 * Get orb level (1-5) based on health score
 */
export const getOrbLevel = (healthScore: number): number => {
  if (healthScore >= 90) return 5;
  if (healthScore >= 75) return 4;
  if (healthScore >= 60) return 3;
  if (healthScore >= 40) return 2;
  return 1;
};

/**
 * Setup guide for users who want real tracking
 */
export const TRACKING_SETUP_GUIDE = `
# Real Usage Tracking Setup

## For iOS (Expo):
Due to Apple's privacy restrictions, iOS apps cannot access usage data from other apps.

**Options:**
1. **Screen Time API** (Limited):
   - Requires Family Sharing setup
   - User must manually enable sharing
   - Very limited data access

2. **Manual Tracking**:
   - User inputs their own usage data
   - Use iOS Shortcuts automation
   - Integrate with Apple Health

3. **Use this app as primary**:
   - Track activities within LockIn
   - Set goals and timers
   - Self-reporting

## For Android (Expo):
With Expo, you need to create a custom development build.

**Steps:**
1. Install expo-dev-client
2. Create config plugin for UsageStatsManager
3. Build custom development build
4. Request PACKAGE_USAGE_STATS permission

## Current Implementation:
The app currently uses simulated data for demonstration.
Real pickup counting works using app state tracking.
`;
