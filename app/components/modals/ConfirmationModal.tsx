import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from "react-native";
import { AlertTriangle, Trash2, X, Info } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = "danger",
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  // Use translated defaults if not provided
  const finalConfirmText = confirmText ?? t("common.confirm");
  const finalCancelText = cancelText ?? t("common.cancel");
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const getColors = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "#ef4444",
          iconColor: "#ffffff",
          confirmBg: "#ef4444",
          confirmText: "#ffffff",
          accentColor: "#ef4444",
        };
      case "warning":
        return {
          iconBg: "#f59e0b",
          iconColor: "#ffffff",
          confirmBg: "#f59e0b",
          confirmText: "#ffffff",
          accentColor: "#f59e0b",
        };
      case "info":
        return {
          iconBg: "#3b82f6",
          iconColor: "#ffffff",
          confirmBg: "#3b82f6",
          confirmText: "#ffffff",
          accentColor: "#3b82f6",
        };
    }
  };

  const colors = getColors();

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <Trash2 size={32} color={colors.iconColor} />;
      case "warning":
        return <AlertTriangle size={32} color={colors.iconColor} />;
      case "info":
        return <Info size={32} color={colors.iconColor} />;
    }
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
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 20,
              paddingBottom: 0,
            }}
          >
            <View style={{ width: 40 }} />
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
            <TouchableOpacity
              onPress={onCancel}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={{ padding: 24, alignItems: "center" }}>
            {/* Icon */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.iconBg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                shadowColor: colors.iconBg,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {getIcon()}
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {title}
            </Text>

            {/* Message */}
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: isDark ? "#9ca3af" : "#6b7280",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {message}
            </Text>
          </View>

          {/* Buttons */}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                backgroundColor: colors.confirmBg,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                shadowColor: colors.confirmBg,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.confirmText,
                }}
              >
                {finalConfirmText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              style={{
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "#f3f4f6",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDark ? "#ffffff" : "#374151",
                }}
              >
                {finalCancelText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;
