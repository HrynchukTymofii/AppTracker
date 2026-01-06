import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Lock, Smartphone, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { formatDuration } from "@/lib/usageTracking";

interface AppUsage {
  packageName: string;
  appName?: string;
  iconUrl?: string;
  usageTime: number;
}

interface AppUsageListProps {
  appsUsage: AppUsage[];
  isLoading: boolean;
  isAppBlocked: (packageName: string) => boolean;
  isDark: boolean;
}

export const AppUsageList: React.FC<AppUsageListProps> = ({
  appsUsage,
  isLoading,
  isAppBlocked,
  isDark,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {t("home.appUsageToday")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/stats")}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Text
            style={{
              fontSize: 14,
              color: "#3b82f6",
              fontWeight: "600",
              marginRight: 4,
            }}
          >
            {t("profile.viewAll")}
          </Text>
          <ChevronRight size={16} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
            borderRadius: 16,
            padding: 40,
            alignItems: "center",
          }}
        >
          <Text style={{ color: isDark ? "#9ca3af" : "#6b7280", fontSize: 14 }}>
            {t("home.loadingApps")}
          </Text>
        </View>
      ) : appsUsage.length > 0 ? (
        <View
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          }}
        >
          {appsUsage.map((app, index) => (
            <View
              key={app.packageName || index}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderBottomWidth: index < appsUsage.length - 1 ? 1 : 0,
                borderBottomColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* App Icon with Blocked Badge */}
              <View style={{ position: "relative", marginRight: 12 }}>
                {app.iconUrl ? (
                  <Image
                    source={{ uri: app.iconUrl }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      opacity: isAppBlocked(app.packageName) ? 0.5 : 1,
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
                      opacity: isAppBlocked(app.packageName) ? 0.5 : 1,
                    }}
                  >
                    <Smartphone
                      size={20}
                      color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                  </View>
                )}
                {/* Blocked Badge */}
                {isAppBlocked(app.packageName) && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#ef4444",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: isDark ? "#000000" : "#ffffff",
                    }}
                  >
                    <Lock size={10} color="#ffffff" strokeWidth={3} />
                  </View>
                )}
              </View>

              {/* App Name */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isDark ? "#ffffff" : "#111827",
                    marginBottom: 2,
                  }}
                  numberOfLines={1}
                >
                  {app.appName || "Unknown App"}
                </Text>
                {/* Usage Progress Bar */}
                <View
                  style={{
                    height: 4,
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.06)",
                    borderRadius: 2,
                    marginTop: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${Math.min(
                        (app.usageTime / (appsUsage[0]?.usageTime || 1)) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        index === 0
                          ? "#ef4444"
                          : index === 1
                          ? "#f59e0b"
                          : "#3b82f6",
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>

              {/* Usage Time */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginLeft: 12,
                }}
              >
                {formatDuration(app.usageTime)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
            borderRadius: 16,
            padding: 40,
            alignItems: "center",
          }}
        >
          <Smartphone
            size={40}
            color={isDark ? "#4b5563" : "#9ca3af"}
            style={{ marginBottom: 12 }}
          />
          <Text
            style={{
              color: isDark ? "#9ca3af" : "#6b7280",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {t("stats.noUsageData")}
          </Text>
        </View>
      )}
    </View>
  );
};

export default AppUsageList;
