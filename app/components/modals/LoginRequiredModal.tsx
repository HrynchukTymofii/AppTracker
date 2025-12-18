import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginRequiredModal = ({ isOpen, onClose }: Props) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
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
            Login Required
          </Text>

          {/* Description */}
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              lineHeight: 24,
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 24,
              paddingHorizontal: 8,
            }}
          >
            Sign in to unlock full access and sync your progress across all devices.
          </Text>

          {/* Login Button */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              router.push("/login");
            }}
            style={{
              backgroundColor: "#06B6D4",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Sign In / Register
            </Text>
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: isDark ? "#9ca3af" : "#6b7280",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
