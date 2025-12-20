import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Alert,
  Image,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Shield,
  Plus,
  Calendar,
  ChevronRight,
  X,
  Check,
  Unlock,
  Trash2,
  Clock,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useBlocking } from "@/context/BlockingContext";
import { BlockSchedule, POPULAR_APPS } from "@/lib/appBlocking";
import { useTranslation } from "react-i18next";
import * as UsageStats from "@/modules/usage-stats";
import type { InstalledApp } from "@/modules/usage-stats";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cache keys for installed apps
const APPS_CACHE_KEY = "@installed_apps_cache";
const APPS_CACHE_TIME_KEY = "@installed_apps_cache_time";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache validity

// Helper function to get app icon
const getAppIcon = (packageName: string, appName: string): string => {
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
// These are apps that typically consume a lot of time
const POPULAR_APP_KEYWORDS = [
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

// Local app icons mapping
const APP_ICONS: { [key: string]: any } = {
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

// Get local icon for app based on package name or app name
const getLocalIcon = (packageName: string, appName: string): any | null => {
  const packageLower = packageName.toLowerCase();
  const nameLower = appName.toLowerCase();

  for (const [key, icon] of Object.entries(APP_ICONS)) {
    if (packageLower.includes(key) || nameLower.includes(key)) {
      return icon;
    }
  }
  return null;
};

// App Selection Modal Component
const AppSelectionModal = ({
  visible,
  onClose,
  onSelect,
  selectedApps,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (apps: string[]) => void;
  selectedApps: string[];
  isDark: boolean;
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>(selectedApps);
  const [allInstalledApps, setAllInstalledApps] = useState<InstalledApp[]>([]);
  const [popularInstalledApps, setPopularInstalledApps] = useState<InstalledApp[]>([]);
  const [showAllApps, setShowAllApps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelected(selectedApps);
      setShowAllApps(false);
      if (popularInstalledApps.length === 0) {
        fetchPopularApps();
      }
    }
  }, [visible]);

  // Check if app matches any popular keyword
  const isPopularApp = (app: InstalledApp): number => {
    const packageLower = app.packageName.toLowerCase();
    const nameLower = app.appName.toLowerCase();

    for (let i = 0; i < POPULAR_APP_KEYWORDS.length; i++) {
      const keyword = POPULAR_APP_KEYWORDS[i];
      if (packageLower.includes(keyword) || nameLower.includes(keyword)) {
        return i; // Return the priority index
      }
    }
    return -1; // Not a popular app
  };

  // Filter and sort apps to get popular ones
  const filterPopularApps = (apps: InstalledApp[]): InstalledApp[] => {
    const popularWithIndex = apps
      .map((app) => ({ app, index: isPopularApp(app) }))
      .filter(({ index }) => index >= 0);

    popularWithIndex.sort((a, b) => a.index - b.index);
    return popularWithIndex.slice(0, 15).map(({ app }) => app);
  };

  // Load apps from cache first, then refresh in background
  const fetchPopularApps = async () => {
    try {
      // Try to load from cache first (instant)
      const cachedApps = await AsyncStorage.getItem(APPS_CACHE_KEY);
      const cacheTime = await AsyncStorage.getItem(APPS_CACHE_TIME_KEY);

      if (cachedApps) {
        // Cache only has packageName and appName (no icons to save space)
        const cachedData: { packageName: string; appName: string }[] = JSON.parse(cachedApps);
        const apps: InstalledApp[] = cachedData.map((app) => ({
          ...app,
          iconUrl: undefined, // Icons loaded fresh
        }));
        setAllInstalledApps(apps);
        setPopularInstalledApps(filterPopularApps(apps));
        setLoading(false);

        // Check if cache is still fresh
        const isCacheFresh = cacheTime &&
          Date.now() - parseInt(cacheTime) < CACHE_DURATION;

        if (isCacheFresh) {
          // Fetch icons in background for displayed apps
          fetchIconsInBackground();
          return;
        }
      } else {
        // No cache, show loading
        setLoading(true);
      }

      // Fetch fresh data
      const apps = await UsageStats.getInstalledApps();

      // Save to cache WITHOUT icons (too large for AsyncStorage)
      const cacheData = apps.map((app) => ({
        packageName: app.packageName,
        appName: app.appName,
      }));
      await AsyncStorage.setItem(APPS_CACHE_KEY, JSON.stringify(cacheData));
      await AsyncStorage.setItem(APPS_CACHE_TIME_KEY, Date.now().toString());

      setAllInstalledApps(apps);
      setPopularInstalledApps(filterPopularApps(apps));
    } catch (error) {
      console.error("Error fetching apps:", error);
      // Fallback to hardcoded list
      setPopularInstalledApps(
        POPULAR_APPS.map((app) => ({
          packageName: app.packageName,
          appName: app.appName,
          iconUrl: undefined,
        }))
      );
    }
    setLoading(false);
  };

  // Fetch icons for popular apps in background (improves UX)
  const fetchIconsInBackground = async () => {
    try {
      const apps = await UsageStats.getInstalledApps();
      setAllInstalledApps(apps);
      setPopularInstalledApps(filterPopularApps(apps));
    } catch (error) {
      // Silently fail - icons aren't critical
    }
  };

  const toggleApp = (packageName: string) => {
    if (selected.includes(packageName)) {
      setSelected(selected.filter((p) => p !== packageName));
    } else {
      setSelected([...selected, packageName]);
    }
  };

  // Get the apps to display
  const displayedApps = showAllApps ? allInstalledApps : popularInstalledApps;
  const otherAppsCount = allInstalledApps.length - popularInstalledApps.length;

  const renderAppItem = (app: InstalledApp) => {
    const localIcon = getLocalIcon(app.packageName, app.appName);

    return (
      <TouchableOpacity
        key={app.packageName}
        onPress={() => toggleApp(app.packageName)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          backgroundColor: selected.includes(app.packageName)
            ? isDark
              ? "rgba(59, 130, 246, 0.2)"
              : "rgba(59, 130, 246, 0.1)"
            : "transparent",
          borderRadius: 12,
          marginBottom: 6,
        }}
      >
        {/* App Icon - prefer local icon, then device icon, then emoji fallback */}
        {localIcon ? (
          <Image
            source={localIcon}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              marginRight: 12,
            }}
          />
        ) : app.iconUrl ? (
          <Image
            source={{ uri: app.iconUrl }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              marginRight: 12,
            }}
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: isDark ? "#374151" : "#f3f4f6",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20 }}>
              {getAppIcon(app.packageName, app.appName)}
            </Text>
          </View>
        )}
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "500",
            color: isDark ? "#ffffff" : "#111827",
          }}
          numberOfLines={1}
        >
          {app.appName}
        </Text>
        {selected.includes(app.packageName) && (
          <Check size={20} color="#3b82f6" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#000000" : "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: "85%",
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {t("blocking.modals.selectApps")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={isDark ? "#ffffff" : "#111827"} />
            </TouchableOpacity>
          </View>

          {/* App List */}
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                {t("blocking.modals.loadingApps") || "Loading apps..."}
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Popular Apps Section */}
              {!showAllApps && (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("blocking.modals.popularApps") || "Popular Apps"}
                </Text>
              )}

              {displayedApps.map(renderAppItem)}

              {/* More Apps Button */}
              {!showAllApps && otherAppsCount > 0 && (
                <TouchableOpacity
                  onPress={() => setShowAllApps(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                    marginTop: 8,
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#f3f4f6",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                    borderStyle: "dashed",
                  }}
                >
                  <Plus size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      fontWeight: "600",
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {t("blocking.modals.moreApps", { count: otherAppsCount }) ||
                      `More Apps (${otherAppsCount})`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Show "Back to Popular" when showing all apps */}
              {showAllApps && (
                <TouchableOpacity
                  onPress={() => setShowAllApps(false)}
                  style={{
                    padding: 12,
                    marginTop: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#3b82f6",
                    }}
                  >
                    {t("blocking.modals.showPopularOnly") || "← Show Popular Only"}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={() => {
              onSelect(selected);
              onClose();
            }}
            style={{
              backgroundColor: "#3b82f6",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
              {t("blocking.modals.confirmSelection", {
                count: selected.length,
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Schedule Creation Modal
const ScheduleModal = ({
  visible,
  onClose,
  onSave,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: Omit<BlockSchedule, "id" | "createdAt">) => void;
  isDark: boolean;
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [showAppSelection, setShowAppSelection] = useState(false);
  const nameInputRef = useRef<any>(null);

  const days = [
    { short: "S", full: t("days.sunday") || "Sunday" },
    { short: "M", full: t("days.monday") || "Monday" },
    { short: "T", full: t("days.tuesday") || "Tuesday" },
    { short: "W", full: t("days.wednesday") || "Wednesday" },
    { short: "T", full: t("days.thursday") || "Thursday" },
    { short: "F", full: t("days.friday") || "Friday" },
    { short: "S", full: t("days.saturday") || "Saturday" },
  ];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("blocking.alerts.enterScheduleName"));
      return;
    }
    if (selectedApps.length === 0) {
      Alert.alert(t("common.error"), t("blocking.alerts.selectAtLeastOneApp"));
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert(t("common.error"), t("blocking.alerts.selectAtLeastOneDay"));
      return;
    }

    onSave({
      name,
      apps: selectedApps,
      startTime,
      endTime,
      daysOfWeek: selectedDays,
      isActive: true,
    });

    // Reset form
    setName("");
    setSelectedApps([]);
    setStartTime("09:00");
    setEndTime("17:00");
    setSelectedDays([1, 2, 3, 4, 5]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            style={{
              backgroundColor: isDark ? "#000000" : "#ffffff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: 600,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                {t("blocking.modals.newSchedule")}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.04)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={isDark ? "#ffffff" : "#111827"} />
              </TouchableOpacity>
            </View>

            {/* Schedule Name */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 8,
              }}
            >
              {t("blocking.modals.scheduleName")}
            </Text>
            <TextInput
              ref={nameInputRef}
              value={name}
              onChangeText={setName}
              placeholder={t("blocking.modals.scheduleNamePlaceholder")}
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
                borderRadius: 12,
                padding: 16,
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 20,
                fontSize: 16,
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              }}
            />

          {/* Apps to Block */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 8,
            }}
          >
            {t("blocking.modals.appsToBlock")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowAppSelection(true)}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Text
              style={{
                color: isDark ? "#ffffff" : "#111827",
                fontSize: 16,
              }}
            >
              {selectedApps.length > 0
                ? t("blocking.modals.appsSelected", {
                    count: selectedApps.length,
                  })
                : t("blocking.modals.selectAppsPlaceholder")}
            </Text>
            <ChevronRight size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
          </TouchableOpacity>

          {/* Time Range */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginBottom: 8,
                }}
              >
                {t("blocking.modals.startTime")}
              </Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                style={{
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "#f9fafb",
                  borderRadius: 12,
                  padding: 16,
                  color: isDark ? "#ffffff" : "#111827",
                  textAlign: "center",
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginBottom: 8,
                }}
              >
                {t("blocking.modals.endTime")}
              </Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="17:00"
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                style={{
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "#f9fafb",
                  borderRadius: 12,
                  padding: 16,
                  color: isDark ? "#ffffff" : "#111827",
                  textAlign: "center",
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              />
            </View>
          </View>

          {/* Days */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 8,
            }}
          >
            {t("blocking.modals.repeatOn")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleDay(index)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: selectedDays.includes(index)
                    ? "#3b82f6"
                    : isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#f9fafb",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: selectedDays.includes(index)
                    ? "#3b82f6"
                    : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <Text
                  style={{
                    color: selectedDays.includes(index)
                      ? "#ffffff"
                      : isDark
                        ? "#9ca3af"
                        : "#6b7280",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: "#3b82f6",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
                {t("blocking.modals.saveSchedule")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <AppSelectionModal
        visible={showAppSelection}
        onClose={() => setShowAppSelection(false)}
        onSelect={setSelectedApps}
        selectedApps={selectedApps}
        isDark={isDark}
      />
    </Modal>
  );
};

// Helper function to get day abbreviations
const getDayAbbreviations = (daysOfWeek: number[], t: any): string => {
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  if (daysOfWeek.length === 7) return t("blocking.everyday") || "Everyday";
  if (daysOfWeek.length === 5 && daysOfWeek.every((d) => d >= 1 && d <= 5)) {
    return t("blocking.weekdays") || "Weekdays";
  }
  return daysOfWeek
    .sort()
    .map((d) => dayNames[d])
    .join(", ");
};

export default function BlockingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ openSchedule?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    blockedApps,
    schedules,
    addBlockedApp,
    removeBlockedApp,
    addSchedule,
    editSchedule,
    removeSchedule,
    refreshData,
    isLoading,
    isAccessibilityServiceEnabled,
    openAccessibilitySettings,
    hasOverlayPermission,
    openOverlaySettings,
    hasAllRequiredPermissions,
  } = useBlocking();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAppSelection, setShowAppSelection] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(false);

  // Open schedule modal if navigated with openSchedule param
  useEffect(() => {
    if (params.openSchedule === "true") {
      setShowScheduleModal(true);
      // Clear the param to prevent reopening on re-render
      router.setParams({ openSchedule: undefined });
    }
  }, [params.openSchedule]);

  // Refresh installed apps cache in background
  const refreshAppsCache = useCallback(async () => {
    try {
      const cacheTime = await AsyncStorage.getItem(APPS_CACHE_TIME_KEY);
      const isCacheFresh = cacheTime &&
        Date.now() - parseInt(cacheTime) < CACHE_DURATION;

      if (!isCacheFresh) {
        // Cache is stale, refresh in background
        const apps = await UsageStats.getInstalledApps();
        // Save WITHOUT icons (too large for AsyncStorage)
        const cacheData = apps.map((app) => ({
          packageName: app.packageName,
          appName: app.appName,
        }));
        await AsyncStorage.setItem(APPS_CACHE_KEY, JSON.stringify(cacheData));
        await AsyncStorage.setItem(APPS_CACHE_TIME_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error("Error refreshing apps cache:", error);
    }
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
      checkPermissions();
      refreshAppsCache(); // Refresh apps cache in background
    }, [refreshData, refreshAppsCache]),
  );

  // Check permissions on mount and when app comes to foreground
  useEffect(() => {
    checkPermissions();
    const interval = setInterval(checkPermissions, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkPermissions = async () => {
    const [accessibility, overlay] = await Promise.all([
      isAccessibilityServiceEnabled(),
      hasOverlayPermission(),
    ]);
    setAccessibilityEnabled(accessibility);
    setOverlayEnabled(overlay);
  };

  // Handle schedule creation and refresh
  const handleAddSchedule = async (
    schedule: Omit<BlockSchedule, "id" | "createdAt">,
  ) => {
    await addSchedule(schedule);
    await refreshData();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            {t("blocking.title")}
          </Text>
        </View>

        {/* Permission Warning Banner */}
        {Platform.OS === "android" &&
          (!accessibilityEnabled || !overlayEnabled) && (
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 20,
                backgroundColor: "#fbbf24",
                borderRadius: 16,
                padding: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Shield size={24} color="#78350f" />
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#78350f",
                  }}
                >
                  {t("blocking.setupRequired")}
                </Text>
              </View>
              <Text style={{ color: "#78350f", marginBottom: 16 }}>
                {t("blocking.permissionsDesc")}
              </Text>

              {!accessibilityEnabled && (
                <TouchableOpacity
                  onPress={openAccessibilitySettings}
                  style={{
                    backgroundColor: "rgba(120, 53, 15, 0.2)",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#78350f", fontWeight: "600" }}>
                    {t("blocking.accessibilityService")}
                  </Text>
                  <ChevronRight size={20} color="#78350f" />
                </TouchableOpacity>
              )}

              {!overlayEnabled && (
                <TouchableOpacity
                  onPress={openOverlaySettings}
                  style={{
                    backgroundColor: "rgba(120, 53, 15, 0.2)",
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: "#78350f", fontWeight: "600" }}>
                    {t("blocking.displayOverOtherApps")}
                  </Text>
                  <ChevronRight size={20} color="#78350f" />
                </TouchableOpacity>
              )}
            </View>
          )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: 16,
            }}
          >
            {t("blocking.quickActions")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowScheduleModal(true)}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Calendar size={28} color={isDark ? "#ffffff" : "#111827"} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {t("blocking.newSchedule")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar View Button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/scheduleCalendar")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Calendar size={20} color={isDark ? "#ffffff" : "#111827"} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                {t("blocking.calendarView") || "Calendar View"}
              </Text>
            </View>
            <ChevronRight
              size={20}
              color={isDark ? "#9ca3af" : "#6b7280"}
            />
          </TouchableOpacity>
        </View>

        {/* Schedules */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {t("blocking.schedules")}
            </Text>
          </View>

          {schedules.length === 0 ? (
            <View
              style={{
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#f9fafb",
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Calendar size={32} color={isDark ? "#6b7280" : "#9ca3af"} />
              <Text
                style={{
                  marginTop: 12,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  textAlign: "center",
                }}
              >
                {t("blocking.noSchedulesYet")}
                {"\n"}
                {t("blocking.createScheduleHint")}
              </Text>
            </View>
          ) : (
            schedules.map((schedule) => (
              <View
                key={schedule.id}
                style={{
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "#ffffff",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: isDark ? "#ffffff" : "#111827",
                      }}
                    >
                      {schedule.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: isDark ? "#9ca3af" : "#6b7280",
                        marginTop: 4,
                      }}
                    >
                      {schedule.startTime} - {schedule.endTime} •{" "}
                      {schedule.apps.length} apps
                    </Text>
                    {/* Weekday squares - Sunday to Saturday */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 10,
                        gap: 6,
                      }}
                    >
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                        // index 0 = Sunday (0), index 1 = Monday (1), etc.
                        const isActive = schedule.daysOfWeek.includes(index);
                        return (
                          <View
                            key={index}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              backgroundColor: isActive
                                ? isDark ? "#ffffff" : "#111827"
                                : "transparent",
                              borderWidth: isActive ? 0 : 1.5,
                              borderColor: isDark
                                ? "rgba(255, 255, 255, 0.2)"
                                : "rgba(0, 0, 0, 0.15)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "600",
                                color: isActive
                                  ? isDark ? "#000000" : "#ffffff"
                                  : isDark
                                    ? "#9ca3af"
                                    : "#6b7280",
                              }}
                            >
                              {day}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  <Switch
                    value={schedule.isActive}
                    onValueChange={(value) =>
                      editSchedule(schedule.id, { isActive: value })
                    }
                    trackColor={{ false: "#767577", true: "#3b82f6" }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      t("blocking.alerts.deleteSchedule"),
                      t("blocking.alerts.deleteScheduleConfirm"),
                      [
                        { text: t("common.cancel"), style: "cancel" },
                        {
                          text: t("common.delete"),
                          style: "destructive",
                          onPress: () => removeSchedule(schedule.id),
                        },
                      ],
                    );
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  }}
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text
                    style={{ color: "#ef4444", marginLeft: 8, fontSize: 14 }}
                  >
                    {t("common.delete")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Blocked Apps */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {t("blocking.blockedApps")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAppSelection(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#f3f4f6",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Plus size={16} color={isDark ? "#ffffff" : "#111827"} />
              <Text
                style={{
                  marginLeft: 4,
                  color: isDark ? "#ffffff" : "#111827",
                  fontWeight: "500",
                }}
              >
                {t("common.add")}
              </Text>
            </TouchableOpacity>
          </View>

          {blockedApps.filter((a) => a.isBlocked).length === 0 ? (
            <View
              style={{
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#f9fafb",
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Shield size={32} color={isDark ? "#6b7280" : "#9ca3af"} />
              <Text
                style={{
                  marginTop: 12,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  textAlign: "center",
                }}
              >
                {t("blocking.noAppsBlocked")}
                {"\n"}
                {t("blocking.addAppsHint")}
              </Text>
            </View>
          ) : (
            blockedApps
              .filter((a) => a.isBlocked)
              .map((app) => {
                const localIcon = getLocalIcon(app.packageName, app.appName);
                return (
                  <View
                    key={app.packageName}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "#f9fafb",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    {localIcon ? (
                      <Image
                        source={localIcon}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          marginRight: 12,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: isDark ? "#374151" : "#e5e7eb",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>
                          {getAppIcon(app.packageName, app.appName)}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: isDark ? "#ffffff" : "#111827",
                        }}
                      >
                        {app.appName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDark ? "#9ca3af" : "#6b7280",
                        }}
                      >
                        {app.blockType === "manual"
                          ? t("blocking.blockTypes.manual")
                          : app.blockType === "scheduled"
                            ? t("blocking.blockTypes.scheduled")
                            : app.blockType === "focus"
                              ? t("blocking.blockTypes.focus")
                              : app.blockType === "task"
                                ? t("blocking.blockTypes.task")
                                : t("blocking.blockTypes.dailyLimit")}
                      </Text>
                    </View>
                    {app.blockType === "manual" && (
                      <TouchableOpacity
                        onPress={() => removeBlockedApp(app.packageName)}
                      >
                        <Unlock size={20} color="#22c55e" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <ScheduleModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleAddSchedule}
        isDark={isDark}
      />

      <AppSelectionModal
        visible={showAppSelection}
        onClose={() => setShowAppSelection(false)}
        onSelect={async (apps) => {
          for (const packageName of apps) {
            const appInfo = POPULAR_APPS.find(
              (a) => a.packageName === packageName,
            );
            if (
              appInfo &&
              !blockedApps.some((a) => a.packageName === packageName)
            ) {
              await addBlockedApp(packageName, appInfo.appName);
            }
          }
        }}
        selectedApps={blockedApps
          .filter((a) => a.isBlocked)
          .map((a) => a.packageName)}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}
