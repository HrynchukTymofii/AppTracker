// Local app icons mapping
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
  x: require("@/assets/icons/x.png"),
};

// Orb images for health scores
export const ORB_IMAGES = [
  require("@/assets/images/orb1.png"),
  require("@/assets/images/orb2.png"),
  require("@/assets/images/orb3.jpg"),
  require("@/assets/images/orb4.jpg"),
  require("@/assets/images/orb5.jpg"),
];

// Get local icon for app based on package name or app name
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

// Get heatmap color based on health score
export const getHeatmapColor = (healthScore: number, isDark: boolean): string => {
  if (healthScore >= 80) {
    return isDark ? "#22c55e" : "#16a34a"; // Green - Excellent
  } else if (healthScore >= 60) {
    return isDark ? "#84cc16" : "#65a30d"; // Light green - Good
  } else if (healthScore >= 40) {
    return isDark ? "#facc15" : "#ca8a04"; // Yellow - Average
  } else if (healthScore >= 20) {
    return isDark ? "#f97316" : "#ea580c"; // Orange - Poor
  } else {
    return isDark ? "#ef4444" : "#dc2626"; // Red - Very poor
  }
};

// Get bar color based on rank
export const getBarColor = (index: number): string => {
  if (index === 0) return "#ef4444"; // Red for #1
  if (index === 1) return "#f59e0b"; // Orange for #2
  return "#3b82f6"; // Blue for rest
};
