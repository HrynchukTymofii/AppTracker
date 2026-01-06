// Popular social media / time-wasting app keywords to match
export const POPULAR_APP_KEYWORDS = [
  "instagram",
  "youtube",
  "tiktok",
  "musically",
  "twitter",
  "facebook",
  "whatsapp",
  "snapchat",
  "reddit",
  "discord",
  "telegram",
  "messenger",
  "twitch",
  "netflix",
  "pinterest",
];

// Fallback icon
export const FALLBACK_ICON = require("@/assets/icons/fallback.png");

// Local app icons mapping (used as fallback only)
export const APP_ICONS: { [key: string]: any } = {
  instagram: require("@/assets/icons/instagram.png"),
  youtube: require("@/assets/icons/youtube.png"),
  tiktok: require("@/assets/icons/tiktok.png"),
  musically: require("@/assets/icons/tiktok.png"),
  facebook: require("@/assets/icons/facebook.png"),
  telegram: require("@/assets/icons/telegram.png"),
  pinterest: require("@/assets/icons/pinterest.png"),
  linkedin: require("@/assets/icons/linkedin.png"),
  twitter: require("@/assets/icons/x.png"),
  netflix: require("@/assets/icons/netflix.png"),
  threads: require("@/assets/icons/threads.jpg"),
};

// Get local icon for app based on package name or app name
// Returns fallback icon if no match found
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

// Helper function to get app icon emoji
export const getAppIcon = (packageName: string, appName: string): string => {
  const iconMap: { [key: string]: string } = {
    'com.instagram.android': '📷',
    'com.google.android.youtube': '▶️',
    'com.zhiliaoapp.musically': '🎵',
    'com.twitter.android': '🐦',
    'com.facebook.katana': '👥',
    'com.whatsapp': '💬',
    'com.snapchat.android': '👻',
    'com.reddit.frontpage': '🤖',
    'com.pinterest': '📌',
    'com.linkedin.android': '💼',
    'tv.twitch.android.app': '🎮',
    'com.discord': '💬',
    'com.spotify.music': '🎧',
    'com.netflix.mediaclient': '🎬',
    'com.amazon.avod.thirdpartyclient': '📺',
  };
  return iconMap[packageName] || appName.charAt(0);
};

// Check if app matches any popular keyword
export const isPopularApp = (packageName: string, appName: string): number => {
  const packageLower = packageName.toLowerCase();
  const nameLower = appName.toLowerCase();

  for (let i = 0; i < POPULAR_APP_KEYWORDS.length; i++) {
    const keyword = POPULAR_APP_KEYWORDS[i];
    if (packageLower.includes(keyword) || nameLower.includes(keyword)) {
      return i;
    }
  }
  return -1;
};
