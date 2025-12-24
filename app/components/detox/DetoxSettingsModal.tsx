import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
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
