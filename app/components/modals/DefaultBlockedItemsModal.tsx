import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import {
  X,
  Check,
  Shield,
  Globe,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  getDefaultBlockedApps,
  getDefaultBlockedWebsites,
  setDefaultBlockedApps,
  setDefaultBlockedWebsites,
} from "@/lib/appBlocking";
import { SOCIAL_MEDIA_APPS, POPULAR_WEBSITES } from "@/lib/blockingConstants";

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
  const [activeTab, setActiveTab] = useState<'apps' | 'websites'>('apps');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadDefaults();
    }
  }, [visible]);

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

  const toggleApp = (appId: string) => {
    if (selectedApps.includes(appId)) {
      setSelectedApps(selectedApps.filter((a) => a !== appId));
    } else {
      setSelectedApps([...selectedApps, appId]);
    }
  };

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

          {/* Tabs */}
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
              {activeTab === 'apps' && (
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
                  {SOCIAL_MEDIA_APPS.map((app) => (
                    <TouchableOpacity
                      key={app.id}
                      onPress={() => toggleApp(app.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        backgroundColor: selectedApps.includes(app.id)
                          ? isDark
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(59, 130, 246, 0.1)"
                          : "transparent",
                        borderRadius: 12,
                        marginBottom: 6,
                      }}
                    >
                      {app.icon ? (
                        <Image
                          source={app.icon}
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
                          <Shield size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
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
                        {app.name}
                      </Text>
                      {selectedApps.includes(app.id) && (
                        <Check size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {activeTab === 'websites' && (
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
