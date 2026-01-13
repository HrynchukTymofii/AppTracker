import React from "react";
import { View, Text, TouchableOpacity, Modal, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { formatDuration } from "@/lib/usageTracking";
import { ORB_IMAGES, getLocalIcon } from "./constants";

interface DayTooltipProps {
  visible: boolean;
  day: any;
  isDark: boolean;
  onClose: () => void;
}

export const DayTooltip = ({
  visible,
  day,
  isDark,
  onClose,
}: DayTooltipProps) => {
  const { t } = useTranslation();

  if (!visible || !day) return null;

  const dateObj = new Date(day.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const orbImage = ORB_IMAGES[Math.min(day.orb_level - 1, 4)];

  // Parse apps data and get top 3
  const appsData = JSON.parse(day.apps_data || "[]");
  const top3Apps = appsData.slice(0, 3);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            borderRadius: 20,
            padding: 24,
            marginHorizontal: 20,
            maxWidth: 400,
            width: "90%",
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 15,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <Text style={{ fontSize: 18, color: isDark ? "#ffffff" : "#111827", fontWeight: "bold" }}>
              ×
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Image source={orbImage} style={{ width: 60, height: 60, marginBottom: 12 }} resizeMode="contain" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
                textAlign: "center",
              }}
            >
              {formattedDate}
            </Text>
          </View>

          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
                {t("stats.healthScore")}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}>
                {day.health_score}/100
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
                {t("stats.screenTime")}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}>
                {formatDuration(day.total_screen_time)}
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
                {t("stats.unlocks")}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}>
                {day.pickups}
              </Text>
            </View>
          </View>

          {top3Apps.length > 0 && (
            <>
              <View
                style={{
                  height: 1,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                  marginVertical: 12,
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginBottom: 8,
                }}
              >
                {t("stats.topApps")}
              </Text>
              {top3Apps.map((app: any, index: number) => {
                const localIcon = getLocalIcon(app.packageName || "", app.appName);
                const iconSource = localIcon || (app.iconUrl ? { uri: app.iconUrl } : null);
                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                      borderRadius: 8,
                    }}
                  >
                    {iconSource && (
                      <Image
                        source={iconSource}
                        style={{ width: 28, height: 28, borderRadius: 6, marginRight: 10 }}
                      />
                    )}
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: isDark ? "#ffffff" : "#111827",
                      }}
                    >
                      {app.appName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: isDark ? "#9ca3af" : "#6b7280",
                      }}
                    >
                      {formatDuration(app.timeInForeground)}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
