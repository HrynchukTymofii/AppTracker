// ============================================
// USER STATE
// ============================================

export interface UserAnswers {
  age: number;
  dailyHours: number;
  realDailyHours: number | null;
  weeklyData: { day: string; hours: number }[] | null;
  blockedApps: string[];
  blockedWebsites: string[];
}

// ============================================
// CONSTANTS
// ============================================

export const SOCIAL_MEDIA_APPS = [
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

export const POPULAR_WEBSITES = [
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

export const DEFAULT_BLOCKED_APPS = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',
  'com.google.android.youtube',
  'com.twitter.android',
];

export const DEFAULT_BLOCKED_SITES = [
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

export const CURRENT_APP_PACKAGE = 'com.hrynchuk.appblocker';
