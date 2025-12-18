import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { RotateCcw, X } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ResetTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  testTitle: string;
}

export const ResetTestDialog = ({
  isOpen,
  onClose,
  onConfirm,
  testTitle,
}: ResetTestDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error resetting test:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            padding: 16,
            borderRadius: 16,
            width: "100%",
            maxWidth: 600,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
              padding: 8,
              backgroundColor: isDark ? "#334155" : "#f3f4f6",
              borderRadius: 8,
            }}
            activeOpacity={0.7}
          >
            <X size={20} color={isDark ? "#ffffff" : "#1f2937"} />
          </TouchableOpacity>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              marginBottom: 20,
              color: isDark ? "#ffffff" : "#1f2937",
              paddingLeft: 8,
            }}
          >
            Reset Test?
          </Text>

          {/* Description */}
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              lineHeight: 24,
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 8,
            }}
          >
            You've already completed
          </Text>
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#1f2937",
              marginBottom: 8,
            }}
          >
            "{testTitle}"
          </Text>
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              lineHeight: 24,
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 24,
            }}
          >
            Reset your results and start fresh?
          </Text>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: isDark ? "#334155" : "#f3f4f6",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e5e7eb",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#1f2937",
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              disabled={isLoading}
              onPress={handleConfirm}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: isLoading ? (isDark ? "#334155" : "#d1d5db") : "#06B6D4",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isLoading ? 0 : 0.1,
                shadowRadius: 4,
                elevation: isLoading ? 0 : 3,
              }}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{
                    color: isLoading ? (isDark ? "#9ca3af" : "#6b7280") : "#ffffff",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Reset Test
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
