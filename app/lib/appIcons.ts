/**
 * Local app icons mapping for common social media and messaging apps
 */

// Local app icons mapping
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
  x: require('@/assets/icons/x.png'),
};

/**
 * Get local icon for app based on package name or app name
 * Returns the icon source if found, null otherwise
 */
export const getLocalIcon = (packageName: string, appName: string): any | null => {
  const packageLower = packageName.toLowerCase();
  const nameLower = appName.toLowerCase();

  for (const [key, icon] of Object.entries(APP_ICONS)) {
    if (packageLower.includes(key) || nameLower.includes(key)) {
      return icon;
    }
  }
  return null;
};

export default {
  APP_ICONS,
  getLocalIcon,
};
