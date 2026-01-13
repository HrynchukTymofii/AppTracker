import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  PanResponder,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import { X, ChevronRight } from "lucide-react-native";
import { AppSelectionModal } from "./AppSelectionModal";

interface DetoxSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  duration: number;
  setDuration: (d: number) => void;
  selectedApps: string[];
  setSelectedApps: (apps: string[]) => void;
  isDark: boolean;
}

export const DetoxSettingsModal = ({
  visible,
  onClose,
  duration,
  setDuration,
  selectedApps,
  setSelectedApps,
  isDark,
}: DetoxSettingsModalProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showAppSelection, setShowAppSelection] = useState(false);
  const durations = [15, 30, 45, 60, 90, 120];

  // Swipe-to-close gesture
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <Animated.View
          style={{
            backgroundColor: isDark ? "#000000" : "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingBottom: Math.max(20, insets.bottom),
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
            transform: [{ translateY }],
          }}
        >
          {/* Handle bar - swipe area */}
          <View
            {...panResponder.panHandlers}
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.1)",
                borderRadius: 2,
              }}
            />
          </View>
          <View
            style={{
              position: "relative",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
                paddingRight: 50,
              }}
            >
              {t("common.settings")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
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
        </Animated.View>
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
