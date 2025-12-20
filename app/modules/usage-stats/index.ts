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

export async function hasUsageStatsPermission(): Promise<boolean> {
  if (!UsageStats) return false;
  return UsageStats.hasUsageStatsPermission();
}

export function openUsageStatsSettings(): void {
  if (UsageStats) {
    UsageStats.openUsageStatsSettings();
  }
}

export async function getUsageStats(startTime: number, endTime: number): Promise<UsageStatsResult> {
  if (!UsageStats) {
    return { hasPermission: false, apps: [], totalScreenTime: 0, pickups: 0 };
  }
  return UsageStats.getUsageStats(startTime, endTime);
}

export async function getTodayUsageStats(): Promise<UsageStatsResult> {
  if (!UsageStats) {
    return { hasPermission: false, apps: [], totalScreenTime: 0, pickups: 0 };
  }
  return UsageStats.getTodayUsageStats();
}

export async function getWeekUsageStats(weekOffset: number): Promise<UsageStatsResult> {
  if (!UsageStats) {
    return { hasPermission: false, apps: [], totalScreenTime: 0, pickups: 0 };
  }
  return UsageStats.getWeekUsageStats(weekOffset);
}

export async function getDailyUsageForWeek(weekOffset: number): Promise<DailyUsage[]> {
  if (!UsageStats) {
    return [];
  }
  return UsageStats.getDailyUsageForWeek(weekOffset);
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (!UsageStats) {
    return [];
  }
  return UsageStats.getInstalledApps();
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
