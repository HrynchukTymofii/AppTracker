import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  Check,
  Shield,
  Globe,
  ChevronRight,
  Plus,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDefaultBlockedApps,
  getDefaultBlockedWebsites,
  setDefaultBlockedApps,
  setDefaultBlockedWebsites,
} from "@/lib/appBlocking";
import { SOCIAL_MEDIA_APPS, POPULAR_WEBSITES } from "@/lib/blockingConstants";
import * as AppBlocker from "@/modules/app-blocker";
import * as UsageStats from "@/modules/usage-stats";
import type { InstalledApp } from "@/modules/usage-stats";
import { getLocalIcon } from "@/lib/appIcons";

// Cache keys (v2 includes iconUrl)
const APPS_CACHE_KEY = "@installed_apps_cache_v2";
const APPS_CACHE_TIME_KEY = "@installed_apps_cache_time_v2";
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

interface DefaultBlockedItemsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  isDark: boolean;
}

export const DefaultBlockedItemsModal = ({
  visible,
  onClose,
  onSave,
  isDark,
}: DefaultBlockedItemsModalProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'apps' | 'websites'>('apps');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [iosPickerLoading, setIosPickerLoading] = useState(false);
  const [allInstalledApps, setAllInstalledApps] = useState<InstalledApp[]>([]);
  const [popularInstalledApps, setPopularInstalledApps] = useState<InstalledApp[]>([]);
  const [showAllApps, setShowAllApps] = useState(false);

  useEffect(() => {
    if (visible) {
      loadDefaults();
      setShowAllApps(false);
      if (Platform.OS === "android" && popularInstalledApps.length === 0) {
        fetchInstalledApps();
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

  // Fetch real installed apps (icons fetched separately - too large for cache)
  const fetchInstalledApps = async () => {
    setAppsLoading(true);
    try {
      // Always fetch fresh to get icons
      const apps = await UsageStats.getInstalledApps();
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
    } finally {
      setAppsLoading(false);
    }
  };

  // iOS: Handle native app picker
  const handleIOSAppSelection = async () => {
    setIosPickerLoading(true);
    try {
      const result = await AppBlocker.showAppPicker();
      if (result && (result.appsCount > 0 || result.categoriesCount > 0)) {
        AppBlocker.applyBlocking();
        onSave();
        onClose();
      }
    } catch (error) {
      console.error("Error showing iOS app picker:", error);
    } finally {
      setIosPickerLoading(false);
    }
  };

  const loadDefaults = async () => {
    setLoading(true);
    try {
      const [apps, websites] = await Promise.all([
        getDefaultBlockedApps(),
        getDefaultBlockedWebsites(),
      ]);
      setSelectedApps(apps);
      setSelectedWebsites(websites);
    } catch (error) {
      console.error('Error loading defaults:', error);
    }
    setLoading(false);
  };

  const toggleApp = (packageName: string) => {
    if (selectedApps.includes(packageName)) {
      setSelectedApps(selectedApps.filter((a) => a !== packageName));
    } else {
      setSelectedApps([...selectedApps, packageName]);
    }
  };

  const displayedApps = showAllApps ? allInstalledApps : popularInstalledApps;
  const otherAppsCount = allInstalledApps.length - popularInstalledApps.length;

  const toggleWebsite = (websiteId: string) => {
    if (selectedWebsites.includes(websiteId)) {
      setSelectedWebsites(selectedWebsites.filter((w) => w !== websiteId));
    } else {
      setSelectedWebsites([...selectedWebsites, websiteId]);
    }
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        setDefaultBlockedApps(selectedApps),
        setDefaultBlockedWebsites(selectedWebsites),
      ]);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving defaults:', error);
    }
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
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {t("profile.editBlockedItems") || "Edit Blocked Items"}
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

          {/* Tabs - Hide websites tab on iOS */}
          {Platform.OS === "android" ? (
            <View
              style={{
                flexDirection: "row",
                marginBottom: 16,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                borderRadius: 10,
                padding: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setActiveTab('apps')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: activeTab === 'apps'
                    ? isDark ? "#1f2937" : "#ffffff"
                    : "transparent",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Shield size={16} color={activeTab === 'apps' ? "#3b82f6" : isDark ? "#9ca3af" : "#6b7280"} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: activeTab === 'apps'
                      ? "#3b82f6"
                      : isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {t("blocking.modals.apps") || "Apps"} ({selectedApps.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('websites')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: activeTab === 'websites'
                    ? isDark ? "#1f2937" : "#ffffff"
                    : "transparent",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Globe size={16} color={activeTab === 'websites' ? "#3b82f6" : isDark ? "#9ca3af" : "#6b7280"} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: activeTab === 'websites'
                      ? "#3b82f6"
                      : isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {t("blocking.modals.websites") || "Websites"} ({selectedWebsites.length})
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Content */}
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                {t("common.loading") || "Loading..."}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              {(Platform.OS === "ios" || activeTab === 'apps') && (
                <>
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
                    {t("blocking.modals.selectApps") || "Select Apps"}
                  </Text>

                  {/* iOS: Show button to open native picker */}
                  {Platform.OS === "ios" ? (
                    <TouchableOpacity
                      onPress={handleIOSAppSelection}
                      disabled={iosPickerLoading}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: "#3b82f6",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Shield size={20} color="#ffffff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: isDark ? "#ffffff" : "#111827",
                          }}
                        >
                          {t("blocking.modals.selectAppsIOS") || "Select Apps to Block"}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: isDark ? "#9ca3af" : "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          {t("blocking.modals.openNativePicker") || "Opens system app picker"}
                        </Text>
                      </View>
                      {iosPickerLoading ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                      ) : (
                        <ChevronRight size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  ) : appsLoading ? (
                    // Android: Show loading state
                    <View style={{ padding: 40, alignItems: "center" }}>
                      <ActivityIndicator size="large" color="#3b82f6" />
                      <Text
                        style={{
                          color: isDark ? "#9ca3af" : "#6b7280",
                          marginTop: 12,
                          fontSize: 14,
                        }}
                      >
                        {t("blocking.modals.loadingApps") || "Loading apps..."}
                      </Text>
                    </View>
                  ) : (
                    // Android: Show real installed app list
                    <>
                      {!showAllApps && (
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: isDark ? "#6b7280" : "#9ca3af",
                            marginBottom: 8,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {t("blocking.modals.popularApps") || "Popular Apps"}
                        </Text>
                      )}
                      {displayedApps.map((app) => {
                        // Prioritize real app icon, fallback to local bundled icon
                        const fallbackIcon = getLocalIcon(app.packageName, app.appName);
                        return (
                          <TouchableOpacity
                            key={app.packageName}
                            onPress={() => toggleApp(app.packageName)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              padding: 12,
                              backgroundColor: selectedApps.includes(app.packageName)
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
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  marginRight: 12,
                                }}
                              />
                            ) : (
                              <Image
                                source={fallbackIcon}
                                style={{
                                  width: 36,
                                  height: 36,
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
                            {selectedApps.includes(app.packageName) && (
                              <Check size={20} color="#3b82f6" />
                            )}
                          </TouchableOpacity>
                        );
                      })}

                      {/* More Apps Button */}
                      {!showAllApps && otherAppsCount > 0 && (
                        <TouchableOpacity
                          onPress={() => setShowAllApps(true)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 14,
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

                      {/* Show Less Button */}
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
                    </>
                  )}
                </>
              )}

              {Platform.OS === "android" && activeTab === 'websites' && (
                <>
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
                    {t("blocking.modals.selectWebsites") || "Select Websites"}
                  </Text>
                  {POPULAR_WEBSITES.map((website) => (
                    <TouchableOpacity
                      key={website.id}
                      onPress={() => toggleWebsite(website.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        backgroundColor: selectedWebsites.includes(website.id)
                          ? isDark
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(59, 130, 246, 0.1)"
                          : "transparent",
                        borderRadius: 12,
                        marginBottom: 6,
                      }}
                    >
                      {website.icon ? (
                        <Image
                          source={website.icon}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            marginRight: 12,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: isDark ? "#374151" : "#e5e7eb",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Globe size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
                        </View>
                      )}
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 15,
                          fontWeight: "500",
                          color: isDark ? "#ffffff" : "#111827",
                        }}
                      >
                        {website.name}
                      </Text>
                      {selectedWebsites.includes(website.id) && (
                        <Check size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: "#3b82f6",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
              {t("common.save") || "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
