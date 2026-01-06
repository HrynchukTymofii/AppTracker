/**
 * Local app icons mapping for common social media and messaging apps
 * These are ONLY used as fallback when real app icon is not available
 */

// Fallback icon for apps without icons
export const FALLBACK_ICON = require('@/assets/icons/fallback.png');

// Local app icons mapping (used as fallback only)
export const APP_ICONS: { [key: string]: any } = {
  instagram: require('@/assets/icons/instagram.png'),
  youtube: require('@/assets/icons/youtube.png'),
  tiktok: require('@/assets/icons/tiktok.png'),
  musically: require('@/assets/icons/tiktok.png'),
  facebook: require('@/assets/icons/facebook.png'),
  telegram: require('@/assets/icons/telegram.png'),
  pinterest: require('@/assets/icons/pinterest.png'),
  linkedin: require('@/assets/icons/linkedin.png'),
  twitter: require('@/assets/icons/x.png'),
  netflix: require('@/assets/icons/netflix.png'),
  threads: require('@/assets/icons/threads.jpg'),
};

/**
 * Get local icon for app based on package name or app name
 * Returns the icon source if found, fallback icon otherwise
 * NOTE: This should only be used when real app icon (iconUrl) is not available
 */
export const getLocalIcon = (packageName: string, appName: string): any => {
  const packageLower = packageName.toLowerCase();
  const nameLower = appName.toLowerCase();

  for (const [key, icon] of Object.entries(APP_ICONS)) {
    if (packageLower.includes(key) || nameLower.includes(key)) {
      return icon;
    }
  }
  return FALLBACK_ICON;
};

export default {
  APP_ICONS,
  FALLBACK_ICON,
  getLocalIcon,
};
