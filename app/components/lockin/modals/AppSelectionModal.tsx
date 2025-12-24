import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { X, Check, Shield, Plus, ChevronDown, ChevronUp } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as UsageStats from "@/modules/usage-stats";
import type { InstalledApp } from "@/modules/usage-stats";
import { SOCIAL_MEDIA_APPS, DEFAULT_BLOCKED_APPS } from "@/lib/blockingConstants";
import { getLocalIcon } from "@/lib/appIcons";

interface AppSelectionModalProps {
  visible: boolean;
  isDark: boolean;
  selectedApps: string[];
  onClose: () => void;
  onSelect: (apps: string[]) => void;
}

// Cache keys
const APPS_CACHE_KEY = "@installed_apps_cache";
const APPS_CACHE_TIME_KEY = "@installed_apps_cache_time";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Popular app keywords for filtering
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

export const AppSelectionModal: React.FC<AppSelectionModalProps> = ({
  visible,
  isDark,
  selectedApps,
  onClose,
  onSelect,
}) => {
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
        fetchApps();
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

  // Filter and sort apps to get popular ones
  const filterPopularApps = (apps: InstalledApp[]): InstalledApp[] => {
    const popularWithIndex = apps
      .map((app) => ({ app, index: isPopularApp(app) }))
      .filter(({ index }) => index >= 0);

    popularWithIndex.sort((a, b) => a.index - b.index);
    return popularWithIndex.slice(0, 15).map(({ app }) => app);
  };

  const fetchApps = async () => {
    try {
      // Try cache first
      const cachedApps = await AsyncStorage.getItem(APPS_CACHE_KEY);
      const cacheTime = await AsyncStorage.getItem(APPS_CACHE_TIME_KEY);

      if (cachedApps) {
        const cachedData: { packageName: string; appName: string }[] = JSON.parse(cachedApps);
        const apps: InstalledApp[] = cachedData.map((app) => ({
          ...app,
          iconUrl: undefined,
        }));
        setAllInstalledApps(apps);
        setPopularInstalledApps(filterPopularApps(apps));
        setLoading(false);

        const isCacheFresh = cacheTime && Date.now() - parseInt(cacheTime) < CACHE_DURATION;
        if (isCacheFresh) {
          fetchIconsInBackground();
          return;
        }
      } else {
        setLoading(true);
      }

      // Fetch fresh data
      const apps = await UsageStats.getInstalledApps();

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
        SOCIAL_MEDIA_APPS.map((app) => ({
          packageName: app.id,
          appName: app.name,
          iconUrl: undefined,
        }))
      );
    }
    setLoading(false);
  };

  const fetchIconsInBackground = async () => {
    try {
      const apps = await UsageStats.getInstalledApps();
      setAllInstalledApps(apps);
      setPopularInstalledApps(filterPopularApps(apps));
    } catch (error) {
      // Silently fail
    }
  };

  const toggleApp = (packageName: string) => {
    if (selected.includes(packageName)) {
      setSelected(selected.filter((p) => p !== packageName));
    } else {
      setSelected([...selected, packageName]);
    }
  };

  const selectAllDefaults = () => {
    const newSelected = [...selected];
    DEFAULT_BLOCKED_APPS.forEach((pkg) => {
      if (!newSelected.includes(pkg)) {
        newSelected.push(pkg);
      }
    });
    setSelected(newSelected);
  };

  const displayedApps = showAllApps ? allInstalledApps : popularInstalledApps;
  const otherAppsCount = allInstalledApps.length - popularInstalledApps.length;

  const renderAppItem = (app: InstalledApp) => {
    const localIcon = getLocalIcon(app.packageName, app.appName);
    const isSelected = selected.includes(app.packageName);
    const isDefault = DEFAULT_BLOCKED_APPS.includes(app.packageName);

    return (
      <TouchableOpacity
        key={app.packageName}
        onPress={() => toggleApp(app.packageName)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          backgroundColor: isSelected
            ? "rgba(239, 68, 68, 0.15)"
            : isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          borderRadius: 14,
          marginBottom: 8,
          borderWidth: isSelected ? 1.5 : 1,
          borderColor: isSelected
            ? "#ef4444"
            : isDark
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(0, 0, 0, 0.04)",
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
              backgroundColor: isDark ? "#374151" : "#e5e7eb",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 18 }}>
              {app.appName.charAt(0).toUpperCase()}
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
            numberOfLines={1}
          >
            {app.appName}
          </Text>
          {isDefault && (
            <Text
              style={{
                fontSize: 11,
                color: "#ef4444",
                marginTop: 2,
                fontWeight: "500",
              }}
            >
              Recommended to block
            </Text>
          )}
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: isSelected ? "#ef4444" : isDark ? "rgba(255, 255, 255, 0.1)" : "#f3f4f6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected && <Check size={16} color="#ffffff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: Math.max(insets.bottom, 20),
            maxHeight: "85%",
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)",
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Shield size={22} color="#ef4444" />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  Apps to Block
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {selected.length} selected
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={selectAllDefaults}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.2)",
              }}
            >
              <Shield size={16} color="#ef4444" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#ef4444",
                  marginLeft: 8,
                }}
              >
                Add All Recommended Apps
              </Text>
            </TouchableOpacity>
          </View>

          {/* App List */}
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text
                style={{
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginTop: 12,
                }}
              >
                Loading apps...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ paddingHorizontal: 20, maxHeight: 350 }}
              showsVerticalScrollIndicator={false}
            >
              {!showAllApps && (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isDark ? "#6b7280" : "#9ca3af",
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Popular Distracting Apps
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
                    padding: 14,
                    marginTop: 4,
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f9fafb",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                    borderStyle: "dashed",
                  }}
                >
                  <Plus size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      fontWeight: "500",
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {otherAppsCount} More Apps
                  </Text>
                  <ChevronDown size={16} color={isDark ? "#9ca3af" : "#6b7280"} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}

              {showAllApps && (
                <TouchableOpacity
                  onPress={() => setShowAllApps(false)}
                  style={{
                    padding: 12,
                    marginTop: 4,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <ChevronUp size={16} color="#3b82f6" />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#3b82f6",
                      marginLeft: 4,
                    }}
                  >
                    Show Less
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Confirm Button */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <TouchableOpacity
              onPress={() => {
                onSelect(selected);
                onClose();
              }}
              style={{
                backgroundColor: "#ef4444",
                paddingVertical: 16,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#ef4444",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Shield size={20} color="#ffffff" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#ffffff",
                  marginLeft: 8,
                }}
              >
                Block {selected.length} Apps
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AppSelectionModal;
