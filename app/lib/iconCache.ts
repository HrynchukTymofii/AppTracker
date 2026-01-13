/**
 * Icon Cache Module
 * Fetches and caches app icons in memory for the session
 * Icons are not persisted to AsyncStorage due to size constraints
 */

import { Platform } from 'react-native';

// Import native module
let NativeUsageStats: any = null;
try {
  NativeUsageStats = require('../modules/usage-stats').default;
} catch (e) {
  console.log('Native UsageStats module not available for icon cache');
}

// In-memory cache only (Base64 icons are too large for AsyncStorage)
let memoryCache: Map<string, string> = new Map();
let lastFetchTime = 0;
let isFetching = false;
let fetchPromise: Promise<void> | null = null;

/**
 * Fetch all app icons from native module
 */
export const fetchAppIcons = async (): Promise<void> => {
  // Return existing promise if already fetching
  if (isFetching && fetchPromise) {
    return fetchPromise;
  }

  // Skip if recently fetched (within 5 minutes)
  if (Date.now() - lastFetchTime < 5 * 60 * 1000 && memoryCache.size > 0) {
    return;
  }

  if (!NativeUsageStats || Platform.OS !== 'android') {
    return;
  }

  isFetching = true;
  fetchPromise = (async () => {
    try {
      console.log('[IconCache] Fetching app icons - calling native getInstalledApps...');
      const startTime = Date.now();

      const installedApps = await NativeUsageStats.getInstalledApps();
      console.log('[IconCache] getInstalledApps returned', `(${Date.now() - startTime}ms)`);

      if (installedApps && Array.isArray(installedApps)) {
        installedApps.forEach((app: { packageName: string; iconUrl: string }) => {
          if (app.packageName && app.iconUrl) {
            memoryCache.set(app.packageName, app.iconUrl);
          }
        });

        lastFetchTime = Date.now();
        console.log(`[IconCache] Cached ${memoryCache.size} app icons (${Date.now() - startTime}ms)`);
      }
    } catch (error) {
      console.error('[IconCache] Error fetching app icons:', error);
    } finally {
      isFetching = false;
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

/**
 * Get icon for a specific package
 */
export const getAppIcon = (packageName: string): string | null => {
  return memoryCache.get(packageName) || null;
};

/**
 * Get icons for multiple packages
 */
export const getAppIcons = (packageNames: string[]): Record<string, string> => {
  const result: Record<string, string> = {};
  packageNames.forEach(pkg => {
    const icon = memoryCache.get(pkg);
    if (icon) {
      result[pkg] = icon;
    }
  });
  return result;
};

/**
 * Check if icons are loaded
 */
export const hasIcons = (): boolean => {
  return memoryCache.size > 0;
};

/**
 * Get cache size (for debugging)
 */
export const getCacheSize = (): number => {
  return memoryCache.size;
};

/**
 * Clear the icon cache
 */
export const clearIconCache = (): void => {
  memoryCache.clear();
  lastFetchTime = 0;
};

/**
 * Initialize icon cache (call on app start)
 * Fetches icons in background - doesn't block
 */
export const initIconCache = async (): Promise<void> => {
  // Just fetch icons in background
  fetchAppIcons(); // Don't await - let it run in background
};
