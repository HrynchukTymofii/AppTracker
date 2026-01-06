import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Lock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

interface FocusSession {
  startTime: number;
  durationMinutes: number;
  blockedApps: string[];
}

interface ActiveFocusSessionProps {
  focusSession: FocusSession;
}

export const ActiveFocusSession: React.FC<ActiveFocusSessionProps> = ({
  focusSession,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const getFocusRemainingTime = () => {
    const endTime =
      focusSession.startTime + focusSession.durationMinutes * 60 * 1000;
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/blocking")}
        activeOpacity={0.9}
        style={{
          backgroundColor: "#ef4444",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          shadowColor: "#ef4444",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <Lock size={28} color="#ffffff" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "700",
                fontSize: 18,
                marginBottom: 4,
              }}
            >
              {t("home.focusModeActive")}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
              {focusSession.blockedApps.length} {t("home.appsBlocked")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 28,
                fontWeight: "bold",
              }}
            >
              {getFocusRemainingTime()}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
              {t("blocking.timeRemaining")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ActiveFocusSession;
