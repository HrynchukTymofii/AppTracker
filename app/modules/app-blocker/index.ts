import { NativeModule, requireNativeModule, Platform } from 'expo-modules-core';

interface AppBlockerModule extends NativeModule {
  // Common methods
  isAccessibilityServiceEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
  hasOverlayPermission(): Promise<boolean>;
  openOverlaySettings(): void;
  setBlockedApps(apps: string[]): void;
  getBlockedApps(): string[];
  showBlockInterstitial(packageName: string, appName: string): void;
  setTempUnblock(packageName: string, minutes: number): void;
  isTempUnblocked(packageName: string): Promise<boolean>;
  launchApp(packageName: string): boolean;

  // iOS-specific methods
  requestAuthorization?(): Promise<boolean>;
  isAuthorized?(): boolean;
}

let AppBlocker: AppBlockerModule | null = null;

try {
  AppBlocker = requireNativeModule<AppBlockerModule>('AppBlocker');
} catch (e) {
  console.warn('AppBlocker native module not available:', e);
}

export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  if (!AppBlocker) return false;
  return AppBlocker.isAccessibilityServiceEnabled();
}

export function openAccessibilitySettings(): void {
  if (AppBlocker) {
    AppBlocker.openAccessibilitySettings();
  }
}

export async function hasOverlayPermission(): Promise<boolean> {
  if (!AppBlocker) return false;
  return AppBlocker.hasOverlayPermission();
}

export function openOverlaySettings(): void {
  if (AppBlocker) {
    AppBlocker.openOverlaySettings();
  }
}

export function setBlockedApps(apps: string[]): void {
  if (AppBlocker) {
    AppBlocker.setBlockedApps(apps);
  }
}

export function getBlockedApps(): string[] {
  if (!AppBlocker) return [];
  return AppBlocker.getBlockedApps();
}

export function showBlockInterstitial(packageName: string, appName: string): void {
  if (AppBlocker) {
    AppBlocker.showBlockInterstitial(packageName, appName);
  }
}

export function setTempUnblock(packageName: string, minutes: number): void {
  if (AppBlocker) {
    AppBlocker.setTempUnblock(packageName, minutes);
  }
}

export async function isTempUnblocked(packageName: string): Promise<boolean> {
  if (!AppBlocker) return false;
  return AppBlocker.isTempUnblocked(packageName);
}

export function launchApp(packageName: string): boolean {
  if (!AppBlocker) return false;
  return AppBlocker.launchApp(packageName);
}

// iOS-specific: Request Family Controls authorization
export async function requestAuthorization(): Promise<boolean> {
  if (!AppBlocker || Platform.OS !== 'ios') {
    console.warn('requestAuthorization is only available on iOS');
    return false;
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

// iOS-specific: Check if authorized
export function isAuthorized(): boolean {
  if (!AppBlocker || Platform.OS !== 'ios') {
    return false;
  }
  if (AppBlocker.isAuthorized) {
    return AppBlocker.isAuthorized();
  }
  return false;
}

export default {
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
  hasOverlayPermission,
  openOverlaySettings,
  setBlockedApps,
  getBlockedApps,
  showBlockInterstitial,
  setTempUnblock,
  isTempUnblocked,
  launchApp,
  requestAuthorization,
  isAuthorized,
};
