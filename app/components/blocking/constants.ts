// Cache keys for installed apps (v2 includes iconUrl)
export const APPS_CACHE_KEY = "@installed_apps_cache_v2";
export const APPS_CACHE_TIME_KEY = "@installed_apps_cache_time_v2";
export const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache validity

// Helper function to get app icon emoji
export const getAppIconEmoji = (packageName: string, appName: string): string => {
  const iconMap: { [key: string]: string } = {
    "com.instagram.android": "📷",
    "com.google.android.youtube": "▶️",
    "com.zhiliaoapp.musically": "🎵",
    "com.twitter.android": "🐦",
    "com.facebook.katana": "👥",
    "com.whatsapp": "💬",
    "com.snapchat.android": "👻",
    "com.reddit.frontpage": "🤖",
    "com.pinterest": "📌",
    "com.linkedin.android": "💼",
    "tv.twitch.android.app": "🎮",
    "com.discord": "💬",
    "com.spotify.music": "🎧",
    "com.netflix.mediaclient": "🎬",
    "com.amazon.avod.thirdpartyclient": "📺",
  };
  return iconMap[packageName] || appName.charAt(0);
};

// Popular social media / time-wasting app keywords to match (max 15 apps shown)
export const POPULAR_APP_KEYWORDS = [
  "instagram",
  "youtube",
  "tiktok",
  "musically", // TikTok alternative package
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

// Suggested schedule templates
export const SUGGESTED_SCHEDULES = [
  {
    id: "morning_focus",
    emoji: "🌅",
    nameKey: "blocking.suggestedSchedules.morningFocus",
    defaultName: "Morning Focus",
    startTime: "06:00",
    endTime: "09:00",
    daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
  },
  {
    id: "deep_work",
    emoji: "🧠",
    nameKey: "blocking.suggestedSchedules.deepWork",
    defaultName: "Deep Work",
    startTime: "09:00",
    endTime: "12:00",
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: "lunch_break",
    emoji: "🍽️",
    nameKey: "blocking.suggestedSchedules.lunchBreak",
    defaultName: "Lunch Break",
    startTime: "12:00",
    endTime: "13:00",
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: "gym_time",
    emoji: "💪",
    nameKey: "blocking.suggestedSchedules.gymTime",
    defaultName: "Gym Time",
    startTime: "17:00",
    endTime: "19:00",
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
  },
  {
    id: "evening_winddown",
    emoji: "🌙",
    nameKey: "blocking.suggestedSchedules.eveningWinddown",
    defaultName: "Evening Wind Down",
    startTime: "21:00",
    endTime: "23:00",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
  },
  {
    id: "study_session",
    emoji: "📚",
    nameKey: "blocking.suggestedSchedules.studySession",
    defaultName: "Study Session",
    startTime: "14:00",
    endTime: "17:00",
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: "family_time",
    emoji: "👨‍👩‍👧‍👦",
    nameKey: "blocking.suggestedSchedules.familyTime",
    defaultName: "Family Time",
    startTime: "18:00",
    endTime: "21:00",
    daysOfWeek: [0, 6], // Weekends
  },
  {
    id: "sleep_mode",
    emoji: "😴",
    nameKey: "blocking.suggestedSchedules.sleepMode",
    defaultName: "Sleep Mode",
    startTime: "23:00",
    endTime: "06:00",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
];

export type SuggestedScheduleTemplate = typeof SUGGESTED_SCHEDULES[number];

// Helper function to format days compactly
export const formatDaysCompact = (daysOfWeek: number[], t: any): string => {
  if (daysOfWeek.length === 7) return t("blocking.everyday") || "Every day";
  if (daysOfWeek.length === 5 && [1, 2, 3, 4, 5].every((d) => daysOfWeek.includes(d))) {
    return t("blocking.weekdays") || "Weekdays";
  }
  if (daysOfWeek.length === 2 && daysOfWeek.includes(0) && daysOfWeek.includes(6)) {
    return t("blocking.weekends") || "Weekends";
  }
  const dayNames = [
    t("common.dayNames.sun"),
    t("common.dayNames.mon"),
    t("common.dayNames.tue"),
    t("common.dayNames.wed"),
    t("common.dayNames.thu"),
    t("common.dayNames.fri"),
    t("common.dayNames.sat"),
  ];
  return daysOfWeek.sort().map((d) => dayNames[d]).join(" ");
};

// Helper function to get day abbreviations
export const getDayAbbreviations = (daysOfWeek: number[], t: any): string => {
  const dayNames = [
    t("common.dayNames.sun"),
    t("common.dayNames.mon"),
    t("common.dayNames.tue"),
    t("common.dayNames.wed"),
    t("common.dayNames.thu"),
    t("common.dayNames.fri"),
    t("common.dayNames.sat"),
  ];
  if (daysOfWeek.length === 7) return t("blocking.everyday") || "Everyday";
  if (daysOfWeek.length === 5 && daysOfWeek.every((d) => d >= 1 && d <= 5)) {
    return t("blocking.weekdays") || "Weekdays";
  }
  return daysOfWeek
    .sort()
    .map((d) => dayNames[d])
    .join(", ");
};

// Format time display (requires t function for localized units)
export const formatTime = (mins: number, t?: any): string => {
  const hUnit = t ? t("common.timeUnits.h") : "h";
  const mUnit = t ? t("common.timeUnits.m") : "m";
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}${hUnit} ${m}${mUnit}` : `${h}${hUnit}`;
  }
  return `${mins}${mUnit}`;
};
