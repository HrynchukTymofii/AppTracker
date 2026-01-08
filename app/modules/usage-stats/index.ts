import { NativeModule, requireNativeModule } from 'expo-modules-core';

interface UsageStatsModule extends NativeModule {
  hasUsageStatsPermission(): Promise<boolean>;
  openUsageStatsSettings(): void;
  getUsageStats(startTime: number, endTime: number): Promise<UsageStatsResult>;
  getTodayUsageStats(): Promise<UsageStatsResult>;
  getWeekUsageStats(weekOffset: number): Promise<UsageStatsResult>;
  getDailyUsageForWeek(weekOffset: number): Promise<DailyUsage[]>;
  getInstalledApps(): Promise<InstalledApp[]>;
}

export interface UsageStatsResult {
  hasPermission: boolean;
  apps: AppUsage[];
  totalScreenTime: number;
  pickups: number;
}

export interface AppUsage {
  packageName: string;
  appName: string;
  timeInForeground: number;
  lastTimeUsed: number;
  iconUrl?: string;
}

export interface DailyUsage {
  day: string;
  hours: number;
}

export interface InstalledApp {
  packageName: string;
  appName: string;
  iconUrl?: string;
}

// This will throw an error if the module is not available
let UsageStats: UsageStatsModule | null = null;

try {
  UsageStats = requireNativeModule<UsageStatsModule>('UsageStats');
} catch (e) {
  console.warn('UsageStats native module not available:', e);
}

// Default empty result for error cases
const EMPTY_RESULT: UsageStatsResult = { hasPermission: false, apps: [], totalScreenTime: 0, pickups: 0 };

export async function hasUsageStatsPermission(): Promise<boolean> {
  if (!UsageStats) return false;
  try {
    return await UsageStats.hasUsageStatsPermission();
  } catch (error) {
    console.error('Error checking usage stats permission:', error);
    return false;
  }
}

export function openUsageStatsSettings(): void {
  if (!UsageStats) return;
  try {
    UsageStats.openUsageStatsSettings();
  } catch (error) {
    console.error('Error opening usage stats settings:', error);
  }
}

export async function getUsageStats(startTime: number, endTime: number): Promise<UsageStatsResult> {
  if (!UsageStats) return EMPTY_RESULT;
  try {
    return await UsageStats.getUsageStats(startTime, endTime);
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return EMPTY_RESULT;
  }
}

export async function getTodayUsageStats(): Promise<UsageStatsResult> {
  if (!UsageStats) return EMPTY_RESULT;
  try {
    return await UsageStats.getTodayUsageStats();
  } catch (error) {
    console.error('Error getting today usage stats:', error);
    return EMPTY_RESULT;
  }
}

export async function getWeekUsageStats(weekOffset: number): Promise<UsageStatsResult> {
  if (!UsageStats) return EMPTY_RESULT;
  try {
    return await UsageStats.getWeekUsageStats(weekOffset);
  } catch (error) {
    console.error('Error getting week usage stats:', error);
    return EMPTY_RESULT;
  }
}

export async function getDailyUsageForWeek(weekOffset: number): Promise<DailyUsage[]> {
  if (!UsageStats) return [];
  try {
    return await UsageStats.getDailyUsageForWeek(weekOffset);
  } catch (error) {
    console.error('Error getting daily usage for week:', error);
    return [];
  }
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (!UsageStats) return [];
  try {
    return await UsageStats.getInstalledApps();
  } catch (error) {
    console.error('Error getting installed apps:', error);
    return [];
  }
}

export default {
  hasUsageStatsPermission,
  openUsageStatsSettings,
  getUsageStats,
  getTodayUsageStats,
  getWeekUsageStats,
  getDailyUsageForWeek,
  getInstalledApps,
};
