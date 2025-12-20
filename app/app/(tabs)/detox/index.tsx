import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFocusEffect } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { useDetox } from "@/context/DetoxContext";
import { useTranslation } from 'react-i18next';
import { useBlocking } from "@/context/BlockingContext";
import { POPULAR_APPS } from "@/lib/appBlocking";
import { PRESET_TASKS } from "@/lib/taskVerification";
import * as ImagePicker from "expo-image-picker";
import * as UsageStats from "@/modules/usage-stats";
import type { InstalledApp } from "@/modules/usage-stats";
import {
  Lock,
  X,
  ChevronRight,
  Check,
  Camera,
  Target,
  Settings,
  Plus,
} from "lucide-react-native";
import { TaskVerificationModal } from "@/components/modals/TaskVerificationModal";

// Popular social media / time-wasting app keywords to match
const POPULAR_APP_KEYWORDS = [
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

// Helper function to get app icon
const getAppIcon = (packageName: string, appName: string): string => {
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

// Circular Timer Component
const CircularTimer = ({
  size = 280,
  strokeWidth = 12,
  timeRemaining,
  totalTime,
  isDark,
}: {
  size?: number;
  strokeWidth?: number;
  timeRemaining: number;
  totalTime: number;
  isDark: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (timeRemaining / totalTime) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <Circle
          stroke={isDark ? "#ffffff" : "#111827"}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Time in the middle */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {formatTime(timeRemaining)}
        </Text>
      </View>
    </View>
  );
};

// App Selection Modal Component (with real installed apps)
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
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(selectedApps);
  const [allInstalledApps, setAllInstalledApps] = useState<InstalledApp[]>([]);
  const [popularInstalledApps, setPopularInstalledApps] = useState<InstalledApp[]>([]);
  const [showAllApps, setShowAllApps] = useState(false);
  const [loading, setLoading] = useState(false);

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
        return i;
      }
    }
    return -1;
  };

  // Fetch apps
  const fetchPopularApps = async () => {
    setLoading(true);
    try {
      const apps = await UsageStats.getInstalledApps();
      setAllInstalledApps(apps);

      const popularWithIndex = apps
        .map((app) => ({ app, index: isPopularApp(app) }))
        .filter(({ index }) => index >= 0);

      popularWithIndex.sort((a, b) => a.index - b.index);
      const popular = popularWithIndex.slice(0, 15).map(({ app }) => app);
      setPopularInstalledApps(popular);
    } catch (error) {
      console.error("Error fetching apps:", error);
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

  const toggleApp = (packageName: string) => {
    if (selected.includes(packageName)) {
      setSelected(selected.filter((p) => p !== packageName));
    } else {
      setSelected([...selected, packageName]);
    }
  };

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
              ? "rgba(239, 68, 68, 0.15)"
              : "rgba(239, 68, 68, 0.1)"
            : "transparent",
          borderRadius: 12,
          marginBottom: 6,
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
          <Check size={20} color="#ef4444" />
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
            paddingBottom: Math.max(20, insets.bottom),
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

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                {t("blocking.modals.loadingApps")}
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
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
                  {t("blocking.modals.popularApps")}
                </Text>
              )}

              {displayedApps.map(renderAppItem)}

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
                    {t("blocking.modals.moreApps", { count: otherAppsCount })}
                  </Text>
                </TouchableOpacity>
              )}

              {showAllApps && (
                <TouchableOpacity
                  onPress={() => setShowAllApps(false)}
                  style={{ padding: 12, marginTop: 8, alignItems: "center" }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#ef4444",
                    }}
                  >
                    {t("blocking.modals.showPopularOnly")}
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
              backgroundColor: "#ef4444",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
              {t("blocking.modals.confirmSelection", { count: selected.length })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Detox Settings Modal
const DetoxSettingsModal = ({
  visible,
  onClose,
  duration,
  setDuration,
  selectedApps,
  setSelectedApps,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  duration: number;
  setDuration: (d: number) => void;
  selectedApps: string[];
  setSelectedApps: (apps: string[]) => void;
  isDark: boolean;
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showAppSelection, setShowAppSelection] = useState(false);
  const durations = [15, 30, 45, 60, 90, 120];

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
            paddingBottom: Math.max(20, insets.bottom),
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
              {t("common.settings")}
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

          {/* Duration Selection */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {t("blocking.modals.durationMinutes")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            {durations.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDuration(d)}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor:
                    duration === d
                      ? "#ef4444"
                      : isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "#f3f4f6",
                  borderWidth: duration === d ? 0 : 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <Text
                  style={{
                    color: duration === d ? "#ffffff" : isDark ? "#ffffff" : "#111827",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  {d}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Apps to Block */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {t("blocking.modals.appsToBlock")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowAppSelection(true)}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Text style={{ color: isDark ? "#ffffff" : "#111827", fontWeight: "500" }}>
              {selectedApps.length > 0
                ? t("blocking.modals.appsSelected", { count: selectedApps.length })
                : t("blocking.modals.selectAppsPlaceholder")}
            </Text>
            <ChevronRight size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "#ef4444",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
              {t("common.save")}
            </Text>
          </TouchableOpacity>
        </View>
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

// Focus Session Modal - Restyled
const FocusModal = ({
  visible,
  onClose,
  onStart,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onStart: (
    duration: number,
    apps: string[],
    requiresTask: boolean,
    beforePhoto?: string,
    taskDescription?: string
  ) => void;
  isDark: boolean;
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(30);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [requiresTask, setRequiresTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(PRESET_TASKS[0]);
  const [customTaskDescription, setCustomTaskDescription] = useState('');
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [showAppSelection, setShowAppSelection] = useState(false);

  const durations = [15, 30, 45, 60, 90, 120];

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBeforePhoto(result.assets[0].uri);
      }
    }
  };

  const handleStart = () => {
    if (selectedApps.length === 0) {
      Alert.alert(t('common.error'), t('blocking.alerts.selectAtLeastOneAppToBlock'));
      return;
    }

    if (requiresTask && !beforePhoto) {
      Alert.alert(t('common.error'), t('blocking.alerts.takeBeforePhoto'));
      return;
    }

    const taskDesc =
      selectedTask.id === 'custom' ? customTaskDescription : selectedTask.description;

    onStart(duration, selectedApps, requiresTask, beforePhoto || undefined, taskDesc);
    onClose();

    // Reset form
    setBeforePhoto(null);
    setRequiresTask(false);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#ef4444',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Target size={40} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Focus Session
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
              }}
            >
              Block distractions and get things done
            </Text>
          </View>

          {/* Duration Selection */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: isDark ? '#9ca3af' : '#6b7280',
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Duration
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {durations.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDuration(d)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor:
                      duration === d
                        ? '#ef4444'
                        : isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.05)',
                    borderWidth: duration === d ? 0 : 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  <Text
                    style={{
                      color: duration === d ? '#ffffff' : isDark ? '#ffffff' : '#111827',
                      fontWeight: '600',
                      fontSize: 15,
                    }}
                  >
                    {d}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Apps to Block */}
          <TouchableOpacity
            onPress={() => setShowAppSelection(true)}
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Lock size={22} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: isDark ? '#ffffff' : '#111827',
                    marginBottom: 4,
                  }}
                >
                  Apps to Block
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: selectedApps.length > 0 ? '#ef4444' : isDark ? '#6b7280' : '#9ca3af',
                    fontWeight: selectedApps.length > 0 ? '600' : '400',
                  }}
                >
                  {selectedApps.length > 0
                    ? `${selectedApps.length} apps selected`
                    : 'Tap to select...'}
                </Text>
              </View>
            </View>
            <ChevronRight size={22} color={isDark ? '#6b7280' : '#9ca3af'} />
          </TouchableOpacity>

          {/* Task Verification Toggle */}
          <View
            style={{
              backgroundColor: requiresTask
                ? isDark
                  ? 'rgba(59,130,246,0.1)'
                  : 'rgba(59,130,246,0.05)'
                : isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.03)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: requiresTask
                ? '#3b82f6'
                : isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Camera size={22} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: isDark ? '#ffffff' : '#111827',
                      marginBottom: 4,
                    }}
                  >
                    Task Verification
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? '#6b7280' : '#9ca3af',
                    }}
                  >
                    Prove you did something productive
                  </Text>
                </View>
              </View>
              <Switch
                value={requiresTask}
                onValueChange={setRequiresTask}
                trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Task Selection (if required) */}
          {requiresTask && (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 14,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Select Task
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16, marginHorizontal: -4 }}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                {PRESET_TASKS.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => setSelectedTask(task)}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      backgroundColor:
                        selectedTask.id === task.id
                          ? '#3b82f6'
                          : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.05)',
                      marginRight: 10,
                      alignItems: 'center',
                      minWidth: 85,
                      borderWidth: selectedTask.id === task.id ? 0 : 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    }}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{task.icon}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color:
                          selectedTask.id === task.id
                            ? '#ffffff'
                            : isDark
                            ? '#ffffff'
                            : '#111827',
                        fontWeight: '600',
                      }}
                    >
                      {task.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedTask.id === 'custom' && (
                <TextInput
                  value={customTaskDescription}
                  onChangeText={setCustomTaskDescription}
                  placeholder="Describe your task..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  multiline
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                    borderRadius: 14,
                    padding: 16,
                    color: isDark ? '#ffffff' : '#111827',
                    marginBottom: 16,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }}
                />
              )}

              {/* Before Photo */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Before Photo
              </Text>
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  backgroundColor: beforePhoto
                    ? 'transparent'
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#ffffff',
                  borderRadius: 16,
                  padding: beforePhoto ? 0 : 28,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: beforePhoto
                    ? '#10b981'
                    : isDark
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                {beforePhoto ? (
                  <Image
                    source={{ uri: beforePhoto }}
                    style={{ width: '100%', height: 180, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Camera size={28} color="#3b82f6" />
                    </View>
                    <Text
                      style={{
                        color: isDark ? '#ffffff' : '#111827',
                        fontSize: 15,
                        fontWeight: '600',
                      }}
                    >
                      Tap to take photo
                    </Text>
                    <Text
                      style={{
                        color: isDark ? '#6b7280' : '#9ca3af',
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      Show your starting point
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: 20 }} />

          {/* Start Button */}
          <TouchableOpacity
            onPress={handleStart}
            style={{
              backgroundColor: '#ef4444',
              padding: 18,
              borderRadius: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Lock size={22} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700' }}>
              Start Focus ({duration} min)
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 16,
              borderRadius: 16,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text
              style={{
                color: isDark ? '#9ca3af' : '#6b7280',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
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

export default function DetoxScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isActive, timeRemaining, startDetox, TOTAL_TIME } = useDetox();
  const { focusSession, startFocus, endFocus, refreshData } = useBlocking();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showTaskVerification, setShowTaskVerification] = useState(false);
  const [detoxDuration, setDetoxDuration] = useState(30); // Default 30 minutes
  const [detoxApps, setDetoxApps] = useState<string[]>([]); // Will be populated with installed time wasters
  const [appsLoaded, setAppsLoaded] = useState(false);

  // Load default time waster apps from installed apps
  useEffect(() => {
    const loadDefaultApps = async () => {
      if (appsLoaded) return;
      try {
        const apps = await UsageStats.getInstalledApps();

        // Find installed time waster apps
        const isPopularApp = (app: InstalledApp): number => {
          const packageLower = app.packageName.toLowerCase();
          const nameLower = app.appName.toLowerCase();
          for (let i = 0; i < POPULAR_APP_KEYWORDS.length; i++) {
            const keyword = POPULAR_APP_KEYWORDS[i];
            if (packageLower.includes(keyword) || nameLower.includes(keyword)) {
              return i;
            }
          }
          return -1;
        };

        const popularWithIndex = apps
          .map((app) => ({ app, index: isPopularApp(app) }))
          .filter(({ index }) => index >= 0);

        popularWithIndex.sort((a, b) => a.index - b.index);
        const defaultApps = popularWithIndex.slice(0, 15).map(({ app }) => app.packageName);

        setDetoxApps(defaultApps);
        setAppsLoaded(true);
      } catch (error) {
        console.error("Error loading default apps:", error);
        // Fallback to hardcoded popular app package names
        setDetoxApps(POPULAR_APPS.map(app => app.packageName).slice(0, 15));
        setAppsLoaded(true);
      }
    };

    loadDefaultApps();
  }, [appsLoaded]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  // Health score (dummy data)
  const healthScore = 85;

  const handleEndFocus = async () => {
    if (focusSession?.requiresTaskCompletion) {
      // Show the task verification chat modal
      setShowTaskVerification(true);
    } else {
      await endFocus();
    }
  };

  const handleTaskVerified = async () => {
    setShowTaskVerification(false);
    await endFocus();
    await refreshData();
  };

  const handleForceUnlock = async () => {
    setShowTaskVerification(false);
    await endFocus(); // End without verification
    await refreshData();
  };

  // Calculate remaining time for focus session
  const getFocusTimeRemaining = () => {
    if (!focusSession) return null;
    const endTime = focusSession.startTime + focusSession.durationMinutes * 60 * 1000;
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
          <View style={{ width: 40 }} />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            {t('detox.title')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowSettingsModal(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={22} color={isDark ? "#ffffff" : "#111827"} />
          </TouchableOpacity>
        </View>
  

        {/* Active Focus Session Banner */}
        {focusSession && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: '#ef4444',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Lock size={24} color="#ffffff" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#ffffff',
                }}
              >
                {t('blocking.focusSessionActive')}
              </Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>
              {focusSession.blockedApps.length} apps blocked •{' '}
              {focusSession.requiresTaskCompletion
                ? t('blocking.taskRequiredToUnlock')
                : `${getFocusTimeRemaining()} ${t('blocking.timeRemaining')}`}
            </Text>
            <TouchableOpacity
              onPress={handleEndFocus}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                {focusSession.requiresTaskCompletion ? t('blocking.completeTaskUnlock') : t('blocking.endSession')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timer Section */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 32,
            alignItems: "center",
          }}
        >

          <CircularTimer
            size={280}
            strokeWidth={12}
            timeRemaining={timeRemaining}
            totalTime={TOTAL_TIME}
            isDark={isDark}
          />

          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
              marginTop: 24,
              textAlign: "center",
            }}
          >
            {isActive
              ? "Click the Detox button to stop the timer"
              : "Click the Detox button to start the timer"
            }
          </Text>
        </View>

        {/* Start Focus Buttons */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24, gap: 12 }}>
          {/* Quick Focus Button */}
          <TouchableOpacity
            onPress={() => {
              if (detoxApps.length === 0) {
                Alert.alert(t('common.error'), t('blocking.alerts.selectAtLeastOneAppToBlock'));
                return;
              }
              startFocus(detoxDuration, detoxApps, false);
            }}
            disabled={!!focusSession}
            style={{
              backgroundColor: focusSession
                ? isDark
                  ? '#374151'
                  : '#e5e7eb'
                : '#ef4444',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Target size={28} color={focusSession ? '#9ca3af' : '#ffffff'} />
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: focusSession ? '#9ca3af' : '#ffffff',
                }}
              >
                {t('blocking.startFocus')}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: focusSession ? '#9ca3af' : 'rgba(255, 255, 255, 0.8)',
                  marginTop: 2,
                }}
              >
                {detoxDuration}m • {detoxApps.length} apps
              </Text>
            </View>
          </TouchableOpacity>

          {/* Focus with Task Button */}
          <TouchableOpacity
            onPress={() => setShowFocusModal(true)}
            disabled={!!focusSession}
            style={{
              backgroundColor: focusSession
                ? isDark
                  ? '#374151'
                  : '#e5e7eb'
                : isDark
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(59, 130, 246, 0.1)',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 1.5,
              borderColor: focusSession
                ? 'transparent'
                : '#3b82f6',
            }}
          >
            <Camera size={22} color={focusSession ? '#9ca3af' : '#3b82f6'} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: focusSession ? '#9ca3af' : '#3b82f6',
              }}
            >
              Focus with Task Verification
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 8,
              }}
            >
              About Digital Detox
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#9ca3af" : "#6b7280",
                lineHeight: 20,
              }}
            >
              Take a break from your phone and improve your mental health. During detox mode, you'll be encouraged to stay away from distracting apps.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <DetoxSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        duration={detoxDuration}
        setDuration={setDetoxDuration}
        selectedApps={detoxApps}
        setSelectedApps={setDetoxApps}
        isDark={isDark}
      />

      {/* Focus with Task Modal */}
      <FocusModal
        visible={showFocusModal}
        onClose={() => setShowFocusModal(false)}
        onStart={(duration, apps, requiresTask, beforePhoto, taskDescription) => {
          startFocus(duration, apps, requiresTask, beforePhoto, taskDescription);
          setShowFocusModal(false);
        }}
        isDark={isDark}
      />

      {/* Task Verification Chat Modal */}
      {focusSession?.requiresTaskCompletion && focusSession?.beforePhotoUri && (
        <TaskVerificationModal
          visible={showTaskVerification}
          taskDescription={
            focusSession.taskDescription || 'Complete your task'
          }
          beforePhotoUri={focusSession.beforePhotoUri}
          onClose={() => setShowTaskVerification(false)}
          onVerified={handleTaskVerified}
          onForceUnlock={handleForceUnlock}
        />
      )}
    </SafeAreaView>
  );
}
