import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check, Plus, Shield } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as UsageStats from "@/modules/usage-stats";
import type { InstalledApp } from "@/modules/usage-stats";
import { POPULAR_APPS } from "@/lib/appBlocking";
import { getLocalIcon } from "@/lib/appIcons";
import * as AppBlocker from "@/modules/app-blocker";
import {
  APPS_CACHE_KEY,
  APPS_CACHE_TIME_KEY,
  CACHE_DURATION,
  POPULAR_APP_KEYWORDS,
  getAppIconEmoji,
} from "./constants";

interface AppSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (apps: string[]) => void;
  selectedApps: string[];
  isDark: boolean;
}

export const AppSelectionModal = ({
  visible,
  onClose,
  onSelect,
  selectedApps,
  isDark,
}: AppSelectionModalProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(selectedApps);
  const [allInstalledApps, setAllInstalledApps] = useState<InstalledApp[]>([]);
  const [popularInstalledApps, setPopularInstalledApps] = useState<InstalledApp[]>([]);
  const [showAllApps, setShowAllApps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [iosPickerLoading, setIosPickerLoading] = useState(false);

  // iOS: Use native FamilyActivityPicker
  useEffect(() => {
    if (visible && Platform.OS === "ios") {
      handleIOSAppSelection();
    }
  }, [visible]);

  const handleIOSAppSelection = async () => {
    setIosPickerLoading(true);
    try {
      // Show native iOS app picker
      const result = await AppBlocker.showAppPicker();
      if (result && (result.appsCount > 0 || result.categoriesCount > 0)) {
        // Apply blocking immediately after selection
        AppBlocker.applyBlocking();
        // Notify parent with a placeholder - iOS uses tokens, not package names
        onSelect(["ios-family-controls-selection"]);
      }
    } catch (error) {
      console.error("Error showing iOS app picker:", error);
    } finally {
      setIosPickerLoading(false);
      onClose();
    }
  };

  // Reset state when modal opens (Android only)
  useEffect(() => {
    if (visible && Platform.OS === "android") {
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

  // Fetch apps fresh each time (icons are too large to cache)
  const fetchPopularApps = async () => {
    setLoading(true);
    try {
      const apps = await UsageStats.getInstalledApps();
      setAllInstalledApps(apps);
      setPopularInstalledApps(filterPopularApps(apps));
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
    // Prioritize real app icon, fallback to local bundled icon
    const fallbackIcon = getLocalIcon(app.packageName, app.appName);

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
        {app.iconUrl ? (
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
          <Image
            source={fallbackIcon}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              marginRight: 12,
            }}
          />
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

  // iOS: Don't render modal, native picker is used
  if (Platform.OS === "ios") {
    if (!visible) return null;
    // Show loading indicator while iOS picker is opening
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {iosPickerLoading && (
            <View
              style={{
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                padding: 24,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text
                style={{
                  marginTop: 12,
                  color: isDark ? "#ffffff" : "#111827",
                  fontSize: 16,
                }}
              >
                {t("blocking.modals.openingPicker") || "Opening app picker..."}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    );
  }

  // Android: Show full modal with app list
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
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
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
                {t("blocking.modals.loadingApps") || "Loading apps..."}
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
                  {t("blocking.modals.popularApps") || "Popular Apps"}
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
                    {t("blocking.modals.moreApps", { count: otherAppsCount }) ||
                      `More Apps (${otherAppsCount})`}
                  </Text>
                </TouchableOpacity>
              )}

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
