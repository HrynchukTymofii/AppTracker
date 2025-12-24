/**
 * Shared constants for app and website blocking
 * Used across onboarding, schedule creation, and profile settings
 */

export interface BlockableApp {
  id: string; // Package name (Android)
  name: string;
  icon: any;
}

export interface BlockableWebsite {
  id: string; // Domain name
  name: string;
  icon: any;
}

// Social media apps with their package names
export const SOCIAL_MEDIA_APPS: BlockableApp[] = [
  { id: 'com.instagram.android', name: 'Instagram', icon: require('@/assets/icons/instagram.png') },
  { id: 'com.zhiliaoapp.musically', name: 'TikTok', icon: require('@/assets/icons/tiktok.png') },
  { id: 'com.google.android.youtube', name: 'YouTube', icon: require('@/assets/icons/youtube.png') },
  { id: 'com.twitter.android', name: 'X (Twitter)', icon: require('@/assets/icons/x.png') },
  { id: 'com.facebook.katana', name: 'Facebook', icon: require('@/assets/icons/facebook.png') },
  { id: 'com.snapchat.android', name: 'Snapchat', icon: null },
  { id: 'com.reddit.frontpage', name: 'Reddit', icon: null },
  { id: 'com.pinterest', name: 'Pinterest', icon: require('@/assets/icons/pinterest.png') },
  { id: 'org.telegram.messenger', name: 'Telegram', icon: require('@/assets/icons/telegram.png') },
  { id: 'com.discord', name: 'Discord', icon: null },
  { id: 'com.linkedin.android', name: 'LinkedIn', icon: null },
  { id: 'com.whatsapp', name: 'WhatsApp', icon: null },
];

// Popular websites that can be blocked
export const POPULAR_WEBSITES: BlockableWebsite[] = [
  { id: 'instagram.com', name: 'Instagram', icon: require('@/assets/icons/instagram.png') },
  { id: 'tiktok.com', name: 'TikTok', icon: require('@/assets/icons/tiktok.png') },
  { id: 'youtube.com', name: 'YouTube', icon: require('@/assets/icons/youtube.png') },
  { id: 'twitter.com', name: 'X (Twitter)', icon: require('@/assets/icons/x.png') },
  { id: 'facebook.com', name: 'Facebook', icon: require('@/assets/icons/facebook.png') },
  { id: 'reddit.com', name: 'Reddit', icon: null },
  { id: 'pinterest.com', name: 'Pinterest', icon: require('@/assets/icons/pinterest.png') },
  { id: 'twitch.tv', name: 'Twitch', icon: null },
  { id: 'discord.com', name: 'Discord', icon: null },
  { id: 'netflix.com', name: 'Netflix', icon: null },
  { id: 'hulu.com', name: 'Hulu', icon: null },
  { id: 'primevideo.com', name: 'Prime Video', icon: null },
];

// Default blocked apps (pre-selected in onboarding)
export const DEFAULT_BLOCKED_APPS = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',
  'com.google.android.youtube',
  'com.twitter.android',
];

// Default blocked websites (pre-selected in onboarding)
export const DEFAULT_BLOCKED_WEBSITES = [
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'twitter.com',
  'facebook.com',
  'reddit.com',
  'pinterest.com',
  'twitch.tv',
  'discord.com',
  'netflix.com',
  'hulu.com',
  'primevideo.com',
];

// Social media package names for detection
export const SOCIAL_PACKAGE_NAMES = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',
  'com.ss.android.ugc.trill',
  'com.google.android.youtube',
  'com.twitter.android',
  'com.facebook.katana',
  'com.facebook.orca',
  'com.snapchat.android',
  'com.reddit.frontpage',
  'com.pinterest',
  'org.telegram.messenger',
  'com.discord',
  'com.linkedin.android',
  'com.whatsapp',
  'com.Slack',
  'tv.twitch.android.app',
];

// Helper function to get app name by package name
export function getAppNameByPackage(packageName: string): string {
  const app = SOCIAL_MEDIA_APPS.find(a => a.id === packageName);
  return app?.name || packageName;
}

// Helper function to get website name by domain
export function getWebsiteNameByDomain(domain: string): string {
  const website = POPULAR_WEBSITES.find(w => w.id === domain);
  return website?.name || domain;
}
