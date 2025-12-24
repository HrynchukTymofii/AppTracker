import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Shield, ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface PermissionBannerProps {
  accessibilityEnabled: boolean;
  overlayEnabled: boolean;
  onAccessibilityPress: () => void;
  onOverlayPress: () => void;
}

export const PermissionBanner = ({
  accessibilityEnabled,
  overlayEnabled,
  onAccessibilityPress,
  onOverlayPress,
}: PermissionBannerProps) => {
  const { t } = useTranslation();

  if (accessibilityEnabled && overlayEnabled) {
    return null;
  }

  return (
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
          onPress={onAccessibilityPress}
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
          onPress={onOverlayPress}
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
  );
};
